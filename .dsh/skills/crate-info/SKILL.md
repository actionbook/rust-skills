---
name: crate-info
description: "Get crate information from crates.io and docs.rs: latest version, features, MSRV, license, repository, and recent releases. Usage: /crate-info <crate> [version]"
disable-model-invocation: true
user-invocable: true
---

# /crate-info

Get information about a Rust crate including latest version, features, and changelog.

The text after `/crate-info` in the user's message contains the crate name and an optional version. Parse both before doing anything else.

## Arguments

- `crate` (required): Crate name, for example `tokio`, `serde`, or `axum`.
- `version` (optional): Specific version to look up.
- If the crate is missing, print the usage line and stop.

## Workflow

1. **Fetch crates.io metadata.**
   - `https://crates.io/api/v1/crates/<crate>` for the crate record.
   - A partial version such as `0.7` is a range, not an exact version. Resolve
     it to the highest matching version from the crate's version list before
     fetching `https://crates.io/api/v1/crates/<crate>/<exact-version>`.
   - If the exact version is not found, list versions close to it and ask which one to use.
2. **Extract:**
   - Description.
   - Latest or requested version and its release date.
   - MSRV (`rust_version`) and edition.
   - License.
   - Repository and documentation links.
   - Download counts.
   - Feature list and default features.
3. **Check recent changes only when the data is available.**
   - Use the repository's releases/changelog link when it is a GitHub repository.
   - Do not invent changelog entries. If the changelog cannot be fetched, say so and link to the releases page.
4. **Cite every source** as a markdown link.

## Output

```markdown
# <crate> <version>

<description>

| Field | Value |
|-------|-------|
| Latest version | ... |
| Released | ... |
| MSRV | ... |
| Edition | ... |
| License | ... |
| Repository | ... |
| Documentation | ... |
| Downloads | ... |

## Features
- `feature`: <description>

## Recent releases
- <version> — <date>

## Links
- crates.io: <link>
- docs.rs: <link>
- repository: <link>
```

Keep the output factual. Do not recommend a crate without being asked.

## Failure handling

- HTTP 404: the crate or version does not exist; suggest exact crate names or available versions.
- Rate limit or network failure: report it and, when possible, fall back to `cargo search <crate> --limit 1` or a local `Cargo.lock`.
- Missing fields: print `unknown` rather than guessing.
