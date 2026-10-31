import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { apply, createProvider, parseFrontmatter } from '../../.dsh/index.js'

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url))
const PLUGIN = JSON.parse(readFileSync(join(REPO_ROOT, '.claude-plugin/plugin.json'), 'utf8'))
const COMMAND_MANIFEST = JSON.parse(
  readFileSync(join(REPO_ROOT, 'tests/dsh/commands.json'), 'utf8'),
)
const COMMANDS = COMMAND_MANIFEST.commands

test('parses quoted scalars, CRLF, and BOM frontmatter', () => {
  const parsed = parseFrontmatter(
    '\uFEFF---\r\n'
    + 'name: foo\r\n'
    + 'description: "A: B"\r\n'
    + 'user-invocable: no\r\n'
    + '---\r\n'
    + '\r\n'
    + 'body\r\n',
  )

  assert.equal(parsed.attrs.name, 'foo')
  assert.equal(parsed.attrs.description, 'A: B')
  assert.equal(parsed.attrs['user-invocable'], 'no')
  assert.equal(parsed.body.trim(), 'body')
})

test('parses block descriptions used by rust-router and rust-daily', () => {
  const router = parseFrontmatter(
    readFileSync(join(REPO_ROOT, 'skills/rust-router/SKILL.md'), 'utf8'),
  )
  assert.equal(router.attrs.name, 'rust-router')
  assert.match(router.attrs.description, /E0382/)
  assert.ok(router.attrs.description.split('\n').length > 5)
  assert.match(router.body, /# Rust Question Router/)

  const daily = parseFrontmatter(
    readFileSync(join(REPO_ROOT, 'skills/rust-daily/SKILL.md'), 'utf8'),
  )
  assert.equal(daily.attrs.name, 'rust-daily')
  assert.match(daily.attrs.description, /rust news/i)
})

test('lists every repository skill plus the six commands', async () => {
  const provider = createProvider(() => {})
  const skills = await provider.list({})
  const byName = new Map(skills.map((skill) => [skill.name, skill]))

  assert.equal(skills.length, PLUGIN.skills.length + COMMANDS.length)

  for (const path of PLUGIN.skills) {
    const name = path.split('/').pop()
    assert.ok(byName.has(name), `missing skill ${name}`)
  }

  for (const name of COMMANDS) {
    const skill = byName.get(name)
    assert.ok(skill, `missing command ${name}`)
    assert.deepEqual(skill.invocation, { modelInvocable: false, userInvocable: true })
  }

  assert.deepEqual(byName.get('rust-router').invocation, {
    modelInvocable: true,
    userInvocable: true,
  })
})

test('loads a skill body with its resource directory', async () => {
  const provider = createProvider(() => {})
  const candidate = (await provider.list({})).find((skill) => skill.name === 'rust-router')
  assert.ok(candidate)

  const definition = await provider.get(candidate, {})
  assert.ok(definition)
  assert.match(definition.content, /Rust Question Router/)
  assert.equal(definition.resourceBase.kind, 'directory')
  assert.equal(definition.resourceBase.path, join(REPO_ROOT, 'skills/rust-router'))
  assert.equal(definition.provider, 'rust-skills')
  assert.equal(definition.source, 'bundled')
})

test('honors an aborted lookup signal', async () => {
  const provider = createProvider(() => {})
  const skills = await provider.list({})
  const candidate = skills[0]

  const controller = new AbortController()
  controller.abort()

  assert.deepEqual(await provider.list({ signal: controller.signal }), [])
  assert.equal(await provider.get(candidate, { signal: controller.signal }), undefined)
})

test('does not duplicate command skills already discovered by the project', async () => {
  const provider = createProvider(() => {})
  const skills = await provider.list({ cwd: REPO_ROOT })

  assert.equal(skills.length, 38)
  assert.equal(skills.some((skill) => skill.name === 'docs'), false)
})

test('apply registers a provider on ctx.skills', () => {
  let provider
  const warnings = []
  apply({
    skills: {
      registerProvider(factory) {
        provider = factory({ signal: new AbortController().signal, invalidate() {} })
      },
    },
    logger: {
      warn(message) {
        warnings.push(message)
      },
    },
  })

  assert.ok(provider, 'apply did not register a provider')
  assert.equal(provider.name, 'rust-skills')
  assert.deepEqual(warnings, [])
})

