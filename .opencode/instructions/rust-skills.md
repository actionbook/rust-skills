# Rust Skills

Comprehensive Rust development assistant with meta-question routing, coding guidelines, version queries, and ecosystem support.

## Default Project Settings

When creating Rust projects or Cargo.toml files, ALWAYS use:

```toml
[package]
edition = "2024"
rust-version = "1.99"

[lints.rust]
unsafe_code = "warn"

[lints.clippy]
all = "warn"
pedantic = "warn"
```

## Core Skills

### rust-router
Master router for ALL Rust questions. Handles:
- Intent analysis and question routing
- Cross-cutting Rust topics
- Crate detection and skill management

### rust-learner
Rust version and crate information:
- Rust version features and changelog
- Crate info from lib.rs/crates.io
- API documentation from docs.rs

### coding-guidelines
Code style and best practices:
- Naming conventions (P.NAM.*)
- Formatting rules (P.FMT.*)
- Error handling patterns (P.ERR.*)

### unsafe-checker
Unsafe code review and FFI guidance:
- Safety documentation requirements
- Raw pointer handling
- FFI best practices

## Meta-Question Skills (m01-m15)

| Skill | Topic |
|-------|-------|
| m01-ownership | Memory ownership, borrowing, lifetimes |
| m02-resource | Smart pointers (Box, Rc, Arc, RefCell) |
| m03-mutability | Mutability and interior mutability |
| m04-zero-cost | Generics, traits, monomorphization |
| m05-type-driven | Type state, phantom types, newtype |
| m06-error-handling | Result, Option, error propagation |
| m07-concurrency | Send, Sync, async/await, channels |
| ~~m08-safety~~ | Merged into unsafe-checker |
| m09-domain | Domain modeling in Rust |
| m10-performance | Optimization and benchmarking |
| m11-ecosystem | Crate integration, interop |
| m12-lifecycle | Resource lifecycle, RAII, Drop |
| m13-domain-error | Domain-specific error handling |
| m14-mental-model | Rust mental models |
| m15-anti-pattern | Common mistakes and pitfalls |

## Error Code Reference

| Error | Topic | Skill |
|-------|-------|-------|
| E0382 | Use of moved value | m01-ownership |
| E0597 | Lifetime too short | m01-ownership |
| E0502 | Borrow conflict | m01-ownership |
| E0499 | Multiple mutable borrows | m01-ownership |
| E0277 | Trait bound not satisfied | m04-zero-cost |
| E0308 | Type mismatch | m04-zero-cost |

## Usage Examples

Ask about:
- "Why am I getting E0382?"
- "How to use Arc<Mutex<T>>?"
- "Best practices for error handling"
- "Review my unsafe code"
- "What's new in the latest Rust release?"
