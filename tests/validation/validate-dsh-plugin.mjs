#!/usr/bin/env node
/**
 * Validate the DeepSeek Harness bundle surface of rust-skills.
 *
 * This is intentionally dependency-free so it can run in a fresh checkout
 * without `npm install`. It checks the manifest, patch, locale resources,
 * command skills, repository skills, and the ready-to-copy awesome-dsh-plugin
 * entry.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))

const COMMANDS = [
  'clean-crate-skills',
  'crate-info',
  'docs',
  'rust-features',
  'sync-crate-skills',
  'update-crate-skill',
]

let failures = 0

/**
 * Run one check and print its result.
 * @param {string} label - check label.
 * @param {() => void} run - assertion body.
 */
function check(label, run) {
  try {
    run()
    console.log(`PASS ${label}`)
  } catch (error) {
    failures += 1
    console.log(`FAIL ${label}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Assert a condition.
 * @param {boolean} condition - condition.
 * @param {string} message - failure message.
 */
function assert(condition, message) {
  if (!condition) throw new Error(message)
}

/**
 * Read the first YAML frontmatter block.
 * @param {string} text - file contents.
 * @returns {Record<string, string>} scalar frontmatter values.
 */
function frontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text.replace(/^\uFEFF/, ''))
  assert(match !== null, 'missing frontmatter')
  const attrs = {}
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line)
    if (pair !== null) attrs[pair[1]] = pair[2].trim().replace(/^["']|["']$/g, '')
  }
  return attrs
}

const manifest = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'))
const plugin = JSON.parse(readFileSync(join(REPO_ROOT, '.claude-plugin/plugin.json'), 'utf8'))
const version = readFileSync(join(REPO_ROOT, 'VERSION'), 'utf8').trim()

check('package.json declares the bundle manifest', () => {
  assert(manifest.name === 'rust-skills', `unexpected name ${manifest.name}`)
  assert(manifest.version === version, `package.json version ${manifest.version} must match VERSION ${version}`)
  assert(typeof manifest.description === 'string' && manifest.description.length > 0, 'missing description')
  assert(manifest.license === 'MIT', 'license must be MIT')
  assert(typeof manifest.repository?.url === 'string', 'missing repository')
  assert(manifest.dsh?.bundle?.patch === './.dsh/cordis.patch.yml', 'unexpected dsh.bundle.patch')
  assert(typeof manifest.engines?.dsh === 'string', 'missing engines.dsh')
})

check('bundle patch exists and mounts the package', () => {
  const patchPath = resolve(REPO_ROOT, manifest.dsh.bundle.patch)
  assert(existsSync(patchPath), `missing patch ${patchPath}`)
  const patch = readFileSync(patchPath, 'utf8')
  assert(/id:\s*rust-skills/.test(patch), 'patch is missing id: rust-skills')
  assert(/name:\s*['"]?rust-skills['"]?/.test(patch), 'patch is missing name: rust-skills')
})

check('package entry points exist', () => {
  assert(manifest.main === '.dsh/index.js', 'unexpected main')
  assert(existsSync(join(REPO_ROOT, manifest.main)), 'missing .dsh/index.js')
  assert(existsSync(join(REPO_ROOT, '.dsh/scripts/crate-skills.mjs')), 'missing crate-skills helper')
})

check('npm files whitelist includes the runtime', () => {
  assert(Array.isArray(manifest.files), 'files must be an array')
  assert(manifest.files.includes('.dsh'), 'files must include .dsh')
  assert(manifest.files.includes('skills'), 'files must include skills')
})

check('locale resources declare display metadata', () => {
  for (const language of ['en', 'zh']) {
    const file = join(REPO_ROOT, 'locale', `${language}.json`)
    assert(existsSync(file), `missing ${file}`)
    const locale = JSON.parse(readFileSync(file, 'utf8'))
    assert(
      typeof locale.meta?.title === 'string' && locale.meta.title.length > 0,
      `${file}: missing meta.title`,
    )
    assert(
      typeof locale.meta?.description === 'string' && locale.meta.description.length > 0,
      `${file}: missing meta.description`,
    )
  }
  assert(manifest.exports?.['./locale/*.json'] === './locale/*.json', 'missing ./locale/*.json export')
  assert(manifest.files?.includes('locale/*.json'), 'files must include locale/*.json')
})

check('no install-time scripts or runtime dependencies', () => {
  for (const name of ['prepare', 'install', 'postinstall']) {
    assert(manifest.scripts?.[name] === undefined, `unexpected ${name} script`)
  }
  assert(manifest.dependencies === undefined, 'runtime dependencies are not allowed')
  assert(manifest.optionalDependencies === undefined, 'optional dependencies are not allowed')
})

check('six command skills exist with user-only frontmatter', () => {
  for (const name of COMMANDS) {
    const file = join(REPO_ROOT, '.dsh/skills', name, 'SKILL.md')
    assert(existsSync(file), `missing ${file}`)
    const attrs = frontmatter(readFileSync(file, 'utf8'))
    assert(attrs.name === name, `${file}: name must be ${name}`)
    assert(typeof attrs.description === 'string' && attrs.description.length > 0, `${file}: missing description`)
    assert(attrs['disable-model-invocation'] === 'true', `${file}: disable-model-invocation must be true`)
    assert(attrs['user-invocable'] === 'true', `${file}: user-invocable must be true`)
  }
})

check('every plugin.json skill resolves', () => {
  assert(plugin.skills.length === 38, `expected 38 skills, found ${plugin.skills.length}`)
  for (const relative of plugin.skills) {
    const skillDir = resolve(REPO_ROOT, relative)
    const skillFile = join(skillDir, 'SKILL.md')
    assert(existsSync(skillFile), `missing ${skillFile}`)
    const attrs = frontmatter(readFileSync(skillFile, 'utf8'))
    assert(attrs.name === relative.split('/').pop(), `${skillFile}: frontmatter name mismatch`)
  }
})

check('awesome-dsh-plugin entry is present and names the commands', () => {
  const file = join(REPO_ROOT, 'docs/awesome-dsh-plugin/actionbook__rust-skills.yml')
  assert(existsSync(file), `missing ${file}`)
  const entry = readFileSync(file, 'utf8')
  assert(entry.includes('category: skill'), 'category must be skill')
  assert(entry.includes('https://github.com/actionbook/rust-skills'), 'url must point at the repository')
  for (const name of COMMANDS) {
    assert(entry.includes(`/${name}`), `entry must mention /${name}`)
  }
})

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`)
  process.exitCode = 1
} else {
  console.log('\nAll DSH plugin checks passed')
}
