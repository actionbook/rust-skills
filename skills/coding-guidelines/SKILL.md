---
name: coding-guidelines
description: "Use when asking about Rust code style or best practices. Keywords: naming, formatting, comment, clippy, rustfmt, lint, code style, best practice, P.NAM, G.FMT, code review, naming convention, variable naming, function naming, type naming, 命名规范, 代码风格, 格式化, 最佳实践, 代码审查, 怎么命名"
source: https://rust-coding-guidelines.github.io/rust-coding-guidelines-zh/
user-invocable: false
---

# Rust Coding Guidelines (50 Core Rules)

## Naming (Rust-Specific)

| Rule | Guideline |
|------|-----------|
| No `get_` prefix | `fn name()` not `fn get_name()` |
| Iterator convention | `iter()` / `iter_mut()` / `into_iter()` |
| Conversion naming | `as_` (cheap &), `to_` (expensive), `into_` (ownership) |
| Static var prefix | `G_CONFIG` for `static`, no prefix for `const` |

## Data Types

| Rule | Guideline |
|------|-----------|
| Use newtypes | `struct Email(String)` for domain semantics |
| Prefer slice patterns | `if let [first, .., last] = slice` |
| Pre-allocate | `Vec::with_capacity()`, `String::with_capacity()` |
| Avoid Vec abuse | Use arrays for fixed sizes |

## Strings

| Rule | Guideline |
|------|-----------|
| Prefer bytes | `s.bytes()` over `s.chars()` when ASCII |
| Use `Cow<str>` | When might modify borrowed data |
| Use `format!` | Over string concatenation with `+` |
| Avoid nested iteration | `contains()` on string is O(n*m) |

For a byte limit on UTF-8 text, `str::floor_char_boundary` finds a valid boundary at or
before the limit. It preserves UTF-8 validity, not whole grapheme clusters. Use a Unicode
segmentation library when user-perceived characters must remain intact.

For unsigned divisibility checks, consider `is_multiple_of` when it matches the intended
zero-divisor behavior: `0.is_multiple_of(0)` is true and other values return false. This
differs from `% 0`, which panics. For arithmetic, choose checked, saturating, wrapping, or
strict operations according to the required overflow behavior.

## Error Handling

| Rule | Guideline |
|------|-----------|
| Use `?` propagation | Not `try!()` macro |
| `expect()` over `unwrap()` | When value guaranteed |
| Assertions for invariants | `assert!` at function entry |

## Memory

| Rule | Guideline |
|------|-----------|
| Meaningful lifetimes | `'src`, `'ctx` not just `'a` |
| `try_borrow()` for RefCell | Avoid panic |
| Shadowing for transformation | `let x = x.parse()?` |

## Concurrency

| Rule | Guideline |
|------|-----------|
| Identify lock ordering | Prevent deadlocks |
| Atomics for primitives | Not Mutex for bool/usize |
| Choose memory order carefully | Relaxed/Acquire/Release/SeqCst |

## Async

| Rule | Guideline |
|------|-----------|
| Sync for CPU-bound | Async is for I/O |
| Don't hold locks across await | Use scoped guards |

## Macros

| Rule | Guideline |
|------|-----------|
| Avoid unless necessary | Prefer functions/generics |
| Follow Rust syntax | Macro input should look like Rust |

`macro_rules!` `expr` fragments match const blocks and `_`
expressions. Check arm order when migrating; use `expr_2021` only when preserving the
previous matching behavior is intentional. `gen` is reserved: choose another name for
new identifiers, or use `r#gen` when compatibility requires the existing name.

## Standard library and crate choices

| Need | Guidance |
|------|----------|
| Lazy initialization | Choose `OnceLock` or `LazyLock`; `once_cell` and `lazy_static` remain valid when their APIs or MSRV are needed. |
| Channels | `std::sync::mpsc` works for multi-producer, single-consumer channels; use a crate when its extra features are needed. |
| Mutex | `std::sync::Mutex` is a valid default; compare poisoning and other semantics before choosing `parking_lot`. |
| Errors | Choose `thiserror` for typed errors and `anyhow` for application context when appropriate. |
| Error propagation | Prefer `?` to the deprecated `try!()` macro. |

Use `clippy::all` and `clippy::pedantic` for the project's default lint groups. Restriction
lints such as `unwrap_used` and `undocumented_unsafe_blocks` require explicit configuration;
choose them based on the project's needs rather than enabling the whole restriction group.
Respect an existing project's edition and minimum Rust version.
For CI, `CARGO_BUILD_WARNINGS=deny cargo check` makes Cargo fail the build on warnings.
Configure individual rustc and Clippy lint levels separately, and review warnings before
denying them; the `linker_messages` lint has special behavior.

## Quick Reference

```
Naming: snake_case (fn/var), CamelCase (type), SCREAMING_CASE (const)
Format: rustfmt (just use it)
Docs: /// for public items, //! for module docs
Lint: #![warn(clippy::all)]
```

Claude knows Rust conventions well. These are the non-obvious Rust-specific rules.
