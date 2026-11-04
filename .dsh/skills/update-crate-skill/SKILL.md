---
name: update-crate-skill
description: "Regenerate one local crate skill from the latest or a specified crate version. Usage: /update-crate-skill <crate> [version]"
disable-model-invocation: true
user-invocable: true
---

# /update-crate-skill

Force regenerate a crate skill with the latest documentation.

The text after `/update-crate-skill` in the user's message contains the crate name and an optional version. Parse both before doing anything else.

## Arguments

- `crate` (required): The crate to update.
- `version` (optional): A specific version or `latest`.
- If the crate is missing, print the usage line and stop.

## Helper

Read the skill's base directory from the `Base directory for this skill:` line, then set:

```bash
SKILL_DIR="<the base directory shown above>"
PLUGIN_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"
HELPER="$PLUGIN_ROOT/.dsh/scripts/crate-skills.mjs"
```

Generated skills live in `$DSH_HOME/skills` (`~/.dsh/skills` by default).

## Workflow

1. **Check the current skill.**
   - Run `node "$HELPER" check <crate>`.
   - If `exists` is false: stop and suggest `/sync-crate-skills <crate>`.
   - If `generated` is false: stop. Never overwrite a hand-written skill.
   - Record the current version, generated date, and path.
2. **Resolve the target version.**
   - If the user supplied `latest` or no version, fetch `https://crates.io/api/v1/crates/<crate>` and use `max_stable_version` (fall back to `max_version`).
   - Otherwise use the supplied version and verify it exists at `https://crates.io/api/v1/crates/<crate>/<version>`.
   - On 404, list nearby versions and ask.
3. **Fetch documentation.**
   - `https://docs.rs/<crate>/<version>/<crate>/`
   - `https://docs.rs/<crate>/<version>/<crate>/all.html`
   - Extract the crate description and key structs, enums, traits, functions, and macros.
4. **Generate the full skill content in memory.** Read
   `../sync-crate-skills/SKILL.md` relative to this skill's base directory for
   the generated-skill template, then update `crate-version`, `generated-at`,
   and the docs.rs links.
5. **Replace atomically.**
   - Run `node "$HELPER" prepare <crate> --force`.
   - Write `<file>.tmp`.
   - Rename it to `<file>`.
   - On any failure, delete the temp file and keep the old skill.
6. **Report** old version, new version, generated date, and path.

## Output

```markdown
Updated skill:
- Crate: <crate>
- Old version: <old or "none">
- New version: <new>
- Location: <path>
```

## When to update

- The crate has a new major/minor release.
- The API changed significantly.
- The existing skill has incorrect information.
- Documentation has improved.

## Safety

- Only replace skills carrying `metadata.generated-by: rust-skills`.
- Never touch `.dsh/skills` (the plugin's own command skills).
- Respect the session's approval policy for network and shell calls.
- If a write to `$DSH_HOME` is denied, report it and suggest a writable `DSH_HOME`; do not bypass the denial.
