# /rust-review

Lightweight Rust code review using clippy.

## Usage

```
/rust-review [path]
```

## Parameters

- `path` (optional): Path to file or directory to review. Defaults to current directory.

## What It Does

运行 `cargo clippy` 进行代码审查：

| 检查类型 | 说明 |
|----------|------|
| `clippy::correctness` | 明确错误的代码 |
| `clippy::suspicious` | 可疑代码 |
| `clippy::complexity` | 过于复杂的代码 |
| `clippy::perf` | 性能问题 |
| `clippy::style` | 风格问题 |

## Workflow

1. **读取代码** - 分析目标文件/目录
2. **运行 clippy** - `cargo clippy --message-format=json`
3. **分析结果** - 按严重程度分类
4. **提供修复建议** - 代码示例

## Example Output

```
Rust Code Review: src/lib.rs

Running clippy...

═══════════════════════════════════════════
Results: 3 issues found
═══════════════════════════════════════════

ERROR (1):
  src/lib.rs:42 [clippy::unwrap_used]
    → unwrap() called on Result
    → Fix: Use ? operator or handle error explicitly

WARNING (2):
  src/lib.rs:15 [clippy::redundant_clone]
    → Clone is not needed here
    → Fix: Remove .clone()

  src/lib.rs:28 [clippy::manual_map]
    → Use Option::map instead of match
    → Fix: x.map(|v| v + 1)

═══════════════════════════════════════════
```

## Clippy Configuration

项目可通过 `clippy.toml` 或 `Cargo.toml` 配置 clippy：

`unwrap_used` is a restriction lint and requires explicit configuration; it is not enabled
by `clippy::all` or `clippy::pedantic`. Respect the project's configured lint levels.

```toml
# Cargo.toml
[lints.clippy]
unwrap_used = "deny"
expect_used = "warn"
```

## NOT Included

以下检查**不在** `/rust-review` 范围内：

| 检查 | 原因 | 替代命令 |
|------|------|----------|
| `cargo fmt` | 部分项目不支持 | 手动运行 |
| `miri` | 太重，需要 nightly | `/audit safety` |
| `cargo audit` | 安全审计场景 | `/audit security` |
| `lockbud` | 专用并发审计 | `/audit concurrency` |

## Related Commands

- `/audit` - 重量级安全审计（使用 os-checker）
- `/unsafe-check` - 专注 unsafe 代码检查
- `/guideline` - 查询编码规范
