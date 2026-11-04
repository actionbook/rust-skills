# Rust Skills：让 AI 写 Rust 更精准的秘密武器

> 一个专为 Claude Code 打造的 Rust 开发辅助插件，通过元问题导向、动态 Skills 和精准文档获取，显著提升 AI 编写 Rust 代码的质量。

## 1. 创作初衷：为什么 AI 写 Rust 需要专门的 Skills？

作为一名 Rust 开发者，我经常使用 AI 辅助编程。然而，在使用过程中，我发现一个令人沮丧的现象：**AI 写其他语言还算靠谱，写 Rust 却经常翻车**。

编译错误、生命周期问题、所有权混乱……AI 生成的 Rust 代码往往需要大量修改才能通过编译。更糟糕的是，当我询问某个 crate 的用法时，AI 给出的 API 经常是过时的或者根本不存在的。

这促使我思考：**能否打造一套专门的 Skills，让 AI 在写 Rust 时更加精准？**

Rust Skills 就是这个问题的答案。

## 2. AI 编写 Rust 面临的四大困境

### 2.1 大模型知识库陈旧

大语言模型的训练数据有截止日期。当你询问 Rust 最新版本有哪些新特性或 tokio 的最新版本时，模型可能给出过时的信息。

Rust 生态系统发展迅速，crate 版本更新频繁。一个曾经正确的用法，可能在后续版本中已经被废弃或改变。

### 2.2 缺乏专业工具调用

大多数 AI 编程助手缺乏获取 Rust 生态实时信息的能力：

- 无法查询 crates.io 获取最新版本
- 无法访问 docs.rs 获取准确 API 文档
- 无法获取 Rust 版本 changelog

结果就是 AI 只能依赖训练数据中的"记忆"，而这些记忆往往是不准确的。

### 2.3 没有编码规范指导

Rust 有其独特的编码规范和最佳实践。命名约定（snake_case vs CamelCase）、格式化规则、错误处理模式……这些都有社区共识。

然而，大多数 AI 并没有系统性地学习这些规范。生成的代码可能能跑，但不够"Rustic"。

### 2.4 Unsafe 规范缺失

Unsafe Rust 是一个需要特别小心的领域。FFI 绑定、裸指针操作、内存布局控制……这些都需要严格遵循安全规范。

一个错误的 unsafe 使用可能导致未定义行为（UB）、内存泄漏，甚至安全漏洞。然而，AI 往往对 unsafe 代码的审查不够严格。

## 3. Rust Skills 如何解决这些问题

### 3.1 核心架构：元问题导向

Rust Skills 采用了一套独特的**元问题导向（Meta-Question Oriented）**知识索引体系，将 Rust 开发中的核心问题分为 15 个元问题类别：

| 编码 | 元问题 | 核心思考 |
|------|--------|----------|
| m01 | 内存所有权与生命周期 | 谁拥有这块内存？何时释放？ |
| m02 | 资源管理平衡 | 如何平衡确定性与灵活性？ |
| m06 | 错误处理哲学 | 失败是预期的还是异常的？ |
| m07 | 并发正确性 | 如何在编译时确保并发安全？ |
| m08 | 安全边界 | 安全边界在哪里？如何构建桥梁？ |

当用户遇到问题时，Rust Skills 会自动识别问题类别，并调用相应的 Skill 提供针对性帮助。

### 3.2 动态 Skills：按需生成的 Crate 知识库

这是 Rust Skills 最具特色的功能之一。

**问题**：Rust 生态有数万个 crate，不可能为每个都预先创建 Skill。

**解决方案**：动态 Skills 根据项目 `Cargo.toml` 中的依赖**按需生成**。

以 tokio 为例：

```bash
# 进入你的 Rust 项目
cd my-async-project

# 同步所有依赖的 Skills
/sync-crate-skills
```

系统会：
1. 解析 `Cargo.toml` 中的依赖
2. 为每个依赖生成专属 Skill
3. 存储在 `~/.claude/skills/` 目录

生成的 tokio Skill 长这样：

```yaml
name: tokio
description: |
  CRITICAL: Use for tokio async runtime questions. Triggers on:
  tokio, spawn, spawn_blocking, select!, join!, try_join!,
  mpsc, oneshot, broadcast, watch, channel, Mutex, RwLock,
  timeout, sleep, interval, Duration, async I/O,
  tokio 怎么用, tokio 用法, tokio 示例, tokio 教程
```

当你询问 "tokio spawn 怎么用" 时，这个 Skill 会被自动触发，AI 会基于最新的 tokio 文档给出准确答案。

**动态 Skills 的优势**：
- **版本追踪**：记录 crate 版本，确保文档时效性
- **按需加载**：只生成你需要的，不浪费资源
- **可更新**：通过 `/update-crate-skill tokio` 随时更新
- **Workspace 支持**：自动处理 Cargo Workspace 的多 crate 项目

### 3.3 编码规范 Skill：500+ 规则的精华提炼

Rust Skills 整合了来自 [Rust 编码规范中文版](https://rust-coding-guidelines.github.io/rust-coding-guidelines-zh/) 的 500+ 编码规则，并进行了智能压缩：

- **P 规则（Prescribed）**：必须遵守的约 80 条核心规则
- **G 规则（Guidance）**：建议遵守的规则，压缩为摘要

规则按影响级别分类：

| 分类 | 影响级别 | 示例规则 |
|------|----------|----------|
| 内存与所有权 | CRITICAL | P.MEM.LFT.01: 生命周期命名规范 |
| 并发与异步 | CRITICAL | P.MTH.LCK.01: 避免死锁 |
| 错误处理 | HIGH | P.ERR.02: 使用 expect 而非 unwrap |
| 代码风格 | MEDIUM | P.NAM.05: Getter 方法不使用 get_ 前缀 |

通过 `/guideline` 命令，你可以快速查询任何规则：

```bash
/guideline P.NAM.05    # 查看具体规则
/guideline naming      # 搜索命名相关规则
```

### 3.4 Unsafe Checker：40+ 规则的安全卫士

针对 Unsafe Rust 的特殊性，我们将其抽离为独立的 `unsafe-checker` Skill：

- **通用原则**：什么时候该用 unsafe
- **安全抽象**：如何构建安全的 API 封装
- **裸指针操作**：NonNull、PhantomData 的正确使用
- **FFI 互操作**：18 条 C/Rust 互操作规则
- **检查清单**：写 unsafe 前和代码审查时的 checklist

```rust
// SAFETY: 我们在上面检查了 index < len，所以这是安全的
unsafe { slice.get_unchecked(index) }
```

每个 `unsafe` 块都应该有 `// SAFETY:` 注释——这是 unsafe-checker 会检查的第一件事。

### 3.5 Clippy 集成：动态获取最新 Lint 信息

通过 `clippy-researcher` Agent，Rust Skills 可以：

- 获取最新的 Clippy lint 列表
- 将 lint 映射到编码规范规则
- 提供修复建议

```bash
/guideline --clippy needless_clone
```

## 4. Actionbook：精准文档获取的核心引擎

**这是 Rust Skills 最强大的秘密武器。**

### 4.1 问题：AI 获取网页文档的困境

当 AI 需要查询 docs.rs 或 crates.io 的信息时，传统方法是：

1. 抓取整个 HTML 页面
2. 解析 DOM 结构
3. 提取需要的信息

这种方法的问题：
- **速度慢**：需要下载整个页面
- **不稳定**：网站结构变化会导致解析失败
- **不准确**：可能提取到无关内容

### 4.2 解决方案：预计算的行动手册

[Actionbook](https://github.com/actionbook/actionbook) 是一个预计算的网站行动手册数据库，包含：

- 页面描述和功能说明
- DOM 结构分析
- 精确的 CSS/XPath 选择器
- 元素类型和允许的操作

**工作流程**：

```
用户询问 tokio 最新版本
    ↓
search_actions("crates.io tokio")
    ↓
获取预计算的选择器
    ↓
agent-browser 精准提取版本号
    ↓
返回: tokio 1.49.0
```

### 4.3 为什么 Actionbook 如此强大

1. **精准提取**：使用预计算的选择器，直接获取目标数据
2. **高效稳定**：无需解析整个页面，速度快且不受页面变化影响
3. **结构化输出**：返回格式化的数据，而非原始 HTML

这就像是给 AI 配备了一本"网站使用手册"——它知道在哪里找到需要的信息，该点击哪个按钮，该提取哪个元素。

### 4.4 支持的网站

Actionbook 目前支持 Rust 生态的关键网站：

| 网站 | 用途 |
|------|------|
| crates.io | Crate 版本、下载量、依赖 |
| lib.rs | Crate 详细信息、分类 |
| docs.rs | API 文档、类型定义 |
| releases.rs | Rust 版本 changelog |

**强烈推荐**：如果你在构建任何需要浏览器自动化的 AI Agent，Actionbook 是必备工具。它将彻底改变你获取网页数据的方式。

## 5. 安装与使用

### 5.1 安装

```bash
# 克隆仓库
git clone https://github.com/actionbook/rust-skills.git

# 使用插件启动 Claude Code
claude --plugin-dir /path/to/rust-skills
```

### 5.2 配置权限

为了支持后台 Agent 运行，需要配置权限：

```bash
mkdir -p .claude
cat >> .claude/settings.local.json << 'EOF'
{
  "permissions": {
    "allow": [
      "Bash(agent-browser *)"
    ]
  }
}
EOF
```

### 5.3 常用命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `/rust-features [version]` | 获取 Rust 版本特性 | `/rust-features 1.84` |
| `/crate-info <crate>` | 获取 crate 信息 | `/crate-info tokio` |
| `/guideline <rule>` | 查询编码规范 | `/guideline P.NAM.05` |
| `/docs <crate> [item]` | 获取 API 文档 | `/docs tokio spawn` |
| `/sync-crate-skills` | 同步 Cargo.toml 依赖的 Skills | - |
| `/unsafe-check [file]` | 检查 unsafe 代码 | `/unsafe-check src/lib.rs` |

### 5.4 使用案例

**案例 1：查询 tokio 最新版本和基本用法**

```
用户：tokio 最新版本是多少？spawn 怎么用？

Claude：
1. 触发 tokio Skill
2. 调用 crate-researcher Agent 获取版本
3. 读取本地 references/task.md 文档
4. 返回版本信息和 spawn 用法示例
```

**案例 2：检查 unsafe 代码**

```
用户：帮我检查这段 unsafe 代码是否有问题

unsafe {
    let ptr = data.as_ptr();
    *ptr.add(index)
}

Claude：
1. 触发 unsafe-checker Skill
2. 检查是否有 SAFETY 注释 ❌
3. 检查边界验证 ❌
4. 提供修复建议和正确示例
```

**案例 3：同步项目依赖的 Skills**

```bash
# 进入项目目录
cd my-rust-project

# 同步 Skills
/sync-crate-skills

# 输出：
# Found 15 dependencies
# Creating skills for: tokio, serde, axum, sqlx, ...
# ✓ Skills synced successfully
```

## 6. 小结与呼吁

Rust Skills 是一个开源项目，旨在让 AI 更好地理解和编写 Rust 代码。它通过：

- **元问题导向**的知识索引
- **动态生成**的 Crate Skills
- **精准获取**的 Actionbook 集成
- **严格规范**的编码和 Unsafe 检查

显著提升了 AI 编写 Rust 代码的准确性和规范性。

### 未来计划

- [ ] 更多领域 Skills（WebAssembly、嵌入式等）
- [ ] IDE 集成（VSCode、IntelliJ）
- [ ] 自动化测试和验证
- [ ] 社区贡献的 Crate Skills

### 参与贡献

我们欢迎任何形式的贡献：

- **提交 Issue**：报告问题或提出建议
- **贡献 Skills**：为常用 crate 编写专属 Skills
- **完善文档**：改进使用说明和示例
- **分享经验**：在社区分享你的使用体验

**仓库地址**：[https://github.com/actionbook/rust-skills](https://github.com/actionbook/rust-skills)

让我们一起，让 AI 写 Rust 更加精准！

---

*作者注：本文由 AI 辅助撰写*
