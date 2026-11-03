---
name: rust-router
description: |-
  CRITICAL: Use for ALL Rust questions including errors, design, and coding.
  HIGHEST PRIORITY for: 比较, 对比, compare, vs, versus, 区别, difference, 最佳实践, best practice,
  tokio vs, async-std vs, 比较 tokio, 比较 async,
  Triggers on: Rust, cargo, rustc, crate, Cargo.toml,
  意图分析, 问题分析, 语义分析, analyze intent, question analysis,
  compile error, borrow error, lifetime error, ownership error, type error, trait error,
  value moved, cannot borrow, does not live long enough, mismatched types, not satisfied,
  E0382, E0597, E0277, E0308, E0499, E0502, E0596,
  async, await, Send, Sync, tokio, concurrency, error handling,
  编译错误, compile error, 所有权, ownership, 借用, borrow, 生命周期, lifetime, 类型错误, type error,
  异步, async, 并发, concurrency, 错误处理, error handling,
  问题, problem, question, 怎么用, how to use, 如何, how to, 为什么, why,
  什么是, what is, 帮我写, help me write, 实现, implement, 解释, explain
globs: ["**/Cargo.toml", "**/*.rs"]
---

---

# Rust Question Router

> **Version:** 2.0.0 | **Last Updated:** 2025-01-22
>
> **v2.0:** Context optimized - detailed examples moved to sub-files

## Meta-Cognition Framework

### Core Principle

**Don't answer directly. Trace through the cognitive layers first.**

```
Layer 3: Domain Constraints (WHY)
├── Business rules, regulatory requirements
├── domain-fintech, domain-web, domain-cli, etc.
└── "Why is it designed this way?"

Layer 2: Design Choices (WHAT)
├── Architecture patterns, DDD concepts
├── m09-m15 skills
└── "What pattern should I use?"

Layer 1: Language Mechanics (HOW)
├── Ownership, borrowing, lifetimes, traits
├── m01-m07 skills
└── "How do I implement this in Rust?"
```

### Routing by Entry Point

| User Signal | Entry Layer | Direction | First Skill |
|-------------|-------------|-----------|-------------|
| E0xxx error | Layer 1 | Trace UP ↑ | m01-m07 |
| Compile error | Layer 1 | Trace UP ↑ | Error table below |
| "How to design..." | Layer 2 | Check L3, then DOWN ↓ | m09-domain |
| "Building [domain] app" | Layer 3 | Trace DOWN ↓ | domain-* |
| "Best practice..." | Layer 2 | Both directions | m09-m15 |
| Performance issue | Layer 1 → 2 | UP then DOWN | m10-performance |

### CRITICAL: Dual-Skill Loading

**When domain keywords are present, you MUST load BOTH skills:**

| Domain Keywords | L1 Skill | L3 Skill |
|-----------------|----------|----------|
| Web API, HTTP, axum, handler | m07-concurrency | **domain-web** |
| 交易, 支付, trading, payment | m01-ownership | **domain-fintech** |
| CLI, terminal, clap | m07-concurrency | **domain-cli** |
| kubernetes, grpc, microservice | m07-concurrency | **domain-cloud-native** |
| embedded, no_std, MCU | m02-resource | **domain-embedded** |

---

## INSTRUCTIONS FOR CLAUDE

### CRITICAL: Negotiation Protocol Trigger

**BEFORE answering, check if negotiation is required:**

| Query Contains | Action |
|----------------|--------|
| "比较", "对比", "compare", "vs", "versus" | **MUST use negotiation** |
| "最佳实践", "best practice" | **MUST use negotiation** |
| Domain + error (e.g., "交易系统 E0382") | **MUST use negotiation** |
| Ambiguous scope (e.g., "tokio 性能") | **SHOULD use negotiation** |

**When negotiation is required, include:**

```markdown
## Negotiation Analysis

**Query Type:** [Comparative | Cross-domain | Synthesis | Ambiguous]
**Negotiation:** Enabled

### Source: [Agent/Skill Name]
**Confidence:** HIGH | MEDIUM | LOW | UNCERTAIN
**Gaps:** [What's missing]

## Synthesized Answer
[Answer]

**Overall Confidence:** [Level]
**Disclosed Gaps:** [Gaps user should know]
```

> **详细协议见:** `patterns/negotiation.md`

---

### Default Project Settings

When creating new Rust projects or Cargo.toml files, ALWAYS use:

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

These defaults apply when creating projects. For existing projects, respect their declared
edition and minimum Rust version; edition migration requires a deliberate compatibility
review.

For an explicitly requested edition migration, review the workspace, MSRV, features, and
targets first. `cargo fix --edition` can assist, but its changes still require review and
tests, especially for temporary drop order, macro matching, FFI contracts, and dependencies.

---

## Layer 1 Skills (Language Mechanics)

| Pattern | Route To |
|---------|----------|
| move, borrow, lifetime, E0382, E0597 | m01-ownership |
| Box, Rc, Arc, RefCell, Cell | m02-resource |
| mut, interior mutability, E0499, E0502, E0596 | m03-mutability |
| generic, trait, inline, monomorphization | m04-zero-cost |
| type state, phantom, newtype | m05-type-driven |
| Result, Error, panic, ?, anyhow, thiserror | m06-error-handling |
| Send, Sync, thread, async, channel | m07-concurrency |
| unsafe, FFI, extern, raw pointer, transmute | **unsafe-checker** |

## Layer 2 Skills (Design Choices)

| Pattern | Route To |
|---------|----------|
| domain model, business logic | m09-domain |
| performance, optimization, benchmark, SIMD, vectorization, vectorisation, fearless_simd | m10-performance |
| integration, interop, bindings | m11-ecosystem |
| resource lifecycle, RAII, Drop | m12-lifecycle |
| domain error, recovery strategy | m13-domain-error |
| mental model, how to think | m14-mental-model |
| anti-pattern, common mistake, pitfall | m15-anti-pattern |

## Layer 3 Skills (Domain Constraints)

| Domain Keywords | Route To |
|-----------------|----------|
| fintech, trading, decimal, currency | domain-fintech |
| ml, tensor, model, inference | domain-ml |
| kubernetes, docker, grpc, microservice | domain-cloud-native |
| embedded, sensor, mqtt, iot | domain-iot |
| web server, HTTP, REST, axum, actix | domain-web |
| CLI, command line, clap, terminal | domain-cli |
| no_std, microcontroller, firmware | domain-embedded |

---

## Error Code Routing

| Error Code | Route To | Common Cause |
|------------|----------|--------------|
| E0382 | m01-ownership | Use of moved value |
| E0597 | m01-ownership | Lifetime too short |
| E0506 | m01-ownership | Cannot assign to borrowed |
| E0507 | m01-ownership | Cannot move out of borrowed |
| E0515 | m01-ownership | Return local reference |
| E0716 | m01-ownership | Temporary value dropped |
| E0106 | m01-ownership | Missing lifetime specifier |
| E0596 | m03-mutability | Cannot borrow as mutable |
| E0499 | m03-mutability | Multiple mutable borrows |
| E0502 | m03-mutability | Borrow conflict |
| E0277 | m04/m07 | Trait bound not satisfied |
| E0308 | m04-zero-cost | Type mismatch |
| E0599 | m04-zero-cost | No method found |
| E0038 | m04-zero-cost | Trait not object-safe |
| E0433 | m11-ecosystem | Cannot find crate/module |

---

## Functional Routing Table

| Pattern | Route To | Action |
|---------|----------|--------|
| latest version, what's new | **rust-learner** | Use agents |
| API, docs, documentation | **docs-researcher** | Use agent |
| code style, naming, clippy | **coding-guidelines** | Read skill |
| unsafe code, FFI | **unsafe-checker** | Read skill |
| code review | **os-checker** | See `integrations/os-checker.md` |

---

## Priority Order

1. **Identify cognitive layer** (L1/L2/L3)
2. **Load entry skill** (m0x/m1x/domain)
3. **Trace through layers** (UP or DOWN)
4. **Cross-reference skills** as indicated in "Trace" sections
5. **Answer with reasoning chain**

### Keyword Conflict Resolution

| Keyword | Resolution |
|---------|------------|
| `unsafe` | **unsafe-checker** (more specific than m11) |
| `error` | **m06** for general, **m13** for domain-specific |
| `RAII` | **m12** for design, **m01** for implementation |
| `crate` | **rust-learner** for version, **m11** for integration |
| `tokio` | **tokio-*** for API, **m07** for concepts |
| `fearless_simd` | **m10-performance** for SIMD selection and implementation |

**Priority Hierarchy:**

```
1. Error codes (E0xxx) → Direct lookup, highest priority
2. Negotiation triggers (compare, vs, best practice) → Enable negotiation
3. Domain keywords + error → Load BOTH domain + error skills
4. Specific crate keywords → Route to crate-specific skill if exists
5. General concept keywords → Route to meta-question skill
```

---

## Sub-Files Reference

| File | Content |
|------|---------|
| `patterns/negotiation.md` | Negotiation protocol details |
| `examples/workflow.md` | Workflow examples |
| `integrations/os-checker.md` | OS-Checker integration |
