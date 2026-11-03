# Rust-Skills Capabilities Summary

> Complete capability inventory of the rust-skills Claude Code plugin

## Overview

| Metric | Count |
|--------|-------|
| Total Skills | 31 |
| Background Agents | 8 |
| Slash Commands | 18 |
| Unsafe Rules | 47 |
| Coding Guidelines | 80+ |
| Trigger Keywords | 400+ |

---

## Core Architecture: Meta-Cognition Framework

### Three-Layer Cognitive Model

```
┌─────────────────────────────────────────────────────┐
│ Layer 3: Domain Constraints (WHY)                   │
│ ├── domain-fintech: Audit, precision, immutability │
│ ├── domain-web: Stateless, thread-safe, async      │
│ ├── domain-cli: Single-thread, user interaction    │
│ ├── domain-embedded: no_std, resource constraints  │
│ ├── domain-cloud-native: Distributed, observable   │
│ ├── domain-iot: Low resource, telemetry            │
│ └── domain-ml: Tensor ops, inference optimization  │
├─────────────────────────────────────────────────────┤
│ Layer 2: Design Choices (WHAT)                      │
│ ├── m09-domain: DDD, entity vs value object        │
│ ├── m10-performance: Benchmarking, optimization    │
│ ├── m11-ecosystem: Crate selection, integration    │
│ ├── m12-lifecycle: RAII, Drop, resource patterns   │
│ ├── m13-domain-error: Retry, circuit breaker       │
│ ├── m14-mental-model: Learning, mental models      │
│ └── m15-anti-pattern: Code smells, pitfalls        │
├─────────────────────────────────────────────────────┤
│ Layer 1: Language Mechanics (HOW)                   │
│ ├── m01-ownership: Ownership, borrowing, lifetime  │
│ ├── m02-resource: Box, Rc, Arc, smart pointers     │
│ ├── m03-mutability: mut, Cell, RefCell, interior   │
│ ├── m04-zero-cost: Generics, traits, dispatch      │
│ ├── m05-type-driven: Newtype, PhantomData, state   │
│ ├── m06-error-handling: Result, Error, panic       │
│ └── m07-concurrency: Send, Sync, async, channels   │
└─────────────────────────────────────────────────────┘
```

### Routing Flow

```
User Question
    │
    ▼
┌─────────────────┐
│ Hook Triggers   │ ← 400+ keywords (EN/CN/Error codes)
│ (UserPromptSubmit)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ rust-router     │ ← Identifies entry layer + domain
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌────────┐
│ L1    │ │ L3     │  ← Dual-skill loading
│ Skill │ │ Domain │
└───┬───┘ └────┬───┘
    │          │
    └────┬─────┘
         │
         ▼
┌─────────────────┐
│ Trace UP/DOWN   │ ← Cross-layer reasoning
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Context-Aware   │ ← Domain best practices
│ Answer          │
└─────────────────┘
```

---

## Skills Inventory (31 Total)

### Layer 1: Language Mechanics (7 Skills)

| Skill | Core Question | Triggers |
|-------|---------------|----------|
| **m01-ownership** | Who should own this data? | E0382, E0597, E0506, E0507, E0515, E0716, move, borrow, lifetime |
| **m02-resource** | What ownership model needed? | Box, Rc, Arc, Weak, RefCell, Cell, smart pointer |
| **m03-mutability** | Where are immutability boundaries? | E0596, E0499, E0502, mut, interior mutability |
| **m04-zero-cost** | What can compiler optimize? | E0277, E0308, E0599, generic, trait, monomorphization |
| **m05-type-driven** | How do types encode constraints? | PhantomData, newtype, type state, builder pattern |
| **m06-error-handling** | Expected or exceptional failure? | Result, Option, Error, panic, anyhow, thiserror |
| **m07-concurrency** | How ensure compile-time safety? | Send, Sync, thread, async, await, Mutex, channel |

### Layer 2: Design Choices (7 Skills)

| Skill | Core Question | Focus |
|-------|---------------|-------|
| **m09-domain** | How do domain rules become types? | DDD, entity, value object, aggregate, repository |
| **m10-performance** | What are performance bottlenecks? | Benchmark, profiling, flamegraph, criterion |
| **m11-ecosystem** | How integrate with existing systems? | Crate selection, FFI, PyO3, WASM, feature flags |
| **m12-lifecycle** | What are domain resource patterns? | RAII, Drop, connection pools, OnceCell |
| **m13-domain-error** | What are failure recovery strategies? | Retry, circuit breaker, graceful degradation |
| **m14-mental-model** | What is the correct mental model? | Learning Rust, visual memory, analogies |
| **m15-anti-pattern** | What are common cognitive pitfalls? | Code smells, beginner mistakes, idioms |

### Layer 3: Domain Constraints (7 Skills)

| Skill | Domain | Key Constraints |
|-------|--------|-----------------|
| **domain-fintech** | Financial | Audit trail, decimal precision, immutable transactions |
| **domain-web** | Web Services | Stateless HTTP, thread-safe state, async handlers |
| **domain-cli** | Command Line | Argument parsing, TUI, progress bars, config files |
| **domain-embedded** | Embedded/no_std | MCU, bare metal, HAL, interrupts, resource limits |
| **domain-cloud-native** | Cloud | Kubernetes, gRPC, observability, distributed tracing |
| **domain-iot** | IoT | MQTT, sensors, edge computing, low resources |
| **domain-ml** | Machine Learning | Tensors, inference, model optimization |

### Core & Utility Skills (10 Skills)

| Skill | Purpose |
|-------|---------|
| **rust-router** | Routes ALL Rust questions, implements meta-cognition |
| **rust-learner** | Fetches latest Rust/crate versions via agents |
| **coding-guidelines** | 80+ Rust coding rules (naming, style, patterns) |
| **unsafe-checker** | 47 unsafe rules, SAFETY comments, FFI review |
| **rust-daily** | Aggregates Rust news from Reddit, TWIR, blogs |
| **rust-skill-creator** | Generates new skills from documentation |
| **core-actionbook** | Pre-computed website selectors |
| **core-agent-browser** | Browser automation infrastructure |
| **core-dynamic-skills** | Dynamic skill generation from Cargo.toml |
| **core-fix-skill-docs** | Skill documentation maintenance |

---

## Agents (8 Background Researchers)

| Agent | Data Source | Output |
|-------|-------------|--------|
| **rust-changelog** | releases.rs | Rust version features, breaking changes |
| **crate-researcher** | lib.rs, crates.io | Crate metadata, versions, features |
| **docs-researcher** | docs.rs | Third-party crate API documentation |
| **std-docs-researcher** | doc.rust-lang.org | Standard library documentation |
| **clippy-researcher** | rust-clippy | Lint explanations, categories |
| **rust-daily-reporter** | Reddit, TWIR, Blog | Ecosystem news (day/week/month) |
| **browser-fetcher** | WebFetch | Generic web content fallback |

### Tool Chain Priority

```
1. actionbook MCP    → Pre-computed selectors
2. agent-browser CLI → Browser automation
3. WebFetch          → Last resort fallback
```

---

## Commands (18 Slash Commands)

### Query Commands

| Command | Purpose |
|---------|---------|
| `/rust-router` | Route question to appropriate skill |
| `/guideline [--clippy] rule` | Query coding guidelines |
| `/skill-index category` | Search skills by category |
| `/docs crate [item]` | Fetch API documentation |

### Version & Info Commands

| Command | Purpose |
|---------|---------|
| `/rust-features [version]` | Rust changelog/features |
| `/crate-info crate` | Crate metadata |
| `/rust-daily [day\|week\|month]` | Ecosystem news |

### Audit Commands

| Command | Purpose |
|---------|---------|
| `/unsafe-check file` | Analyze file for unsafe issues |
| `/unsafe-review file` | Interactive unsafe review |
| `/rust-review file` | Lightweight clippy review |
| `/audit [security\|safety\|concurrency\|full]` | Heavy-weight audit |

### Cache Commands

| Command | Purpose |
|---------|---------|
| `/cache-status [--verbose]` | Show cache status |
| `/cache-clean [--all\|--expired\|crate]` | Clean cache |

### Dynamic Skill Commands

| Command | Purpose |
|---------|---------|
| `/sync-crate-skills [--force]` | Generate skills from Cargo.toml |
| `/update-crate-skill crate` | Update specific crate skill |
| `/clean-crate-skills [--all]` | Remove dynamic skills |
| `/create-skills-via-llms crate path` | Create skill from llms.txt |
| `/create-llms-for-skills urls` | Generate llms.txt from URLs |
| `/fix-skill-docs [--check-only]` | Fix skill documentation |

---

## Unsafe Checker (47 Rules)

### Categories

| Category | Rules | Focus |
|----------|-------|-------|
| Memory Safety | 12 | Pointer validity, alignment, initialization |
| FFI Safety | 10 | C interop, ABI, extern functions |
| Concurrency | 8 | Send/Sync impl, data races |
| Undefined Behavior | 10 | Transmute, unions, aliasing |
| Documentation | 7 | SAFETY comments, invariants |

### SAFETY Comment Requirement

```rust
// SAFETY: [preconditions] are satisfied because [reasoning]
unsafe {
    // code
}
```

---

## Coding Guidelines (80+ Rules)

### Categories

| Category | Rules | Examples |
|----------|-------|----------|
| Naming | 15 | snake_case, PascalCase, SCREAMING_SNAKE |
| Data Types | 12 | Prefer &str over String, use newtype |
| Error Handling | 10 | No unwrap in lib, use thiserror |
| Memory | 8 | Avoid unnecessary allocations |
| Concurrency | 10 | Prefer channels over shared state |
| Async | 8 | Don't block in async, scope locks |
| Macros | 5 | Prefer functions over macros |
| Documentation | 12 | Doc examples, # Panics, # Errors |

---

## Meta-Cognition Framework (_meta/)

| File | Purpose |
|------|---------|
| **reasoning-framework.md** | Three-layer tracing methodology |
| **layer-definitions.md** | L1/L2/L3 scope and signals |
| **error-protocol.md** | 3-Strike escalation rule |
| **externalization.md** | Filesystem as external memory |
| **hooks-patterns.md** | Cognitive trigger patterns |

---

## Hook System

### Trigger Keywords (400+)

| Category | Examples |
|----------|----------|
| Error Codes | E0382, E0597, E0277, E0499, E0502, E0596 |
| Ownership | ownership, borrow, lifetime, move, clone |
| Concurrency | async, await, Send, Sync, thread, spawn |
| Smart Pointers | Box, Rc, Arc, RefCell, Cell, Mutex |
| Domains | Web API, HTTP, axum, payment, trading, CLI |
| Chinese | 所有权, 借用, 生命周期, 异步, 并发, 智能指针 |
| Questions | how to, why, what is, 怎么, 为什么, 如何 |

### Hook Behavior

1. **Detect domain keywords** → Load both L1 and L3 skills
2. **Enforce output format** → Reasoning Chain required
3. **Mandate tracing** → Must trace through relevant layers

---

## Caching System

### Configuration

| Cache | TTL | Purpose |
|-------|-----|---------|
| Crates | 24h | Crate metadata |
| Rust Versions | 168h | Release info |
| Docs | 72h | API documentation |
| Clippy Lints | 168h | Lint data |

### Features

- Auto-cleanup of expired entries
- Stale-while-revalidate strategy
- Size limits per category

---

## Project Configuration

### Default Rust Project Settings

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

### Plugin Manifest

```json
{
  "name": "rust-skills",
  "version": "1.0.0",
  "skills": "./skills/",
  "hooks": "./hooks/hooks.json"
}
```

---

## Unique Capabilities

### 1. Meta-Cognition Routing

Not just answering questions, but **tracing through cognitive layers** to provide domain-aware solutions.

### 2. Dual-Skill Loading

When domain context detected, automatically loads BOTH:
- Layer 1 skill (mechanics)
- Layer 3 skill (domain constraints)

### 3. Dynamic Skill Generation

Automatically generates crate-specific skills from Cargo.toml dependencies.

### 4. Background Research Agents

8 specialized agents fetch live data without blocking conversation.

### 5. Comprehensive Unsafe Auditing

47 rules covering memory safety, FFI, concurrency, and documentation.

### 6. Bilingual Support

400+ trigger keywords in both English and Chinese.

---

## Example: Meta-Cognition in Action

**Question**: "My Web API reports Rc cannot be sent between threads"

**Traditional Answer**:
```
Use Arc instead of Rc.
```

**Meta-Cognition Answer**:
```
### Reasoning Chain
+-- Layer 1: Send/Sync Error
|   Problem: Rc<T> cannot be sent between threads
|       ^
+-- Layer 3: Web Domain (domain-web)
|   Constraint: Handlers run on any thread
|   Rule: Shared state must be thread-safe
|       v
+-- Layer 2: Design Choice
    Decision: Use Arc<T> + State extractor

### Domain Constraints Analysis
From domain-web:
- "Rc in state" is listed as Common Mistake
- Web handlers require Send + Sync bounds
- Recommended pattern: axum State<Arc<T>>

### Recommended Solution
[Complete code using axum State extractor with Arc,
following Web domain best practices]
```

---

## Summary

**rust-skills** transforms Claude from a Rust knowledge base into a **domain-aware Rust architect** that:

1. **Routes** questions through appropriate cognitive layers
2. **Traces** to find underlying domain constraints
3. **Recommends** solutions aligned with domain best practices
4. **Researches** live data through background agents
5. **Audits** code for safety and style compliance

The goal: **Surface-level fixes → Architecturally sound, domain-aware solutions**
