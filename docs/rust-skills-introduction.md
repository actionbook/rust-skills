# Rust Skills：让 AI 写 Rust 更精准的秘密武器

> 一套专为 Claude Code 打造的 Rust 开发辅助系统——通过元问题导向的知识索引、按需生成的动态 Skills、以及精准的实时文档获取，从根本上解决 AI 编写 Rust 代码"不靠谱"的问题。

---

## 1. 缘起：当 AI 遇上 Rust

如果你用 AI 写过 Rust，大概率经历过这样的场景：

> AI 信心满满地给出一段代码，你满怀期待地按下编译——然后迎来一屏幕的红色错误。生命周期不对、所有权冲突、trait bound 不满足……

**AI 写 Python、JavaScript 还算靠谱，写 Rust 却频频翻车。** 这不是幻觉，而是有深层原因的。

更让人头疼的是版本问题。当你问 "tokio 的 spawn 怎么用"，AI 可能给出一个早已废弃的 API；问 Rust 最新版本有哪些新特性，得到的答案可能已经过时。

这促使我思考一个问题：**能否打造一套专门的工具，让 AI 在写 Rust 时真正"靠谱"起来？**

Rust Skills 就是这个问题的答案。

---

## 2. 问题剖析：AI 写 Rust 的四大困境

### 困境一：知识库与时俱进的难题

大语言模型的训练数据有截止日期——这是它的"阿喀琉斯之踵"。

Rust 生态发展迅猛，crate 版本迭代频繁。一个曾经正确的 crate 用法，可能在后续版本中被弃用。当你询问最新版本信息时，模型只能从"记忆"中搜索，而这些记忆往往已经过时。

### 困境二：缺乏实时信息获取能力

大多数 AI 编程助手是"信息孤岛"：

- 无法查询 crates.io 获取真实版本号
- 无法访问 docs.rs 查阅准确的 API 文档
- 无法获取 Rust 版本的 changelog

没有工具支撑，AI 只能依赖训练数据"凭记忆作答"。

### 困境三：编码规范的系统性缺失

Rust 社区有成熟的编码规范共识：`snake_case` 命名、统一的错误处理模式、特定的格式化风格……

然而，AI 并未系统性地掌握这些规范。生成的代码也许能跑，但往往不够 "Rustic"——缺乏那种地道的 Rust 风味。

### 困境四：Unsafe 审查形同虚设

Unsafe Rust 是一片需要小心翼翼的雷区。FFI 绑定、裸指针操作、内存布局控制……一步走错，轻则内存泄漏，重则未定义行为（UB）甚至安全漏洞。

遗憾的是，AI 对 unsafe 代码的审查往往流于表面。

---

## 3. 破局之道：Rust Skills 的核心设计

### 3.1 元问题导向：让 AI 像专家一样思考

Rust Skills 的知识体系建立在一个核心洞察之上：**Rust 开发中的问题可以归纳为若干"元问题"**。

我们将 Rust 开发的核心挑战提炼为 15 个元问题类别：

| 编码 | 元问题 | 核心追问 |
|:----:|--------|----------|
| m01 | 内存所有权与生命周期 | 这块内存归谁所有？何时释放？ |
| m02 | 资源管理的确定性与灵活性 | 如何在可控与灵活之间找到平衡？ |
| m06 | 错误处理的哲学 | 这个失败是意料之中，还是意外？ |
| m07 | 并发安全的编译期保证 | 如何让编译器帮我守护并发正确性？ |
| m08 | 安全边界的识别与跨越 | 安全与 unsafe 的边界在哪里？|

当用户提出问题时，系统会自动识别其所属的元问题类别，调用对应的专项 Skill 提供精准帮助。这就像给 AI 配备了一位经验丰富的 Rust 导师。

### 3.2 动态 Skills：按需生成的 Crate 专属知识库

**这是 Rust Skills 最具创新性的设计。**

面对一个现实问题：Rust 生态有数万个 crate，为每个都预置 Skill 既不现实也不必要。

我们的解决方案是**动态生成**——根据你项目的 `Cargo.toml` 依赖，按需创建专属 Skill。

以 tokio 为例，只需一条命令：

```bash
cd my-async-project
/sync-crate-skills
```

系统会自动完成：
1. 解析 `Cargo.toml` 中的所有依赖
2. 为每个 crate 生成包含最新文档的专属 Skill
3. 存储到本地 `~/.claude/skills/` 目录

生成的 Skill 会被自动触发。当你询问 "tokio spawn 怎么用" 时，AI 将基于最新的 tokio 1.49 文档给出准确答案，而非过时的"记忆"。

**动态 Skills 的独特优势**：

| 特性 | 说明 |
|------|------|
| 版本追踪 | 每个 Skill 记录对应 crate 版本，确保时效性 |
| 按需加载 | 只生成项目实际依赖的，不浪费资源 |
| 一键更新 | `/update-crate-skill tokio` 随时刷新 |
| Workspace 支持 | 自动处理 Cargo Workspace 的复杂依赖关系 |

### 3.3 编码规范 Skill：500+ 规则的精华浓缩

我们整合了 [Rust 编码规范中文版](https://rust-coding-guidelines.github.io/rust-coding-guidelines-zh/) 的 500+ 条规则，并进行了智能分层：

- **P 规则（Prescribed）**：约 80 条必须遵守的核心规则
- **G 规则（Guidance）**：建议遵守的规则，压缩为可检索的摘要

规则按影响级别精心分类：

| 分类 | 级别 | 典型规则 |
|------|:----:|----------|
| 内存与所有权 | CRITICAL | P.MEM.LFT.01: 生命周期参数命名规范 |
| 并发与异步 | CRITICAL | P.MTH.LCK.01: 死锁预防策略 |
| 错误处理 | HIGH | P.ERR.02: 优先使用 `expect` 而非 `unwrap` |
| 代码风格 | MEDIUM | P.NAM.05: Getter 方法不加 `get_` 前缀 |

通过 `/guideline` 命令即可快速查询：

```bash
/guideline P.NAM.05     # 查看具体规则详情
/guideline naming       # 模糊搜索命名相关规则
```

### 3.4 Unsafe Checker：40+ 规则构建的安全防线

鉴于 Unsafe Rust 的特殊重要性，我们将其抽离为独立的 `unsafe-checker` Skill，涵盖：

- **准入原则**：何时才真正需要 unsafe
- **安全抽象**：如何用 safe 的外壳包裹 unsafe 的内核
- **指针操作**：`NonNull`、`PhantomData` 的正确姿势
- **FFI 互操作**：18 条 C/Rust 跨语言调用规则
- **检查清单**：写前自查 + 代码审查两份 checklist

一个基本原则：**每个 `unsafe` 块都必须有 `// SAFETY:` 注释**。

```rust
// SAFETY: 上方已验证 index < len，此处访问必然在边界内
unsafe { slice.get_unchecked(index) }
```

这是 unsafe-checker 检查的第一道关卡。

### 3.5 Clippy 深度集成：始终获取最新 Lint

通过 `clippy-researcher` Agent，系统能够：

- 实时获取最新 Clippy lint 列表
- 智能映射 lint 到对应的编码规范规则
- 提供针对性的修复建议

```bash
/guideline --clippy needless_clone
```

---

## 4. Actionbook：精准文档获取的核心引擎

**如果要选出 Rust Skills 最强大的单一能力，非 Actionbook 莫属。**

### 传统方案的困境

当 AI 需要查询 docs.rs 或 crates.io 时，常规做法是：抓取整个 HTML → 解析 DOM → 提取信息。

这条路问题重重：
- **效率低**：下载和解析整个页面耗时耗力
- **脆弱**：网站结构稍有调整就可能解析失败
- **噪声大**：容易混入无关内容

### Actionbook 的破局思路

[Actionbook](https://github.com/actionbook/actionbook) 采用了一种更聪明的方式：**预计算**。

它预先分析目标网站，生成结构化的"行动手册"，包含：
- 页面功能描述
- DOM 结构分析
- 精确的 CSS/XPath 选择器
- 元素类型与可执行操作

**实际工作流程**：

```
用户: "tokio 最新版本是多少？"
          ↓
search_actions("crates.io tokio")
          ↓
获取预计算的精确选择器
          ↓
agent-browser 定点提取版本号
          ↓
返回: tokio 1.49.0 ✓
```

### 为何 Actionbook 堪称"神器"

| 优势 | 说明 |
|------|------|
| 精准 | 预计算选择器直取目标，无需大海捞针 |
| 高效 | 无需下载解析整页，响应速度大幅提升 |
| 稳健 | 不受页面细节变动影响 |
| 结构化 | 输出格式化数据，而非原始 HTML |

形象地说，Actionbook 就像给 AI 配了一本"网站操作手册"——哪里有需要的信息、该点哪个按钮、该提取哪个元素，一清二楚。

### 已支持的 Rust 生态网站

| 网站 | 获取内容 |
|------|----------|
| crates.io | 版本号、下载量、依赖关系 |
| lib.rs | crate 详情、分类信息 |
| docs.rs | API 文档、类型定义 |
| releases.rs | Rust 版本 changelog |

> **强烈推荐**：如果你正在构建任何需要网页数据获取的 AI Agent，Actionbook 是改变游戏规则的利器。

---

## 5. 快速上手

### 5.1 安装

```bash
# 克隆仓库
git clone https://github.com/actionbook/rust-skills.git

# 以插件模式启动 Claude Code
claude --plugin-dir /path/to/rust-skills
```

### 5.2 配置权限

为支持后台 Agent 运行，需添加权限配置：

```bash
mkdir -p .claude
cat >> .claude/settings.local.json << 'EOF'
{
  "permissions": {
    "allow": ["Bash(agent-browser *)"]
  }
}
EOF
```

### 5.3 核心命令速查

| 命令 | 功能 | 示例 |
|------|------|------|
| `/rust-features [ver]` | 查询 Rust 版本特性 | `/rust-features 1.84` |
| `/crate-info <name>` | 获取 crate 信息 | `/crate-info tokio` |
| `/guideline <rule>` | 查询编码规范 | `/guideline P.NAM.05` |
| `/docs <crate> [item]` | 获取 API 文档 | `/docs tokio spawn` |
| `/sync-crate-skills` | 同步项目依赖的 Skills | - |
| `/unsafe-check [file]` | 审查 unsafe 代码 | `/unsafe-check src/lib.rs` |

### 5.4 实战场景

**场景一：查询 crate 版本与用法**

```
👤 tokio 最新版本？spawn 怎么用？

🤖 处理流程：
   1. 触发 tokio Skill
   2. crate-researcher Agent 获取版本 → 1.49.0
   3. 读取本地 references/task.md
   4. 返回版本 + spawn 完整用法示例
```

**场景二：unsafe 代码审查**

```
👤 帮我检查这段代码：
   unsafe {
       let ptr = data.as_ptr();
       *ptr.add(index)
   }

🤖 检查结果：
   ❌ 缺少 SAFETY 注释
   ❌ 未验证 index 边界
   → 提供修复建议与正确示例
```

**场景三：一键同步项目依赖**

```bash
cd my-rust-project
/sync-crate-skills

# 输出：
# 📦 发现 15 个依赖
# ⚡ 创建 Skills: tokio, serde, axum, sqlx...
# ✅ 同步完成
```

---

## 6. 写在最后

Rust Skills 是一个开源项目，致力于从根本上改善 AI 编写 Rust 代码的体验。

它通过四大核心能力实现这一目标：

- **元问题导向**的知识索引体系
- **按需生成**的动态 Crate Skills
- **Actionbook 驱动**的精准文档获取
- **体系化**的编码规范与 Unsafe 审查

### 路线图

- [ ] 拓展领域 Skills（WebAssembly、嵌入式开发等）
- [ ] IDE 集成支持（VSCode、IntelliJ）
- [ ] 自动化质量验证
- [ ] 社区贡献的 Crate Skills 生态

### 加入我们

我们欢迎各种形式的参与：

- **Issue 反馈**：报告问题、提出建议
- **Skill 贡献**：为常用 crate 编写专属 Skills
- **文档完善**：改进说明、补充示例
- **经验分享**：在社区传播你的使用心得

**项目地址**：[https://github.com/actionbook/rust-skills](https://github.com/actionbook/rust-skills)

---

**让我们一起，让 AI 写 Rust 真正靠谱起来。**

---

*本文使用 Rust Skills 的 writing-assistant Skill 辅助润色。*
