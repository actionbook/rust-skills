# Rust Skills - Claude Instructions

## CRITICAL: Negotiation Protocol Check (BEFORE ANY SKILL)

**STOP! Before loading ANY skill, check if negotiation is required:**

| Query Contains | Action |
|----------------|--------|
| "比较", "对比", "compare", "vs", "versus", "区别", "difference" | **MUST invoke rust-router FIRST** |
| "最佳实践", "best practice", "推荐", "recommend" | **MUST invoke rust-router FIRST** |
| Domain keyword + error (e.g., "交易系统 E0382", "web API Send") | **MUST invoke rust-router FIRST** |
| Two or more technologies (e.g., "tokio 和 async-std") | **MUST invoke rust-router FIRST** |

**When negotiation is required, your response MUST include:**

```markdown
## Negotiation Analysis

**Query Type:** [Comparative | Cross-domain | Synthesis | Ambiguous]
**Negotiation:** Enabled

### Source Assessment
[For each information source:]
- **Confidence:** HIGH | MEDIUM | LOW | UNCERTAIN
- **Gaps:** [What's missing]
- **Coverage:** [X]%

## Synthesized Answer
[Your answer]

**Overall Confidence:** [Level]
**Disclosed Gaps:** [What user should know is missing]
```

**DO NOT skip directly to tokio-basics, ratatui-*, or other specialized skills for comparison queries!**

---

## CRITICAL: Rust-Router First

**For ANY Rust-related question, ALWAYS invoke `rust-router` skill FIRST.**

This is NON-NEGOTIABLE. Do NOT:
- Use WebSearch for Rust questions
- Answer from memory without invoking skill
- Skip to specialized skills without checking router

### What Triggers Rust-Router?

ANY question containing:
- Rust, cargo, crate, rustc, Cargo.toml
- Question words + Rust context
- Error codes: E0XXX
- Code writing requests in Rust
- ANY question while in a Rust project (*.rs, Cargo.toml)

### Workflow

```
User Question
     |
[1] Invoke: Skill(rust-router)
     |
[2] Read rust-router content -> Identify category (m01-m15, etc.)
     |
[3] Invoke specialized skill if needed (e.g., m01-ownership)
     |
[4] Answer based on skill knowledge
```

## Routing Table (in rust-router)

| User Intent | Route To |
|-------------|----------|
| ownership/borrow/lifetime/E0382/E0597 | m01-ownership |
| Box/Rc/Arc/smart pointers | m02-resource |
| mut/Cell/RefCell/interior mutability | m03-mutability |
| generic/trait/E0277/E0308 | m04-zero-cost |
| newtype/type state/PhantomData | m05-type-driven |
| Result/Option/error handling/panic | m06-error-handling |
| async/await/concurrency/thread/Send/Sync | m07-concurrency |
| unsafe/FFI/raw pointer | unsafe-checker |
| domain model/DDD | m09-domain |
| performance/benchmark | m10-performance |
| crate/dependency/ecosystem | m11-ecosystem |
| RAII/Drop/resource lifecycle | m12-lifecycle |
| domain error/retry/circuit breaker | m13-domain-error |
| learning Rust/mental model/why | m14-mental-model |
| anti-pattern/code smell/common mistakes | m15-anti-pattern |
| Rust version/crate version/latest features | rust-learner |
| code style/naming/clippy | coding-guidelines |
| tokio related | tokio-* skills |

## Special Cases

### Rust Version / Crate Info
```
User: "What's new in latest Rust" / "tokio latest version"
-> Invoke: rust-learner
-> Use agent: rust-changelog / crate-researcher
-> DO NOT use WebSearch
```

### Writing Rust Code
```
User: "Help me write an async HTTP server"
-> Invoke: rust-router (identify: async + web)
-> Invoke: m07-concurrency + domain-web
-> Check rust-learner for latest patterns
-> Write code
```

### Error Debugging
```
User: "How to fix E0382"
-> Invoke: rust-router (identify: ownership error)
-> Invoke: m01-ownership
-> Explain fix patterns
```

## Agent Priority

After invoking skills, use these agents for live data:

| Need | Agent |
|------|-------|
| Rust release info | rust-changelog |
| Crate version/info | crate-researcher |
| API documentation | docs-researcher |
| Clippy lint details | clippy-researcher |

**Fallback to WebSearch ONLY if all agents fail.**

## Default Project Settings

When creating new Rust projects or Cargo.toml files, use these defaults:

```toml
[package]
edition = "2024"
rust-version = "1.99"  # Minimum supported Rust version

[lints.rust]
unsafe_code = "warn"

[lints.clippy]
all = "warn"
pedantic = "warn"
```

**Rules:**
- Use `edition = "2024"` for new projects
- Include `rust-version` for MSRV clarity
- Enable clippy lints by default
