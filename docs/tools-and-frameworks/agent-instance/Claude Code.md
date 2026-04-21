---
title: Claude Code
sidebar_position: 1
tags: [Claude Code, Agent, AI 编程]
description: Claude Code 的定位、特点、适用场景、使用技巧、同类工具对比和发展方向。
last_update:
  date: 2026-04-20
---

# Claude Code

## 1. 介绍

Claude Code 是 Anthropic 推出的命令行 AI 编程工具。它不是传统 IDE 插件，也不只是聊天窗口，而是一个住在终端里的 coding agent：可以读代码、搜索文件、修改文件、运行命令、解释错误、生成提交说明，也可以通过 MCP 连接外部工具和数据源。

[citation:Claude Code overview](https://docs.anthropic.com/en/docs/claude-code/overview)

### 定位

可以把 Claude Code 理解成“会操作项目目录的 Claude”。它适合放在真实代码仓库里使用，让模型围绕当前项目完成具体工程任务，而不是只给出一段孤立代码。

它的核心定位有三点：

- **终端优先**：直接在项目根目录运行 `claude`，沿用开发者已有的 shell、git、测试命令和编辑流程。
- **Agent 化执行**：不只是回答问题，还能分解任务、读文件、编辑代码、运行验证命令。
- **项目上下文驱动**：通过代码库、`CLAUDE.md`、历史会话、MCP、subagents 等机制理解项目约束。

### 特点

| 特点 | 说明 |
| --- | --- |
| 代码库理解 | 可以搜索、阅读、解释项目结构和关键实现 |
| 文件编辑 | 支持按任务修改代码、文档、配置和测试 |
| 命令执行 | 能运行测试、构建、lint、脚本等命令，并根据结果继续修复 |
| Slash commands | 用 `/clear`、`/compact`、`/model`、`/permissions`、`/review` 等命令控制会话 |
| CLAUDE.md | 用项目说明文件记录构建命令、编码规范、注意事项和团队约定 |
| Subagents | 为代码审查、调试、测试、文档等任务创建专用子 Agent |
| Hooks | 在工具调用前后插入确定性脚本，例如格式化、阻断敏感文件修改、记录命令 |
| MCP | 连接 GitHub、Jira、Figma、Google Drive 等外部上下文或内部工具 |

[citation:Claude Code slash commands](https://docs.anthropic.com/en/docs/claude-code/slash-commands)  
[citation:Claude Code settings](https://docs.anthropic.com/en/docs/claude-code/settings)  
[citation:Claude Code subagents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)  
[citation:Claude Code hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)

### 适用场景

Claude Code 更适合下面这些任务：

- 熟悉一个新代码库：让它先梳理目录结构、核心模块、调用链和运行方式。
- 做中小型功能开发：给出需求，让它先读相关文件，再改代码、补测试、跑验证。
- 修 bug：把报错、日志或复现步骤交给它，让它定位原因并尝试修复。
- 重构和清理：例如统一命名、拆函数、补类型、整理重复逻辑。
- 写测试和文档：让它根据已有风格补单测、README、API 注释或迁移说明。
- 代码审查：用 `/review` 或专门的 review subagent 检查风险、边界条件和测试缺口。
- 自动化杂活：生成 changelog、处理 lint、整理 PR 描述、批量改小问题。

不太适合的场景：

- 没有明确成功标准的“大而空”需求。
- 生产环境高风险操作，例如直接改数据库、删资源、发布线上服务。
- 完全不愿意人工 review 的代码生成。
- 依赖大量私有业务背景，但项目里没有文档或上下文说明。

---

## 2. 常用命令

Claude Code 有两类命令：一类是在 Claude Code TUI 里输入的 slash commands，另一类是在普通终端里执行的 `claude` CLI 命令。两者不要混用。

### 2.1 TUI 中常用命令

进入项目目录后运行 `claude`，会打开交互式 TUI。在 TUI 里常用这些命令：

| 命令 | 用途 |
| --- | --- |
| `/help` | 查看可用命令和当前会话帮助 |
| `/clear` | 清空当前对话上下文，重新开始 |
| `/compact` | 压缩当前上下文，适合长任务继续推进 |
| `/model` | 查看或切换当前使用的模型 |
| `/permissions` | 查看和管理工具权限 |
| `/review` | 对当前改动或指定内容做代码审查 |
| `/init` | 分析项目并生成或更新 `CLAUDE.md` |
| `/memory` | 查看或编辑 Claude Code 的记忆配置 |
| `/mcp` | 查看 MCP server 连接状态和相关工具 |
| `/agents` | 管理项目或用户级 subagents |
| `/hooks` | 查看和配置 hooks |
| `/doctor` | 检查 Claude Code 安装、配置和环境问题 |
| `/cost` | 查看当前会话或近期使用成本 |
| `/status` | 查看当前账号、模型、目录、权限等状态 |
| `/exit` | 退出 Claude Code |

常用操作习惯：

- 新任务开始前可以先 `/clear`，避免旧上下文干扰。
- 长任务中途用 `/compact`，让会话保留关键信息但减少上下文压力。
- 第一次进入项目时用 `/init`，让它生成项目级 `CLAUDE.md`。
- 做代码审查时用 `/review`，比普通提问更适合查风险和遗漏。
- 权限混乱或工具不可用时，先看 `/permissions`、`/mcp`、`/doctor`。

[citation:Claude Code slash commands](https://docs.anthropic.com/en/docs/claude-code/slash-commands)

### 2.2 终端中常用命令

这些命令是在普通 shell / PowerShell / Bash 里执行的，不是在 Claude Code TUI 里执行。

| 命令 | 用途 |
| --- | --- |
| `claude` | 在当前目录启动交互式 Claude Code |
| `claude "解释这个项目的结构"` | 带初始提示启动交互式会话 |
| `claude -p "总结最近的 git diff"` | 非交互模式，直接输出结果，适合脚本 |
| `claude -p "生成 changelog" --output-format json` | 用结构化格式输出，方便被程序消费 |
| `claude -c` | 继续最近一次会话 |
| `claude -r <session-id>` | 恢复指定会话 |
| `claude update` | 更新 Claude Code |
| `claude mcp` | 管理 MCP server 配置 |
| `claude config` | 查看或修改 Claude Code 配置 |
| `claude doctor` | 检查安装和运行环境 |
| `claude --help` | 查看 CLI 帮助 |

常见用法：

```bash
# 在项目根目录启动
claude

# 让 Claude Code 先带着任务进入 TUI
claude "阅读这个项目，告诉我启动和构建命令"

# 非交互模式：适合脚本、CI、自动生成摘要
claude -p "总结当前 git diff，输出中文要点"

# 继续上一次会话
claude -c

# 更新 Claude Code
claude update
```

[citation:Claude Code CLI reference](https://docs.anthropic.com/en/docs/claude-code/cli-reference)

---

## 3. 使用技巧

### 先让它读，再让它改

不要一上来就说“实现某某功能”。更稳的方式是先让它理解上下文：

```text
先阅读这个项目的结构，找出用户登录相关代码，不要修改文件。
```

等它说明相关文件、调用链和风险点后，再让它制定计划或开始改动。

### 把项目规则写进 CLAUDE.md

在项目根目录维护 `CLAUDE.md`，写清楚：

- 如何安装依赖、启动、测试、构建。
- 常用命令和必须通过的检查。
- 目录结构和关键模块说明。
- 编码风格、命名约定、提交规范。
- 哪些文件不能改，哪些操作必须先确认。

这比每次口头重复规则更可靠，也更适合团队共享。

### 任务要小，验收要清楚

Claude Code 能做长任务，但最好把任务拆小。一个好的提示通常包含：

- 要改什么。
- 不要改什么。
- 成功标准是什么。
- 需要跑哪些验证。
- 输出时要说明哪些风险。

例如：

```text
给登录接口补 3 个边界条件测试。不要改业务逻辑。
完成后运行相关测试，并说明新增测试覆盖了哪些情况。
```

### 多用计划模式和只读分析

复杂改动前，先要求它只分析、不编辑：

```text
先给迁移方案，不要修改文件。说明会影响哪些模块、需要哪些测试。
```

这样可以先校准方向，避免 Agent 在错误理解上直接动手。

### 让它自己跑验证，但不要跳过人工 review

Claude Code 的强项是“改完后运行命令，根据失败结果继续修”。常见闭环是：

```text
实现后运行 npm run build。如果失败，先修复构建错误；最后总结改动和验证结果。
```

但最终合并前仍要人工 review，尤其是权限、数据、支付、鉴权、并发、迁移脚本这类高风险代码。

### 用 `/compact` 管理长会话

长任务会积累很多上下文。适时使用 `/compact` 可以压缩会话，并保留当前目标、已改文件、未完成事项和验证状态。压缩前可以明确告诉它保留什么：

```text
/compact 保留当前任务目标、已修改文件、测试结果和后续 TODO。
```

### 用 subagents 做专门工作

如果一个项目经常需要安全审查、性能分析、测试补齐、文档整理，可以创建项目级 subagent。每个 subagent 应该有清楚的职责和工具权限，不要默认给所有权限。

适合拆成 subagent 的任务：

- `code-reviewer`：只做审查，不直接改代码。
- `debugger`：根据日志和测试失败定位问题。
- `test-writer`：专门补测试和测试数据。
- `docs-writer`：按项目文档风格补说明。

### 用 hooks 加确定性护栏

Hooks 的价值是把“必须发生的事”从提示词里拿出来，变成脚本。例如：

- 编辑后自动运行 formatter。
- 修改 `.env`、生产配置、迁移脚本前强制阻断或要求确认。
- 每次 Bash 命令写入审计日志。
- 会话开始时注入当前 issue、分支状态或项目提醒。

这类规则不应该只靠“请你记得”，因为模型可能忘。能脚本化的约束，尽量脚本化。

[citation:Get started with Claude Code hooks](https://docs.anthropic.com/en/docs/claude-code/hooks-guide)

---

## 4. 与其它同类型工具的简单对比

| 工具 | 更像什么 | 优势 | 注意点 |
| --- | --- | --- | --- |
| Claude Code | 终端里的 coding agent | 代码库理解强，适合真实仓库里的多步修改、测试、审查和自动化 | 需要管理权限、上下文和成本；高风险改动仍需人工把关 |
| OpenAI Codex | 云端/本地结合的工程 Agent | 适合长任务、沙箱执行、PR 修复、和 OpenAI 生态结合 | 具体体验取决于接入形态和团队工作流 |
| Cursor | AI 原生 IDE | 交互顺滑，适合边看代码边补全、编辑、问答 | 更偏 IDE 内体验，终端自动化和脚本化不是唯一核心 |
| GitHub Copilot | IDE 辅助编程 | 补全、解释、局部生成成熟，团队普及度高 | 更适合局部开发辅助，复杂跨文件任务需要额外编排 |
| Aider / OpenCode | 开源终端编程助手 | 可控、可改造、适合研究和自托管 | 生态、模型能力和企业治理能力取决于具体配置 |

简单说：

- 想在终端里让 Agent 直接操作仓库，Claude Code 很合适。
- 想在 IDE 里高频补全和局部编辑，Cursor / Copilot 更顺手。
- 想研究可改造的开源 coding agent，可以看 Aider、OpenCode 这类工具。
- 想要更强的云端任务编排、沙箱和 PR 工作流，可以关注 Codex 这类产品方向。

---

## 5. 思想和可能的发展路径

### 从“写代码”到“跑工程流程”

Claude Code 的思想不是把聊天机器人塞进终端，而是把模型接到真实工程循环里：

```text
理解需求 -> 阅读代码 -> 制定计划 -> 修改文件 -> 运行验证 -> 根据结果修复 -> 总结交付
```

这和传统代码补全不同。补全工具主要帮你写下一段代码，Claude Code 更像在参与一个完整开发任务。

### 终端是天然的 Agent 工作台

终端里本来就有 git、测试、构建、lint、部署脚本和各种内部工具。Claude Code 选择终端优先，意味着它可以复用开发者已有工具链，而不是重新发明一个封闭 IDE。

这也是它强调 Unix philosophy 的原因：可以交互使用，也可以用 `claude -p` 放进脚本、CI 或自动化流程里。

### 上下文会从“读文件”走向“读组织”

早期 coding agent 主要读当前仓库。后续会越来越多地接入：

- issue、PR、commit 历史。
- 设计稿、产品文档、会议纪要。
- 监控日志、错误追踪、线上指标。
- 团队规范、权限系统、内部平台。

MCP、hooks、subagents、项目记忆这些机制，本质上都是在解决同一个问题：让 Agent 不只知道代码，还知道代码为什么这么写、该按什么规则改、改完要交给谁验收。

### 权限和治理会变得更重要

Agent 越能干，越不能只靠信任。未来这类工具的发展重点很可能包括：

- 更细的文件、命令、网络和外部系统权限控制。
- 更好的审计日志和可回放执行记录。
- 团队级策略，例如哪些操作必须审批。
- 更稳定的沙箱、回滚和隔离机制。
- 面向企业的成本、模型、数据和合规管理。

### 发展方向

Claude Code 这类工具可能会沿着几条线继续演进：

- **更长任务**：从一次修改，走向能持续跟进 issue、PR 和迭代任务。
- **更多上下文连接**：通过 MCP 接入设计、项目管理、知识库和内部工具。
- **更强工程护栏**：hooks、权限、沙箱、审计、策略管理会成为标配。
- **更专业的子 Agent**：测试、审查、安全、性能、文档等角色会更细分。
- **从个人工具到团队协作层**：不只是帮一个人写代码，而是参与团队的开发流程。

---

## 6. 总结

Claude Code 的价值不在于“能不能生成一段代码”，而在于它把模型放进了真实工程环境：能读项目、改文件、跑命令、接工具、做验证，并且可以通过 `CLAUDE.md`、subagents、hooks 和 MCP 逐步变成团队工作流的一部分。

使用时不要把它当成完全自动驾驶。更好的方式是把它当成一个能力很强、但需要明确边界的工程助手：让它多读、多验证、多总结；把高风险操作交给权限和 hooks；把最终判断留给人。

## 参考

- [Claude Code overview](https://docs.anthropic.com/en/docs/claude-code/overview) - 官方概览，介绍 Claude Code 的定位、安装和核心能力。
- [Claude Code slash commands](https://docs.anthropic.com/en/docs/claude-code/slash-commands) - Slash commands 列表和自定义命令说明。
- [Claude Code CLI reference](https://docs.anthropic.com/en/docs/claude-code/cli-reference) - 终端命令、非交互模式、会话恢复和输出格式说明。
- [Claude Code settings](https://docs.anthropic.com/en/docs/claude-code/settings) - 配置文件、工具权限、环境变量和 subagent 配置。
- [Claude Code subagents](https://docs.anthropic.com/en/docs/claude-code/sub-agents) - 子 Agent 的用途、配置和上下文隔离机制。
- [Claude Code hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) - hooks 事件、阻断机制和结构化输出。
- [Get started with Claude Code hooks](https://docs.anthropic.com/en/docs/claude-code/hooks-guide) - hooks 使用场景和入门示例。
