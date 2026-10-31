import test, { afterEach, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  checkSkill,
  listGeneratedSkills,
  normalizeSkillName,
  parseCargoMetadata,
  parseCargoTomlText,
  prepareSkill,
  readPackageInfo,
  removeSkills,
} from '../../.dsh/scripts/crate-skills.mjs'

let temporary = ''
let root = ''
const SCRIPT = fileURLToPath(new URL('../../.dsh/scripts/crate-skills.mjs', import.meta.url))

beforeEach(() => {
  temporary = mkdtempSync(join(tmpdir(), 'dsh-rust-skills-'))
  root = join(temporary, 'skills')
  mkdirSync(root, { recursive: true })
})

afterEach(() => {
  rmSync(temporary, { recursive: true, force: true })
})

/**
 * Create one generated skill directory.
 * @param {string} skillName - directory name.
 * @param {string} crate - crate recorded in metadata.
 * @param {string} version - crate version.
 */
function writeGenerated(skillName, crate, version) {
  const directory = join(root, skillName)
  mkdirSync(directory, { recursive: true })
  writeFileSync(
    join(directory, 'SKILL.md'),
    `---\n`
    + `name: ${skillName}\n`
    + `description: "Generated ${crate}."\n`
    + `metadata:\n`
    + `  generated-by: rust-skills\n`
    + `  crate: ${crate}\n`
    + `  crate-version: ${version}\n`
    + `  generated-at: 2026-10-30T22:00:00Z\n`
    + `---\n\n`
    + `# ${crate}\n`,
  )
}

test('normalizes crate names to DSH kebab-case', () => {
  assert.equal(normalizeSkillName('serde_json'), 'serde-json')
  assert.equal(normalizeSkillName('Tokio'), 'tokio')
  assert.equal(normalizeSkillName('a__b'), 'a-b')
  assert.equal(normalizeSkillName('--serde--'), 'serde')
  assert.throws(() => normalizeSkillName('..'), /invalid crate name/)
  assert.throws(() => normalizeSkillName(''), /invalid crate name/)
})

test('lists and checks only generated skills', () => {
  writeGenerated('serde', 'serde', '1.0.215')
  writeGenerated('tokio', 'tokio', '1.40.0')
  mkdirSync(join(root, 'hand-written'))
  writeFileSync(
    join(root, 'hand-written', 'SKILL.md'),
    '---\nname: hand-written\ndescription: "Mine."\n---\n\n# Mine\n',
  )

  const skills = listGeneratedSkills(root)
  assert.deepEqual(skills.map((skill) => skill.skillName), ['serde', 'tokio'])

  const serde = checkSkill('serde', root)
  assert.equal(serde.generated, true)
  assert.equal(serde.version, '1.0.215')
  assert.equal(checkSkill('hand-written', root).generated, false)
  assert.equal(checkSkill('absent', root).exists, false)
})

test('prepareSkill creates a directory and refuses hand-written skills', () => {
  const prepared = prepareSkill('serde_json', { root })
  assert.equal(prepared.skillName, 'serde-json')
  assert.equal(prepared.file, join(root, 'serde-json', 'SKILL.md'))

  // An interrupted generation leaves an empty directory behind; a retry reuses
  // it instead of reporting a hand-written skill and refusing forever.
  assert.equal(checkSkill('serde_json', root).exists, false)
  assert.doesNotThrow(() => prepareSkill('serde_json', { root }))

  writeGenerated('serde', 'serde', '1.0.215')
  assert.throws(() => prepareSkill('serde', { root }), /pass --force/)
  assert.doesNotThrow(() => prepareSkill('serde', { root, force: true }))

  mkdirSync(join(root, 'hand-written'))
  writeFileSync(join(root, 'hand-written', 'SKILL.md'), '---\nname: hand-written\ndescription: "Mine."\n---\n')
  assert.throws(() => prepareSkill('hand-written', { root, force: true }), /non-generated skill/)
})

test('ignores a generated marker inside a block scalar', () => {
  const directory = join(root, 'hand-written')
  mkdirSync(directory)
  writeFileSync(
    join(directory, 'SKILL.md'),
    '---\n'
    + 'name: hand-written\n'
    + 'description: |\n'
    + '  Documents the generator contract:\n'
    + '  generated-by: rust-skills\n'
    + '---\n',
  )

  assert.deepEqual(listGeneratedSkills(root), [])
  assert.equal(checkSkill('hand-written', root).generated, false)
  assert.deepEqual(removeSkills(['hand-written'], { root }).removed, [])
  assert.ok(existsSync(join(directory, 'SKILL.md')))
})

test('removeSkills deletes only generated directories and refuses symlinks', () => {
  writeGenerated('serde', 'serde', '1.0.215')
  writeGenerated('tokio', 'tokio', '1.40.0')
  mkdirSync(join(root, 'hand-written'))
  writeFileSync(join(root, 'hand-written', 'SKILL.md'), '---\nname: hand-written\ndescription: "Mine."\n---\n')
  symlinkSync(join(root, 'serde'), join(root, 'linked'))

  const dryRun = removeSkills(['serde'], { root, dryRun: true })
  assert.deepEqual(dryRun.removed, ['serde'])
  assert.ok(listGeneratedSkills(root).some((skill) => skill.skillName === 'serde'))

  const handWritten = removeSkills(['hand-written'], { root })
  assert.deepEqual(handWritten.removed, [])
  assert.equal(handWritten.refused[0].name, 'hand-written')

  const symlink = removeSkills(['linked'], { root })
  assert.deepEqual(symlink.removed, [])
  assert.match(symlink.refused[0].reason, /symlink/)

  const traversal = removeSkills(['..'], { root })
  assert.deepEqual(traversal.removed, [])
  assert.ok(traversal.refused.length > 0)

  const removed = removeSkills(['serde'], { root })
  assert.deepEqual(removed.removed, ['serde'])
  assert.equal(checkSkill('serde', root).exists, false)
  assert.ok(checkSkill('tokio', root).exists)

  const all = removeSkills([], { root, all: true })
  assert.deepEqual(all.removed, ['tokio'])
})

test('parses cargo metadata without resolving the dependency graph', () => {
  const metadata = {
    workspace_members: ['probe 0.1.0 (path+file:///tmp/probe)'],
    packages: [
      {
        id: 'probe 0.1.0 (path+file:///tmp/probe)',
        manifest_path: '/tmp/probe/Cargo.toml',
        dependencies: [
          {
            name: 'serde',
            req: '1.0',
            kind: null,
            source: 'registry+https://github.com/rust-lang/crates.io-index',
            path: null,
            rename: null,
          },
          {
            name: 'localdep',
            req: '*',
            kind: 'normal',
            source: null,
            path: '/tmp/localdep',
            rename: 'local_alias',
          },
        ],
      },
    ],
  }

  const report = parseCargoMetadata(metadata, '/tmp/probe')
  assert.equal(report.workspace, false)
  assert.deepEqual(report.members, ['/tmp/probe'])

  const byName = new Map(report.dependencies.map((dependency) => [dependency.name, dependency]))
  assert.equal(byName.get('serde').req, '1.0')
  assert.equal(byName.get('serde').source, 'registry')
  assert.equal(byName.get('serde').version, null)
  assert.equal(byName.get('localdep').local, true)
  assert.equal(byName.get('localdep').path, '/tmp/localdep')
  assert.equal(byName.get('localdep').rename, 'local_alias')
})

test('parses Cargo.toml dependencies with renames, paths, dev deps, and workspace deps', () => {
  const dependencies = parseCargoTomlText(`
[package]
name = "demo"
version = "0.1.0"

[dependencies]
serde = "1.0"
tokio = { version = "1.40", features = ["full"] }
renamed = { package = "actual-name", version = "2" }
local = { path = "../local" }
inherited = { workspace = true }

[dev-dependencies]
proptest = "1"

[workspace.dependencies]
inherited = "2.0"
`)

  const byName = new Map(dependencies.map((dependency) => [dependency.name, dependency]))
  assert.equal(byName.get('serde').req, '1.0')
  assert.equal(byName.get('tokio').req, '1.40')
  assert.equal(byName.get('actual-name').rename, 'renamed')
  assert.equal(byName.get('actual-name').skillName, 'actual-name')
  assert.equal(byName.get('local').local, true)
  assert.equal(byName.get('local').path, '../local')
  assert.equal(byName.get('inherited').req, '2.0')
  assert.equal(byName.get('proptest').kind, 'dev')
})

test('reads package metadata for --from-source', () => {
  const project = join(temporary, 'demo')
  mkdirSync(project)
  writeFileSync(
    join(project, 'Cargo.toml'),
    '[package]\nname = "demo_crate"\nversion = "0.2.0"\nedition = "2024"\ndescription = "Demo crate"\n',
  )

  const info = readPackageInfo(project)
  assert.equal(info.name, 'demo_crate')
  assert.equal(info.skillName, 'demo-crate')
  assert.equal(info.version, '0.2.0')
  assert.equal(info.edition, '2024')
  assert.equal(info.description, 'Demo crate')
  assert.equal(info.path, project)
})

test('CLI entry point emits JSON and reads DSH_HOME', () => {
  const env = { ...process.env, DSH_HOME: temporary }

  const normalized = execFileSync(process.execPath, [SCRIPT, 'normalize', 'serde_json'], {
    encoding: 'utf8',
    env,
  }).trim()
  assert.equal(normalized, 'serde-json')

  writeGenerated('serde', 'serde', '1.0.215')
  const listed = JSON.parse(
    execFileSync(process.execPath, [SCRIPT, 'list'], { encoding: 'utf8', env }),
  )
  assert.equal(listed.root, join(temporary, 'skills'))
  assert.deepEqual(listed.skills.map((skill) => skill.skillName), ['serde'])
})

