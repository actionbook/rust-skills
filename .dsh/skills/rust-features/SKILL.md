---
name: rust-features
description: "Get Rust release features and changelog for a version, or the latest stable release. Usage: /rust-features [version]"
disable-model-invocation: true
user-invocable: true
---

# /rust-features

Get Rust version changelog and new features.

The text after `/rust-features` in the user's message is the version argument. It is optional. Parse it before doing anything else.

## Arguments

- `version` (optional): Rust version number, for example `1.83` or `1.85.0`. Strip a leading `v`.
- Reject anything that is not a version, and ask for clarification instead of guessing.

## Workflow

1. **Resolve the version.**
   - If the user supplied a version, validate it with `^\d+\.\d+(\.\d+)?$`.
   - Otherwise resolve the latest stable version from `https://releases.rs/`.
   - Fallbacks: `rustc --version` when Rust is installed locally, then `https://api.github.com/repos/rust-lang/rust/releases/latest`.
2. **Fetch release notes.**
   - Primary: `https://releases.rs/docs/<version>`.
   - If the user supplied a two-part version such as `1.83`, first try
     `https://releases.rs/docs/1.83.0/` and then the other `1.83.x` patch
     releases.
   - Fallback: `https://raw.githubusercontent.com/rust-lang/rust/master/RELEASES.md` and find the matching version heading.
   - Fallback: the release announcement on `https://blog.rust-lang.org/`.
3. **Extract, without inventing details:**
   - Release date.
   - Language stabilizations and notable changes.
   - Compiler changes.
   - Standard library changes.
   - Cargo, rustdoc, clippy, and rustfmt changes.
   - New or changed platform support.
   - Upgrade notes and minimum supported Rust version (MSRV) changes.
4. **Cite every source** as a markdown link.
5. If the version cannot be found, list the nearest versions that do exist and ask which one to use.

## Output

```markdown
# Rust <version>

Released: <date>

## Language
- ...

## Compiler
- ...

## Standard library
- ...

## Tooling
- ...

## Platform support
- ...

## Upgrade notes
- ...

## Sources
- <links>
```

Keep the summary focused on changes that affect application or library authors. Do not dump the entire changelog.

## Failure handling

- Network unavailable: report the URL that failed and fall back to local `rustc --version` / installed docs. Do not fabricate release notes.
- HTTP 404: the version or release page does not exist; show nearby versions.
- Ambiguous input: ask the user to confirm the version.
