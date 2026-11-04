# Rust Skills Trigger Test Checklist

> Run these queries in a project that has rust-skills installed, and verify the correct skill is triggered.

## How to Test

1. Go to a Rust project directory with rust-skills plugin installed
2. Run each query below with `claude -p "query"`
3. Check if the expected skill is triggered (shown in Claude Code status line)

---

## Layer 1: Language Mechanics

## Ownership (m01-ownership)

| Query | Expected Skill |
|-------|----------------|
| `E0382 错误怎么解决` | m01-ownership |
| `value moved after use` | m01-ownership |
| `borrowed value does not live long enough` | m01-ownership |
| `怎么解决借用错误` | m01-ownership |
| `lifetime annotation` | m01-ownership |
| `E0597 lifetime too short` | m01-ownership |

## Resource (m02-resource)

| Query | Expected Skill |
|-------|----------------|
| `Arc 和 Rc 区别` | m02-resource |
| `Box vs Rc vs Arc` | m02-resource |
| `smart pointer 选择` | m02-resource |
| `shared ownership` | m02-resource |

## Mutability (m03-mutability)

| Query | Expected Skill |
|-------|----------------|
| `E0499 multiple mutable borrows` | m03-mutability |
| `E0502 borrow conflict` | m03-mutability |
| `E0596 cannot borrow as mutable` | m03-mutability |
| `Cell vs RefCell` | m03-mutability |
| `interior mutability` | m03-mutability |

## Zero-Cost (m04-zero-cost)

| Query | Expected Skill |
|-------|----------------|
| `E0277 trait bound not satisfied` | m04-zero-cost |
| `generic vs trait object` | m04-zero-cost |
| `monomorphization` | m04-zero-cost |
| `E0308 type mismatch` | m04-zero-cost |
| `E0282 type annotations needed` | m04-zero-cost |

## Type-Driven (m05-type-driven)

| Query | Expected Skill |
|-------|----------------|
| `newtype pattern` | m05-type-driven |
| `PhantomData 用法` | m05-type-driven |
| `type state pattern` | m05-type-driven |
| `零大小类型 ZST` | m05-type-driven |
| `marker trait` | m05-type-driven |

## Error Handling (m06-error-handling)

| Query | Expected Skill |
|-------|----------------|
| `什么时候用 panic` | m06-error-handling |
| `Result vs Option` | m06-error-handling |
| `thiserror 怎么用` | m06-error-handling |
| `anyhow vs eyre` | m06-error-handling |
| `error propagation` | m06-error-handling |

## Concurrency (m07-concurrency)

| Query | Expected Skill |
|-------|----------------|
| `cannot be sent between threads` | m07-concurrency |
| `async await 怎么用` | m07-concurrency |
| `Send Sync trait` | m07-concurrency |
| `deadlock 怎么避免` | m07-concurrency |
| `如何在线程间共享数据` | m07-concurrency |

---

## Layer 2: Design Choices

## Domain Modeling (m09-domain)

| Query | Expected Skill |
|-------|----------------|
| `DDD in Rust` | m09-domain |
| `domain model 设计` | m09-domain |
| `aggregate root` | m09-domain |
| `value object vs entity` | m09-domain |
| `领域建模` | m09-domain |

## Performance (m10-performance)

| Query | Expected Skill |
|-------|----------------|
| `Rust 性能优化` | m10-performance |
| `benchmark 怎么写` | m10-performance |
| `criterion 用法` | m10-performance |
| `cache locality` | m10-performance |
| `Rust SIMD vectorization` | m10-performance |
| `How do I use fearless_simd?` | m10-performance |
| `vectorisation of a Rust loop` | m10-performance |
| `零拷贝 zero copy` | m10-performance |

## Ecosystem (m11-ecosystem)

| Query | Expected Skill |
|-------|----------------|
| `推荐什么 crate` | m11-ecosystem |
| `依赖选择` | m11-ecosystem |
| `crate 对比` | m11-ecosystem |
| `Cargo.toml 依赖管理` | m11-ecosystem |
| `feature flags 用法` | m11-ecosystem |

## Lifecycle (m12-lifecycle)

| Query | Expected Skill |
|-------|----------------|
| `RAII pattern` | m12-lifecycle |
| `Drop trait 实现` | m12-lifecycle |
| `资源释放顺序` | m12-lifecycle |
| `scopeguard 用法` | m12-lifecycle |
| `析构函数` | m12-lifecycle |

## Domain Error (m13-domain-error)

| Query | Expected Skill |
|-------|----------------|
| `retry 策略` | m13-domain-error |
| `circuit breaker 实现` | m13-domain-error |
| `错误恢复模式` | m13-domain-error |
| `backoff 重试` | m13-domain-error |
| `错误分类处理` | m13-domain-error |

## Mental Model (m14-mental-model)

| Query | Expected Skill |
|-------|----------------|
| `怎么学 Rust` | m14-mental-model |
| `Rust 思维方式` | m14-mental-model |
| `从 Java 转 Rust` | m14-mental-model |
| `所有权心智模型` | m14-mental-model |
| `为什么 Rust 这样设计` | m14-mental-model |

## Anti-Pattern (m15-anti-pattern)

| Query | Expected Skill |
|-------|----------------|
| `常见 Rust 错误` | m15-anti-pattern |
| `code smell Rust` | m15-anti-pattern |
| `Rust 反模式` | m15-anti-pattern |
| `不要这样写 Rust` | m15-anti-pattern |
| `clone 滥用` | m15-anti-pattern |

---

## Core Skills

## Unsafe (unsafe-checker)

| Query | Expected Skill |
|-------|----------------|
| `unsafe 代码怎么写` | unsafe-checker |
| `FFI 绑定` | unsafe-checker |
| `SAFETY comment` | unsafe-checker |
| `raw pointer` | unsafe-checker |
| `how to call C functions` | unsafe-checker |

## Version/Crate (rust-learner)

| Query | Expected Skill |
|-------|----------------|
| `tokio 最新版本` | rust-learner |
| `最新 Rust 版本有什么新特性` | rust-learner |
| `serde 文档` | rust-learner |
| `crate info` | rust-learner |

## Code Style (coding-guidelines)

| Query | Expected Skill |
|-------|----------------|
| `Rust 命名规范` | coding-guidelines |
| `clippy warning` | coding-guidelines |
| `rustfmt 配置` | coding-guidelines |
| `P.NAM.01` | coding-guidelines |

## Router (rust-router)

| Query | Expected Skill |
|-------|----------------|
| `分析这个问题的意图` | rust-router |
| `意图分析` | rust-router |
| `这是什么类型的 Rust 问题` | rust-router |

## Layer 3: Domain Constraints

## Domains

| Query | Expected Skill |
|-------|----------------|
| `kubernetes operator in Rust` | domain-cloud-native |
| `decimal 精度计算` | domain-fintech |
| `机器学习 tensor` | domain-ml |
| `IoT sensor` | domain-iot |
| `axum web server` | domain-web |
| `clap CLI argument` | domain-cli |
| `no_std embedded` | domain-embedded |

---

## Quick Test Commands

```bash
# Layer 1: Language Mechanics
claude -p "E0382 错误怎么解决"           # m01-ownership
claude -p "E0499 multiple mutable borrows" # m03-mutability
claude -p "newtype pattern"              # m05-type-driven
claude -p "Send Sync trait"              # m07-concurrency

# Layer 2: Design Choices
claude -p "DDD in Rust"                  # m09-domain
claude -p "benchmark 怎么写"              # m10-performance
claude -p "推荐什么 crate"                # m11-ecosystem
claude -p "RAII pattern"                 # m12-lifecycle
claude -p "circuit breaker 实现"          # m13-domain-error
claude -p "怎么学 Rust"                   # m14-mental-model
claude -p "常见 Rust 错误"                # m15-anti-pattern

# Core Skills
claude -p "unsafe 代码怎么写"             # unsafe-checker
claude -p "tokio 最新版本"                # rust-learner
claude -p "Rust 命名规范"                 # coding-guidelines

# Layer 3: Domains
claude -p "axum web server"              # domain-web
claude -p "decimal 精度计算"              # domain-fintech
```

## Expected Behavior

When a skill triggers correctly, you should see:
1. The skill name in Claude Code's status line
2. Response content that matches the skill's expertise
3. References to patterns/rules from that skill

## Troubleshooting

If skills don't trigger:
1. Ensure rust-skills plugin is installed: `claude /plugins`
2. Check plugin path is correct
3. Verify SKILL.md files have `description:` field with keywords
4. Try more specific keywords from the skill description
