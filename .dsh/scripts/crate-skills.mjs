#!/usr/bin/env node
/**
 * crate-skills — dependency discovery and safe generated-skill management for
 * the rust-skills DeepSeek Harness bundle.
 *
 * This helper is intentionally dependency-free. It reads and writes only
 * `$DSH_HOME/skills` for generated crate skills, and it removes a directory
 * only when its `SKILL.md` carries `metadata.generated-by: rust-skills`.
 *
 * @module crate-skills
 */

import { execFileSync } from 'node:child_process'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { splitFrontmatter, unquote } from '../frontmatter.js'

/** Marker written into generated SKILL.md frontmatter. */
const GENERATED_BY = 'rust-skills'
/** Public DSH skill-name grammar. */
const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
/** Default timeout for cargo metadata. */
const CARGO_METADATA_TIMEOUT_MS = 120_000

/**
 * Resolve the Harness home.
 * @returns {string} absolute DSH home.
 */
export function dshHome() {
  return resolve(process.env.DSH_HOME || join(homedir(), '.dsh'))
}

/**
 * Resolve the user-level generated skill root.
 * @returns {string} absolute skills root.
 */
export function skillsRoot() {
  return join(dshHome(), 'skills')
}

/**
 * Normalize a crate name to the DSH kebab-case skill-name grammar.
 * @param {string} crate - crate name.
 * @returns {string} normalized skill name.
 */
export function normalizeSkillName(crate) {
  const raw = String(crate ?? '').trim()
  const normalized = raw
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (normalized === '' || !SKILL_NAME_RE.test(normalized)) {
    throw new Error(
      `invalid crate name ${JSON.stringify(crate)}: `
      + 'it does not normalize to a kebab-case skill name',
    )
  }
  return normalized
}

/**
 * Read generated-skill metadata from one SKILL.md.
 *
 * Block scalar bodies are skipped so a marker quoted inside a description
 * cannot mark a hand-written skill as generated.
 *
 * @param {string} file - absolute SKILL.md path.
 * @returns {Record<string, string> | null} metadata, or null when not generated.
 */
function readGeneratedMetadata(file) {
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    return null
  }

  const { frontmatter } = splitFrontmatter(text)
  if (frontmatter === '') return null

  /** @type {Record<string, string>} */
  const attrs = {}
  let blockIndent = null

  for (const line of frontmatter.split(/\r?\n/)) {
    if (line.trim() === '') continue

    const indent = /^[ \t]*/.exec(line)[0].length
    if (blockIndent !== null) {
      if (indent > blockIndent) continue
      blockIndent = null
    }

    const pair = /^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line)
    if (pair === null) continue

    const value = pair[2].trim()
    if (/^[|>][+-]?$/.test(value)) {
      blockIndent = indent
      continue
    }
    attrs[pair[1]] = unquote(value)
  }

  if (attrs['generated-by'] !== GENERATED_BY) return null
  return attrs
}

/**
 * Read generated metadata for a skill directory.
 * @param {string} directory - skill directory.
 * @returns {{ crate: string, version: string | null, generatedAt: string | null, source: string | null, file: string } | null} metadata.
 */
function readSkillMetadata(directory) {
  const file = join(directory, 'SKILL.md')
  const attrs = readGeneratedMetadata(file)
  if (attrs === null) return null
  return {
    crate: attrs.crate || basename(directory),
    version: attrs['crate-version'] || null,
    generatedAt: attrs['generated-at'] || null,
    source: attrs.source || null,
    file,
  }
}

/**
 * List generated crate skills under one root.
 * @param {string} [root] - skills root; defaults to `$DSH_HOME/skills`.
 * @returns {object[]} generated skill records sorted by skill name.
 */
export function listGeneratedSkills(root = skillsRoot()) {
  let entries
  try {
    entries = readdirSync(root, { withFileTypes: true })
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return []
    throw error
  }

  const skills = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue

    const directory = join(root, entry.name)
    let stat
    try {
      stat = statSync(directory)
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
      continue
    }
    if (!stat.isDirectory()) continue

    const metadata = readSkillMetadata(directory)
    if (metadata === null) continue

    skills.push({
      crate: metadata.crate,
      skillName: entry.name,
      version: metadata.version,
      generatedAt: metadata.generatedAt,
      source: metadata.source,
      path: directory,
      symlink: entry.isSymbolicLink(),
    })
  }

  return skills.sort((left, right) => left.skillName.localeCompare(right.skillName))
}

/**
 * Check whether a crate skill exists and whether rust-skills generated it.
 *
 * A directory that `prepare` created but no `SKILL.md` was written into yet is
 * reported as missing so a retry can reuse it.
 *
 * @param {string} crate - crate name or skill name.
 * @param {string} [root] - skills root.
 * @returns {object} check result.
 */
export function checkSkill(crate, root = skillsRoot()) {
  const skillName = normalizeSkillName(crate)
  const directory = join(root, skillName)

  let stat
  try {
    stat = statSync(directory)
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    return { crate, skillName, exists: false, generated: false, path: directory }
  }
  if (!stat.isDirectory()) {
    return { crate, skillName, exists: true, generated: false, path: directory }
  }

  const metadata = readSkillMetadata(directory)
  const hasSkillFile = existsSync(join(directory, 'SKILL.md'))
  return {
    crate,
    skillName,
    exists: hasSkillFile,
    generated: metadata !== null,
    version: metadata?.version ?? null,
    generatedAt: metadata?.generatedAt ?? null,
    path: directory,
  }
}

/**
 * Ensure a generated skill directory exists.
 *
 * Refuses to use a symlink or a directory that holds a hand-written skill. A
 * directory left behind by an interrupted `prepare` (no `SKILL.md`) is reused.
 *
 * @param {string} crate - crate name or skill name.
 * @param {{ force?: boolean, root?: string }} [options] - prepare options.
 * @returns {{ skillName: string, dir: string, file: string }} prepared paths.
 */
export function prepareSkill(crate, options = {}) {
  const root = options.root ?? skillsRoot()
  const skillName = normalizeSkillName(crate)
  const directory = join(root, skillName)

  if (existsSync(directory)) {
    const linkStat = lstatSync(directory)
    if (linkStat.isSymbolicLink()) {
      throw new Error(`refusing to use symlink at ${directory}`)
    }
    if (!linkStat.isDirectory()) {
      throw new Error(`refusing to replace non-directory at ${directory}`)
    }
    const metadata = readSkillMetadata(directory)
    if (metadata === null && existsSync(join(directory, 'SKILL.md'))) {
      throw new Error(`refusing to overwrite non-generated skill at ${directory}`)
    }
    if (metadata !== null && options.force !== true) {
      throw new Error(`skill already exists at ${directory}; pass --force to regenerate`)
    }
  }

  mkdirSync(directory, { recursive: true })
  return { skillName, dir: directory, file: join(directory, 'SKILL.md') }
}

/**
 * Remove generated crate skills. Non-generated skills are always refused.
 * @param {string[]} names - crate or skill names.
 * @param {{ all?: boolean, dryRun?: boolean, root?: string }} [options] - removal options.
 * @returns {{ root: string, dryRun: boolean, removed: string[], missing: string[], refused: object[] }} result.
 */
export function removeSkills(names, options = {}) {
  const root = options.root ?? skillsRoot()
  const dryRun = options.dryRun === true
  const generated = new Map(listGeneratedSkills(root).map((skill) => [skill.skillName, skill]))

  const targets = []
  const refused = []

  if (options.all === true) {
    targets.push(...generated.keys())
  } else {
    for (const name of names ?? []) {
      try {
        targets.push(normalizeSkillName(name))
      } catch (error) {
        refused.push({ name: String(name), reason: errorMessage(error) })
      }
    }
  }

  const removed = []
  const missing = []

  for (const skillName of [...new Set(targets)]) {
    const directory = join(root, skillName)
    if (!existsSync(directory)) {
      missing.push(skillName)
      continue
    }
    if (!generated.has(skillName)) {
      refused.push({ name: skillName, reason: 'not generated by rust-skills' })
      continue
    }

    const absolute = resolve(directory)
    if (dirname(absolute) !== resolve(root)) {
      refused.push({ name: skillName, reason: 'path escapes the skills root' })
      continue
    }

    let stat
    try {
      stat = lstatSync(absolute)
    } catch {
      missing.push(skillName)
      continue
    }
    if (stat.isSymbolicLink()) {
      refused.push({ name: skillName, reason: 'refusing to follow a symlink' })
      continue
    }
    if (!stat.isDirectory()) {
      refused.push({ name: skillName, reason: 'not a directory' })
      continue
    }

    if (!dryRun) rmSync(absolute, { recursive: true, force: false })
    removed.push(skillName)
  }

  return { root, dryRun, removed, missing, refused }
}

/**
 * Remove TOML comments without touching `#` inside strings.
 * @param {string} line - one TOML line.
 * @returns {string} line without its trailing comment.
 */
function stripTomlComment(line) {
  let quote = null
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (quote !== null) {
      if (character === '\\' && quote === '"') {
        index += 1
        continue
      }
      if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '#') return line.slice(0, index)
  }
  return line
}

/**
 * Whether braces in a TOML value are balanced.
 * @param {string} value - inline-table text.
 * @returns {boolean} true when balanced.
 */
function bracesBalanced(value) {
  let depth = 0
  let quote = null
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (quote !== null) {
      if (character === '\\' && quote === '"') {
        index += 1
        continue
      }
      if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '{') depth += 1
    else if (character === '}') depth -= 1
  }
  return depth <= 0
}

/**
 * Read a quoted TOML string, if the value is one.
 * @param {string} value - raw value.
 * @returns {string | null} string value.
 */
function parseTomlString(value) {
  const trimmed = String(value).trim()
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return unquote(trimmed)
  }
  if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1)
  }
  return null
}

/**
 * Extract `key = "value"` from an inline table body.
 * @param {string} body - inline table contents without braces.
 * @param {string} key - key to find.
 * @returns {string | null} value.
 */
function extractTomlString(body, key) {
  const pattern = new RegExp(
    `(?:^|[\\s,])${key}\\s*=\\s*("(?:[^"\\\\]|\\\\.)*"|'[^']*')`,
  )
  const match = pattern.exec(body)
  return match === null ? null : parseTomlString(match[1])
}

/**
 * Parse a Cargo dependency value.
 * @param {string} value - raw TOML value.
 * @returns {{ version: string | null, package: string | null, workspace: boolean, path: string | null }} parsed value.
 */
function parseInline(value) {
  const trimmed = String(value).trim()
  if (!trimmed.startsWith('{')) {
    return { version: parseTomlString(trimmed), package: null, workspace: false, path: null }
  }
  const body = trimmed.slice(1, -1)
  return {
    version: extractTomlString(body, 'version'),
    package: extractTomlString(body, 'package'),
    workspace: /\bworkspace\s*=\s*true\b/.test(body),
    path: extractTomlString(body, 'path'),
  }
}

/**
 * Parse dependency declarations from Cargo.toml text.
 *
 * This is the fallback used when `cargo metadata` is unavailable. It covers
 * the common single-line and inline-table forms and `workspace = true`.
 *
 * @param {string} text - Cargo.toml contents.
 * @returns {object[]} dependency records.
 */
export function parseCargoTomlText(text) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n')
  /** @type {Map<string, Map<string, string>>} */
  const sections = new Map()
  let section = null
  let pending = null

  const commit = (entry) => {
    let entries = sections.get(entry.section)
    if (entries === undefined) {
      entries = new Map()
      sections.set(entry.section, entries)
    }
    entries.set(entry.key, entry.value)
  }

  for (const raw of lines) {
    const line = stripTomlComment(raw).trim()
    if (line === '') continue

    const header = /^\[([^\]]+)\]$/.exec(line)
    if (header !== null) {
      if (pending !== null) {
        commit(pending)
        pending = null
      }
      section = header[1].trim()
      if (!sections.has(section)) sections.set(section, new Map())
      continue
    }

    if (section === null) continue

    if (pending !== null) {
      pending.value += ` ${line}`
      if (bracesBalanced(pending.value)) {
        commit(pending)
        pending = null
      }
      continue
    }

    const pair = /^([A-Za-z0-9_-]+)\s*=\s*(.+)$/.exec(line)
    if (pair === null) continue

    const entry = { section, key: pair[1], value: pair[2].trim() }
    if (entry.value.startsWith('{') && !bracesBalanced(entry.value)) {
      pending = entry
      continue
    }
    commit(entry)
  }

  if (pending !== null) commit(pending)

  const workspaceDeps = sections.get('workspace.dependencies') ?? new Map()
  const result = []

  for (const [sectionName, entries] of sections) {
    let kind = null
    if (sectionName === 'dependencies') kind = 'normal'
    else if (sectionName === 'dev-dependencies') kind = 'dev'
    else if (sectionName === 'build-dependencies') kind = 'build'
    if (kind === null) continue

    for (const [key, value] of entries) {
      const inline = parseInline(value)
      let resolved = inline

      if (inline.workspace) {
        const workspaceValue = workspaceDeps.get(key)
          ?? (inline.package === null ? undefined : workspaceDeps.get(inline.package))
        if (workspaceValue !== undefined) {
          const workspace = parseInline(workspaceValue)
          resolved = {
            version: inline.version ?? workspace.version,
            package: inline.package ?? workspace.package,
            workspace: true,
            path: inline.path ?? workspace.path,
          }
        }
      }

      const name = resolved.package ?? key
      let skillName
      try {
        skillName = normalizeSkillName(name)
      } catch {
        continue
      }

      result.push({
        name,
        skillName,
        req: resolved.version,
        version: null,
        kind,
        source: resolved.path === null ? 'unknown' : 'local',
        local: resolved.path !== null,
        path: resolved.path,
        rename: resolved.package === null || resolved.package === key ? null : key,
      })
    }
  }

  return dedupeDependencies(result)
}

/**
 * Keep one record per crate, preferring a normal dependency over dev/build.
 * @param {object[]} dependencies - dependency records.
 * @returns {object[]} deduplicated, sorted records.
 */
function dedupeDependencies(dependencies) {
  /** @type {Map<string, object>} */
  const byName = new Map()
  for (const dependency of dependencies) {
    const existing = byName.get(dependency.name)
    if (existing === undefined) {
      byName.set(dependency.name, dependency)
      continue
    }
    if (existing.kind !== 'normal' && dependency.kind === 'normal') {
      byName.set(dependency.name, dependency)
    }
  }
  return [...byName.values()].sort((left, right) => left.name.localeCompare(right.name))
}

/**
 * Reduce `cargo metadata --no-deps` JSON to direct workspace dependencies.
 *
 * `--no-deps` keeps the command read-only: it does not resolve a registry
 * graph or create/update `Cargo.lock`. Registry versions are therefore
 * unresolved here and the caller looks them up through crates.io.
 *
 * @param {object} metadata - parsed cargo metadata.
 * @param {string} project - project directory.
 * @returns {object} dependency report.
 */
export function parseCargoMetadata(metadata, project) {
  const packages = new Map((metadata.packages ?? []).map((entry) => [entry.id, entry]))
  const members = new Set(metadata.workspace_members ?? [])

  const result = []
  for (const memberId of members) {
    const member = packages.get(memberId)
    if (member === undefined) continue

    for (const dependency of member.dependencies ?? []) {
      let skillName
      try {
        skillName = normalizeSkillName(dependency.name)
      } catch {
        continue
      }

      result.push({
        name: dependency.name,
        skillName,
        req: dependency.req ?? null,
        version: null,
        kind: dependency.kind ?? 'normal',
        source: dependency.source ? 'registry' : 'local',
        local: !dependency.source,
        path: dependency.path ?? null,
        rename: dependency.rename ?? null,
      })
    }
  }

  return {
    project,
    workspace: members.size > 1,
    members: [...members]
      .map((id) => packages.get(id)?.manifest_path)
      .filter((value) => typeof value === 'string')
      .map((value) => dirname(value)),
    dependencies: dedupeDependencies(result),
  }
}

/**
 * Discover direct dependencies for a project.
 * @param {string} [directory] - project directory; defaults to cwd.
 * @returns {object} dependency report.
 */
export function readDeps(directory = process.cwd()) {
  const project = resolve(directory)

  try {
    const raw = execFileSync('cargo', ['metadata', '--format-version', '1', '--no-deps'], {
      cwd: project,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: CARGO_METADATA_TIMEOUT_MS,
      maxBuffer: 64 * 1024 * 1024,
    })
    return parseCargoMetadata(JSON.parse(raw), project)
  } catch (error) {
    const manifest = join(project, 'Cargo.toml')
    if (!existsSync(manifest)) {
      throw new Error(
        `cannot read dependencies for ${project}: ${errorMessage(error)}; `
        + 'no Cargo.toml was found either',
      )
    }
    return {
      project,
      workspace: false,
      members: [project],
      dependencies: parseCargoTomlText(readFileSync(manifest, 'utf8')),
      degraded: true,
      error: errorMessage(error),
    }
  }
}

/**
 * Extract one TOML section body.
 * @param {string} text - Cargo.toml contents.
 * @param {string} name - section name.
 * @returns {string} section body.
 */
function sectionBody(text, name) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n')
  const body = []
  let active = false
  for (const raw of lines) {
    const line = stripTomlComment(raw).trim()
    const header = /^\[([^\]]+)\]$/.exec(line)
    if (header !== null) {
      if (active) break
      active = header[1].trim() === name
      continue
    }
    if (active) body.push(line)
  }
  return body.join('\n')
}

/**
 * Read Cargo.toml package metadata for `--from-source`.
 * @param {string} directory - Rust project directory.
 * @returns {{ name: string, skillName: string, version: string | null, edition: string | null, description: string | null, path: string }} package metadata.
 */
export function readPackageInfo(directory) {
  const project = resolve(directory)
  const manifest = join(project, 'Cargo.toml')
  if (!existsSync(manifest)) {
    throw new Error(`no Cargo.toml at ${manifest}`)
  }

  const text = readFileSync(manifest, 'utf8')
  const body = sectionBody(text, 'package')
  const name = extractTomlString(body, 'name')
  if (name === null) {
    throw new Error(`Cargo.toml at ${manifest} has no package.name`)
  }

  return {
    name,
    skillName: normalizeSkillName(name),
    version: extractTomlString(body, 'version'),
    edition: extractTomlString(body, 'edition'),
    description: extractTomlString(body, 'description'),
    path: project,
  }
}

/**
 * Convert an unknown thrown value to a message.
 * @param {unknown} error - thrown value.
 * @returns {string} message.
 */
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Read the value following a flag.
 * @param {string[]} args - argument list.
 * @param {string} flag - flag name.
 * @returns {string | undefined} value.
 */
function optionValue(args, flag) {
  const index = args.indexOf(flag)
  if (index === -1) return undefined
  return args[index + 1]
}

/**
 * Require one positional argument.
 * @param {string | undefined} value - argument.
 * @param {string} name - argument name for the error.
 * @returns {string} value.
 */
function required(value, name) {
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`missing required argument <${name}>`)
  }
  return value
}

/** Print CLI help. */
function printHelp() {
  console.log(`crate-skills — rust-skills DSH helper

Usage:
  node crate-skills.mjs deps [--dir <path>]
  node crate-skills.mjs package <path>
  node crate-skills.mjs normalize <crate>
  node crate-skills.mjs check <crate>
  node crate-skills.mjs prepare <crate> [--force]
  node crate-skills.mjs list
  node crate-skills.mjs remove <crate ...> | --all [--dry-run]

Environment:
  DSH_HOME   Harness home (default: ~/.dsh)

Generated skills live under $DSH_HOME/skills and are removable only when
their SKILL.md carries metadata.generated-by: rust-skills.`)
}

/**
 * CLI entry point.
 * @param {string[]} [argv] - arguments after the script name.
 */
function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv

  switch (command) {
    case 'deps': {
      const directory = optionValue(rest, '--dir') ?? process.cwd()
      console.log(JSON.stringify(readDeps(directory), null, 2))
      break
    }
    case 'package': {
      console.log(JSON.stringify(readPackageInfo(required(rest[0], 'path')), null, 2))
      break
    }
    case 'normalize': {
      console.log(normalizeSkillName(required(rest[0], 'crate')))
      break
    }
    case 'check': {
      console.log(JSON.stringify(checkSkill(required(rest[0], 'crate')), null, 2))
      break
    }
    case 'prepare': {
      const crate = required(rest[0], 'crate')
      console.log(JSON.stringify(prepareSkill(crate, { force: rest.includes('--force') }), null, 2))
      break
    }
    case 'list': {
      console.log(JSON.stringify({ root: skillsRoot(), skills: listGeneratedSkills() }, null, 2))
      break
    }
    case 'remove': {
      const names = rest.filter((argument) => !argument.startsWith('--'))
      const result = removeSkills(names, {
        all: rest.includes('--all'),
        dryRun: rest.includes('--dry-run'),
      })
      console.log(JSON.stringify(result, null, 2))
      break
    }
    case undefined:
    case '--help':
    case '-h':
      printHelp()
      break
    default:
      throw new Error(`unknown command ${JSON.stringify(command)}; run with --help`)
  }
}

const invokedAsScript = process.argv[1] !== undefined
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href

if (invokedAsScript) {
  try {
    main()
  } catch (error) {
    console.error(`crate-skills: ${errorMessage(error)}`)
    process.exitCode = 1
  }
}
