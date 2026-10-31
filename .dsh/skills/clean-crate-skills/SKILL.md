---
name: clean-crate-skills
description: "List and remove locally generated crate skills. Usage: /clean-crate-skills [crate ...] [--all]"
disable-model-invocation: true
user-invocable: true
---

# /clean-crate-skills

Remove dynamically generated crate skills from the local DSH skills directory.

The text after `/clean-crate-skills` in the user's message is the argument list. Parse it before doing anything else.

## Arguments

- `crate ...`: Specific crates to remove. Accept both the crate name (`serde_json`) and the normalized skill name (`serde-json`).
- `--all`: Remove every generated crate skill.
- With no arguments, list the generated skills and ask which ones to remove.
- Unknown flags are an error; print the usage line.

## Helper

Read the skill's base directory from the `Base directory for this skill:` line, then set:

```bash
SKILL_DIR="<the base directory shown above>"
PLUGIN_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"
HELPER="$PLUGIN_ROOT/.dsh/scripts/crate-skills.mjs"
```

The helper only considers `$DSH_HOME/skills` (`~/.dsh/skills` by default). It never touches `.dsh/skills`, which contains the plugin's own command skills.

## Workflow

1. Run `node "$HELPER" list` and show a table:

   ```markdown
   | Crate | Version | Generated | Path |
   |-------|---------|-----------|------|
   | ... | ... | ... | ... |
   ```

2. If the list is empty, say so and stop.
3. Determine the targets:
   - `--all`: every generated skill.
   - Names supplied: normalize each name and match it against the list.
   - No arguments: ask the user with `ask_user_question` when available, offering the generated skills, `Remove all`, and `Cancel`. If the tool is unavailable, show the table and ask in plain text.
4. **Confirm before deleting.** Show the exact targets and the root path.
5. Run `node "$HELPER" remove <targets...> --dry-run` (or
   `node "$HELPER" remove --all --dry-run`) and show the planned removals.
6. Run `node "$HELPER" remove <targets...>` (or `--all`) and report:
   - Removed
   - Missing
   - Refused (non-generated skills, symlinks, or paths outside the root)
   - Remaining generated skills
7. If any target was refused, explain why. Never force-delete a non-generated skill.

## Safety notes

- This only removes skills under `$DSH_HOME/skills`.
- It does not affect the rust-skills repository or the plugin's `.dsh/skills` commands.
- Removed skills can be regenerated with `/sync-crate-skills` or `/update-crate-skill`.
- Respect the session's approval policy. If a removal is denied, report the denial and stop.
