/**
 * Minimal YAML frontmatter helpers shared by the bundle entry point and the
 * crate-skills helper.
 *
 * @module frontmatter
 */

/**
 * Split a `SKILL.md` file into frontmatter and body.
 * @param {string} text - raw file contents.
 * @returns {{ frontmatter: string, body: string }} split parts.
 */
export function splitFrontmatter(text) {
  const clean = String(text).replace(/^\uFEFF/, '')
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(clean)
  if (!match) return { frontmatter: '', body: clean }
  return { frontmatter: match[1], body: clean.slice(match[0].length) }
}

/**
 * Remove one layer of YAML quoting.
 * @param {string} value - trimmed scalar.
 * @returns {string} unquoted scalar.
 */
export function unquote(value) {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\(["\\nrt])/g, (_match, escape) => {
      if (escape === 'n') return '\n'
      if (escape === 'r') return '\r'
      if (escape === 't') return '\t'
      return escape
    })
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'")
  }
  return value
}
