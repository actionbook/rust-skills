/**
 * rust-skills DeepSeek Harness bundle.
 *
 * Registers one bundled skill provider on `ctx.skills` that serves:
 *   - the six user-invocable commands in `.dsh/skills/`
 *   - the 38 repository skills in `skills/`
 *
 * The provider interface is a plain object, so this package declares no
 * runtime dependencies and cannot fail on a peer range at install time.
 *
 * @module rust-skills
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { splitFrontmatter, unquote } from './frontmatter.js'

/** Directory containing this module (`.dsh`). */
const HERE = dirname(fileURLToPath(import.meta.url))
/** Package root. */
const PACKAGE_ROOT = resolve(HERE, '..')
/** Six command skills shipped with the bundle. */
const COMMAND_ROOT = join(HERE, 'skills')
/** 38 repository skills declared by `.claude-plugin/plugin.json`. */
const REPOSITORY_ROOT = join(PACKAGE_ROOT, 'skills')

/** Provider name registered on `ctx.skills`. */
const PROVIDER_NAME = 'rust-skills'
/** Precedence rank for packaged skill providers and bundled roots. */
const BUNDLED_SKILL_RANK = 600

/** Public skill-name grammar: lowercase kebab-case. */
const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Accepted YAML-ish boolean spellings. */
const BOOLEAN_TRUE = new Set(['true', 'yes', 'on', '1'])
/** Accepted YAML-ish boolean spellings. */
const BOOLEAN_FALSE = new Set(['false', 'no', 'off', '0'])

/** Cordis plugin name. */
export const name = 'rust-skills'
/** Service required by the bundled provider. */
export const inject = ['skills']

/**
 * Register the bundled `rust-skills` provider.
 * @param {object} ctx - Cordis context carrying `skills` and `logger`.
 */
export function apply(ctx) {
  const warn = createWarner(ctx)
  ctx.skills.registerProvider(() => createProvider(warn))
}

/**
 * Build the non-throwing warning sink used by the provider.
 * @param {object} ctx - Cordis context.
 * @returns {(message: string) => void} warning sink.
 */
function createWarner(ctx) {
  return (message) => {
    try {
      if (typeof ctx?.logger?.warn === 'function') {
        ctx.logger.warn(`${PROVIDER_NAME}: ${message}`)
        return
      }
    } catch {
      /* fall through to the console */
    }
    try {
      console.warn(`[${PROVIDER_NAME}] ${message}`)
    } catch {
      /* nothing left to report to */
    }
  }
}

/**
 * Parse the minimal YAML frontmatter used by `SKILL.md`.
 *
 * Supports scalar `key: value`, single- and double-quoted values, and the
 * `|`, `|-`, `>`, `>-` block scalars used by `rust-router` and `rust-daily`.
 *
 * @param {string} text - raw file contents.
 * @returns {{ attrs: Record<string, string>, body: string }} parsed parts.
 */
export function parseFrontmatter(text) {
  const { frontmatter, body } = splitFrontmatter(text)
  if (frontmatter === '') return { attrs: {}, body }

  /** @type {Record<string, string>} */
  const attrs = {}
  const lines = frontmatter.split(/\r?\n/)

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue

    const pair = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line)
    if (!pair) continue

    const key = pair[1]
    let value = pair[2].trim()

    if (/^[|>][+-]?$/.test(value)) {
      const folded = value[0] === '>'
      const chomp = value.slice(1)
      const collected = []
      let next = i + 1

      for (; next < lines.length; next += 1) {
        const following = lines[next]
        if (following === '' || /^[ \t]/.test(following)) {
          collected.push(following)
          continue
        }
        break
      }

      while (collected.length > 0 && collected[collected.length - 1].trim() === '') {
        collected.pop()
      }

      const nonBlank = collected.filter((entry) => entry.trim() !== '')
      const indent = nonBlank.length === 0
        ? 0
        : Math.min(...nonBlank.map((entry) => /^[ \t]*/.exec(entry)[0].length))

      const stripped = collected.map((entry) => {
        const own = /^[ \t]*/.exec(entry)[0].length
        return entry.slice(Math.min(indent, own))
      })

      value = folded ? foldBlock(stripped) : stripped.join('\n')
      if (chomp !== '-') value = value.replace(/\n+$/, '')
      i = next - 1
    } else {
      value = unquote(value)
    }

    attrs[key] = value
  }

  return { attrs, body }
}

/**
 * Fold a YAML `>` block: single newlines become spaces, blank lines newlines.
 * @param {string[]} lines - dedented block lines.
 * @returns {string} folded text.
 */
function foldBlock(lines) {
  let out = ''
  for (const raw of lines) {
    const line = raw.trim()
    if (line === '') {
      out += '\n'
      continue
    }
    if (out === '' || out.endsWith('\n')) out += line
    else out += ` ${line}`
  }
  return out.trimEnd()
}

/**
 * Resolve a DSH boolean frontmatter value.
 * @param {string | undefined} value - raw scalar.
 * @returns {boolean | undefined | 'invalid'} parsed value.
 */
function parseBoolean(value) {
  if (value === undefined) return undefined
  const normalized = String(value).trim().toLowerCase()
  if (BOOLEAN_TRUE.has(normalized)) return true
  if (BOOLEAN_FALSE.has(normalized)) return false
  return 'invalid'
}

/**
 * Parse one skill file into a provider candidate and body.
 * @param {string} text - raw file contents.
 * @param {string} file - absolute skill file path.
 * @param {(message: string) => void} warn - warning sink.
 * @returns {{ candidate: object, body: string } | undefined} parsed skill.
 */
function parseSkillText(text, file, warn) {
  const { attrs, body } = parseFrontmatter(text)

  const skillName = String(attrs.name ?? '').trim()
  if (!SKILL_NAME_RE.test(skillName)) {
    warn(`skill file ${file} ignored: name must be kebab-case, got ${JSON.stringify(attrs.name)}`)
    return undefined
  }

  const description = String(attrs.description ?? '').trim()
  if (description === '') {
    warn(`skill file ${file} ignored: description is required`)
    return undefined
  }

  const disableModel = parseBoolean(attrs['disable-model-invocation'])
  const userInvocable = parseBoolean(attrs['user-invocable'])
  if (disableModel === 'invalid' || userInvocable === 'invalid') {
    warn(`skill file ${file} ignored: invalid invocation frontmatter`)
    return undefined
  }

  const whenToUse = String(attrs.whenToUse ?? attrs['when-to-use'] ?? '').trim() || undefined
  const directory = dirname(file)

  const candidate = {
    path: file,
    name: skillName,
    description,
    ...(whenToUse === undefined ? {} : { whenToUse }),
    invocation: {
      modelInvocable: disableModel !== true,
      userInvocable: userInvocable !== false,
    },
    source: 'bundled',
    provider: PROVIDER_NAME,
    resourceBase: { kind: 'directory', path: directory },
    rank: BUNDLED_SKILL_RANK,
    locator: file,
  }

  return { candidate, body }
}

/**
 * List direct skill files under one root, following symlinks.
 * @param {string} root - directory to scan.
 * @param {(message: string) => void} warn - warning sink.
 * @returns {string[]} absolute `SKILL.md` or flat `.md` paths.
 */
function listSkillFiles(root, warn) {
  let entries
  try {
    entries = readdirSync(root, { withFileTypes: true })
  } catch (error) {
    if (error?.code !== 'ENOENT' && error?.code !== 'ENOTDIR') {
      warn(`cannot scan ${root}: ${error instanceof Error ? error.message : String(error)}`)
    }
    return []
  }

  const files = []
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name.startsWith('.')) continue
    const full = join(root, entry.name)

    let stat
    try {
      stat = statSync(full)
    } catch {
      continue
    }

    if (stat.isDirectory()) {
      const skillFile = join(full, 'SKILL.md')
      try {
        if (statSync(skillFile).isFile()) files.push(skillFile)
      } catch {
        /* no SKILL.md */
      }
    } else if (stat.isFile() && entry.name.endsWith('.md')) {
      files.push(full)
    }
  }
  return files
}

/**
 * Read one skill file into a candidate and body.
 * @param {string} file - absolute skill file path.
 * @param {(message: string) => void} warn - warning sink.
 * @returns {{ candidate: object, body: string } | undefined} parsed skill.
 */
function readSkillFile(file, warn) {
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch (error) {
    warn(`cannot read ${file}: ${error instanceof Error ? error.message : String(error)}`)
    return undefined
  }
  return parseSkillText(text, file, warn)
}

/**
 * Find the project root the way the filesystem skill provider does: the
 * nearest ancestor containing `.git`, or the working directory itself.
 * @param {string} cwd - lookup working directory.
 * @returns {string} absolute project root.
 */
function projectRootFor(cwd) {
  const start = resolve(cwd)
  let directory = start
  for (;;) {
    if (existsSync(join(directory, '.git'))) return directory
    const parent = dirname(directory)
    if (parent === directory) return start
    directory = parent
  }
}

/**
 * Whether this provider should serve `.dsh/skills` for a lookup.
 *
 * When the bundle runs inside the repository that owns `.dsh/skills`, the
 * filesystem provider already discovers those files at rank 100. Serving them
 * again at rank 600 would only log duplicate-skill warnings, so skip them in
 * that one case.
 *
 * @param {{ cwd?: string } | undefined} options - lookup options.
 * @returns {boolean} true when the command root should be scanned.
 */
function shouldScanCommandRoot(options) {
  if (options?.cwd === undefined) return true
  try {
    return resolve(projectRootFor(options.cwd), '.dsh/skills') !== resolve(COMMAND_ROOT)
  } catch {
    return true
  }
}

/**
 * Create the bundled skill provider registered on `ctx.skills`.
 * Every lookup re-reads the files so edits show up without a restart.
 * @param {(message: string) => void} [warn] - warning sink.
 * @returns {{ name: string, list: Function, get: Function }} provider.
 */
export function createProvider(warn = () => {}) {
  return {
    name: PROVIDER_NAME,

    /**
     * List bundled skill candidates.
     * @param {{ cwd?: string, signal?: AbortSignal }} [options] - lookup options.
     * @returns {Promise<object[]>} candidates sorted by name.
     */
    async list(options) {
      if (options?.signal?.aborted) return []

      /** @type {Map<string, object>} */
      const seen = new Map()
      const roots = shouldScanCommandRoot(options)
        ? [COMMAND_ROOT, REPOSITORY_ROOT]
        : [REPOSITORY_ROOT]

      for (const root of roots) {
        for (const file of listSkillFiles(root, warn)) {
          if (options?.signal?.aborted) return []

          const parsed = readSkillFile(file, warn)
          if (parsed === undefined) continue

          const existing = seen.get(parsed.candidate.name)
          if (existing !== undefined) {
            warn(
              `duplicate skill "${parsed.candidate.name}" at ${file}; `
              + `keeping ${existing.path}`,
            )
            continue
          }
          seen.set(parsed.candidate.name, parsed.candidate)
        }
      }

      return [...seen.values()].sort((left, right) => left.name.localeCompare(right.name))
    },

    /**
     * Load one bundled skill body.
     * @param {object} candidate - candidate returned by `list`.
     * @param {{ signal?: AbortSignal }} [options] - lookup options.
     * @returns {Promise<object | undefined>} full definition, or `undefined`.
     */
    async get(candidate, options) {
      if (options?.signal?.aborted) return undefined

      const parsed = readSkillFile(candidate.locator, warn)
      if (parsed === undefined) return undefined

      if (parsed.candidate.name !== candidate.name) {
        warn(
          `skill ${candidate.locator} no longer names "${candidate.name}"; `
          + `found "${parsed.candidate.name}"`,
        )
        return undefined
      }

      return {
        name: candidate.name,
        description: parsed.candidate.description,
        ...(parsed.candidate.whenToUse === undefined
          ? {}
          : { whenToUse: parsed.candidate.whenToUse }),
        invocation: { ...parsed.candidate.invocation },
        source: parsed.candidate.source,
        provider: parsed.candidate.provider,
        path: parsed.candidate.path,
        resourceBase: {
          kind: 'directory',
          path: parsed.candidate.resourceBase.path,
        },
        content: parsed.body.replace(/^\s*\n/, ''),
      }
    },
  }
}
