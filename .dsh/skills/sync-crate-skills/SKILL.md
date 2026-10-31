---
name: sync-crate-skills
description: "Generate local DSH skills for Cargo.toml dependencies, or for one local Rust source tree. Usage: /sync-crate-skills [--force] [--from-source <path>] [crate ...]"
disable-model-invocation: true
user-invocable: true
---

# /sync-crate-skills

Scan a Rust project and generate local DeepSeek Harness skills for dependencies that do not have one yet.

The text after `/sync-crate-skills` in the user's message is the argument list. Parse it before doing anything else.

## Arguments

- `--force`: Regenerate generated skills even if they already exist.
- `--from-source <path>`: Generate one skill from a local Rust source tree instead of scanning dependencies.
- `crate ...`: Optional crate names to sync. Accept both the crate name (`serde_json`) and the normalized skill name (`serde-json`).
- Unknown flags are an error; print the usage line.

## Helper

The skill's base directory is shown in the `Base directory for this skill:` line of the loaded instructions. Set:

```bash
SKILL_DIR="<the base directory shown above>"
PLUGIN_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"
HELPER="$PLUGIN_ROOT/.dsh/scripts/crate-skills.mjs"
```

Use the helper for dependency discovery and safe filesystem work. Use the host's `write` tool for skill content. Do not run `rm -rf` directly.

The generated skills live in `$DSH_HOME/skills` (`~/.dsh/skills` when `DSH_HOME` is unset). Never write into the plugin repository.

## Workflow

### A. `--from-source <path>`

1. Run `node "$HELPER" package <path>` and read the crate name, version, edition, and description.
2. Read `<path>/README.md` when present, and the public items in `<path>/src/lib.rs` or `<path>/src/main.rs`.
3. Generate one skill for that crate:
   - Normalize the name with `node "$HELPER" normalize <crate>`.
   - Run `node "$HELPER" prepare <crate>` for a new skill, or add `--force`
     when regenerating an existing generated skill. It always refuses to
     overwrite a non-generated skill.
   - Write `<file>.tmp`, then rename it to `<file>`.
   - Mark the metadata with `source: local`.
4. Report the skill path. Do not scan dependencies in this mode.

### B. Dependency scan

1. Locate `Cargo.toml` in the current directory or its nearest ancestor. If there is none, stop and say so.
2. Run `node "$HELPER" deps --dir "$PWD"`. The helper uses
   `cargo metadata --no-deps`, so it does not resolve a registry graph or
   create/update `Cargo.lock`, and falls back to parsing `Cargo.toml` when
   cargo is unavailable. Treat a `degraded: true` result as approximate and
   say so in the report.
3. Keep normal and dev dependencies. Keep path dependencies and workspace members as local-source candidates.
4. Filter by the requested crate names, matching either `name` or `skillName`.
5. For each dependency:
   - Run `node "$HELPER" check <crate>`.
   - If `generated` is true and `--force` is absent: skip.
   - If `exists` is true and `generated` is false: skip with a warning. Never overwrite a hand-written skill.
   - Resolve the version: use the helper's `version` when present. For a
     `local: true` dependency, run `node "$HELPER" package <path>` and use that
     package version; otherwise fetch the latest version from crates.io.
6. If more than 10 crates are missing, show the list and ask the user to confirm or name a subset before generating.
7. For each selected crate:
   - For a local crate, read its `Cargo.toml`, `README.md`, and public items in
     `src/lib.rs` or `src/main.rs`. For a registry crate, fetch
     `https://docs.rs/<crate>/<version>/<crate>/` and
     `https://docs.rs/<crate>/<version>/<crate>/all.html` (fall back to
     `latest` when the version page is unavailable).
   - Extract the crate description and the key structs, enums, traits, functions, and macros.
   - Normalize the skill name with the helper.
   - Run `node "$HELPER" prepare <crate>` for a new skill, or
     `node "$HELPER" prepare <crate> --force` when regenerating an existing
     generated skill.
   - Write the full content to `<dir>/SKILL.md.tmp`, then `mv` it to `<dir>/SKILL.md`.
   - On failure, delete the temp file and keep the old skill.
8. Report created, skipped, and failed crates with their paths and versions.

## Generated skill template

````markdown
---
name: <normalized-crate>
description: "Use for <crate> <version> API questions. Triggers: <crate>, <keywords>."
metadata:
  generated-by: rust-skills
  crate: <original-crate>
  crate-version: <version>
  generated-at: <ISO-8601>
  source: <docs.rs|local>
---

# <crate> <version>

> Generated from <source> on <date>. Refresh with `/update-crate-skill <crate>`.

## Install

```toml
[dependencies]
<crate> = "<version>"
```

## Key API

| Item | Kind | Description |
|------|------|-------------|
| ... | struct/enum/trait/fn/macro | ... |

## Examples

```rust
<one or two focused examples>
```

## Links

- crates.io: https://crates.io/crates/<crate>
- docs.rs: https://docs.rs/<crate>/<version>/<crate>/
````

Keep the generated skill under 200 lines. Keep the `description` under 500
characters and escape any `"` or `\` in it, or use a `|` block scalar so the
frontmatter remains valid YAML. Put long API tables in the skill body only when
they are useful; link to docs.rs for the rest.

## Safety

- Only create or replace skills that carry `metadata.generated-by: rust-skills`.
- Do not touch `.dsh/skills` (the plugin's own command skills).
- If the sandbox denies a write to `$DSH_HOME`, report the denied path and suggest setting `DSH_HOME` to a writable location. Do not bypass the denial.
- Respect the session's approval policy for network and shell calls.
