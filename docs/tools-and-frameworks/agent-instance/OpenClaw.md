---
title: OpenClaw
sidebar_position: 5
tags: [OpenClaw, Agent, 自动化]
description: OpenClaw 是面向个人自动化和多渠道接入的开源 Agent 平台。
last_update:
  date: 2026-04-20
---

# OpenClaw

## 介绍

OpenClaw 是一个开源、自托管的个人 Agent 平台，定位介于“聊天助手”和“自动化工作台”之间。它不是只回答问题，而是希望通过模型、记忆、工具、技能和消息渠道，把任务真正执行完。

官方文档把 OpenClaw 描述为可连接 50+ 渠道、5700+ Skills、支持任意模型的开源 Agent 平台 [citation:OpenClaw](https://openclawdoc.com/)。常见入口包括 Telegram、Slack、飞书、微信、Discord、WebChat 等，也可以通过本地或私有服务器运行。

### 主要特点

- **自托管与隐私优先**：对话、记忆和配置可以留在自己的机器或服务器上，适合不希望把全部工作流托管给第三方平台的用户。
- **多渠道接入**：一个 Agent 可以从多个聊天入口触发，适合把 AI 助手放进日常沟通工具里。
- **模型无关**：可以接 OpenAI、Claude、Gemini、Mistral 等云模型，也可以通过 Ollama、LM Studio 等方式接本地模型 [citation:OpenClaw Models](https://openclawdoc.com/docs/models/overview/)。
- **Skills 扩展**：Skills 是较高层的能力包，可以组合搜索、邮件、文件、浏览器、日程等工具，形成可复用的任务能力 [citation:OpenClaw Skills](https://openclawdoc.com/docs/skills/overview/)。
- **沙箱与权限控制**：官方强调最小权限、沙箱隔离、网络控制、审计日志等安全机制 [citation:OpenClaw Security](https://openclawdoc.com/docs/security/overview/)。

### 适用场景

OpenClaw 更适合长期、重复、有明确边界的个人或团队自动化任务，例如：

- 每天整理邮件、日程、待办和消息摘要。
- 在飞书、Slack、Telegram 等渠道里触发固定工作流。
- 把常用脚本、API、知识库查询包装成 Skills。
- 用本地模型处理隐私要求较高的轻量任务。
- 给个人服务器或内部工具加一个自然语言操作入口。

不太适合一上来就交给它高风险任务，例如删除文件、批量发邮件、修改生产数据、自动付款等。这类任务需要人工确认、权限隔离和审计记录。

## 使用技巧

1. **先从低风险任务开始**

   可以先让它做“只读”任务：总结邮件、查询日程、整理文件列表、生成草稿。确认行为稳定后，再逐步开放写入、发送、执行命令等权限。

2. **给 Agent 明确边界**

   不要只写“帮我处理邮件”，而要写清楚规则，例如“只整理摘要，不删除邮件”“所有外发内容先生成草稿”“遇到金额、合同、账号信息必须询问确认”。

3. **按任务拆 Skills**

   Skills 不宜做得过大。一个 Skill 最好对应一个清晰能力，例如“生成晨报”“检索知识库”“创建日程草稿”。这样更容易调试，也更容易控制权限。

4. **模型分层使用**

   简单分类、摘要、格式转换可以用便宜或本地模型；涉及复杂规划、工具调用和长上下文时，再切到更强模型。OpenClaw 的模型无关设计适合做这种组合。

5. **权限默认收紧**

   Shell、文件写入、浏览器自动化、外部网络访问都应按需开启。尤其是第三方 Skills，安装前要看权限声明和来源，避免把敏感数据暴露给不可信代码。

6. **保留审计和人工确认**

   对发邮件、改文档、跑命令、调用外部 API 这类动作，建议开启日志，并设置确认步骤。Agent 最容易出问题的地方不是“不会想”，而是“想错了还真的执行了”。

## 常用命令

OpenClaw 的日常使用大致分两类：一类是在终端里启动和检查服务，另一类是在 TUI 里切换模型、Agent、会话和控制运行状态。

### 终端命令

| 命令 | 用途 |
| --- | --- |
| `openclaw --version` | 查看 CLI 是否安装成功 |
| `openclaw onboard --install-daemon` | 初始化配置，并安装后台服务 |
| `openclaw gateway` | 启动 Gateway，TUI 和各渠道都通过它连接 |
| `openclaw tui` | 打开终端交互界面 |
| `openclaw tui --deliver` | 打开 TUI，并允许把回复投递到外部渠道 |
| `openclaw tui --url ws://HOST:PORT --token TOKEN` | 连接远程 Gateway |
| `openclaw status` | 查看当前运行状态 |
| `openclaw doctor` | 做环境和配置检查 |
| `openclaw dashboard` | 打开或进入 Dashboard |
| `openclaw logs --follow` | 跟踪 Gateway 日志 |
| `openclaw models status` | 检查模型提供方状态 |
| `openclaw agents list` | 查看可用 Agent |

官方安装文档还给出快速安装方式：Linux / macOS 可用 `curl -fsSL https://openclaw.ai/install.sh | bash`，Windows PowerShell 可用 `iwr -useb https://openclaw.ai/install.ps1 | iex` [citation:OpenClaw Installation](https://openclawdoc.com/docs/getting-started/installation/)。

### TUI 常用斜杠命令

| 命令 | 用途 |
| --- | --- |
| `/help` | 查看帮助 |
| `/status` | 查看当前 Gateway、Agent、会话状态 |
| `/agents` 或 `/agent ID` | 查看或切换 Agent |
| `/sessions` 或 `/session KEY` | 查看或切换会话 |
| `/models` 或 `/model PROVIDER/MODEL` | 查看或切换模型 |
| `/think MODE` | 调整思考强度，可选 `off`、`minimal`、`low`、`medium`、`high` |
| `/fast MODE` | 查看或切换快速模式，可选 `status`、`on`、`off` |
| `/verbose MODE` | 控制输出详细程度，可选 `on`、`full`、`off` |
| `/reasoning MODE` | 控制 reasoning 显示方式，可选 `on`、`off`、`stream` |
| `/usage MODE` | 控制 token 用量显示，可选 `off`、`tokens`、`full` |
| `/elevated MODE` | 控制高权限操作策略，可选 `on`、`off`、`ask`、`full` |
| `/deliver MODE` | 控制是否向外部渠道投递回复，可选 `on`、`off` |
| `/new` 或 `/reset` | 重置当前会话 |
| `/abort` | 中止当前运行 |
| `/settings` | 打开设置面板 |
| `/exit` | 退出 TUI |

在 TUI 里还可以用 `!` 执行本地命令，例如 `! pwd`、`! ls`。第一次使用时 TUI 会询问是否允许本地执行；这些命令在 TUI 当前工作目录里运行，但不会保留上一次命令的 `cd` 或环境变量 [citation:OpenClaw TUI](https://docs.openclaw.ai/tui)。

### TUI 快捷键

| 快捷键 | 用途 |
| --- | --- |
| `Enter` | 发送消息 |
| `Esc` | 中止当前运行 |
| `Ctrl+C` | 清空输入，连续两次退出 |
| `Ctrl+D` | 退出 |
| `Ctrl+L` | 打开模型选择器 |
| `Ctrl+G` | 打开 Agent 选择器 |
| `Ctrl+P` | 打开会话选择器 |
| `Ctrl+O` | 展开或折叠工具输出 |
| `Ctrl+T` | 显示或隐藏 thinking |

## 与同类型工具的简单对比

| 工具 | 更偏向 | 主要优势 | 需要注意 |
| --- | --- | --- | --- |
| OpenClaw | 个人自动化、多渠道 Agent | 自托管、多渠道、Skills 生态、模型选择灵活 | 权限和安全配置需要认真做 |
| CoPaw | 本地个人助理、私有部署 | 强调本地数据、多智能体协作、定时任务 | 生态成熟度和可用 Skills 要看实际需求 |
| DeerFlow | 深度研究、SuperAgent 编排 | 任务拆解、子代理、沙箱和研究报告链路更完整 | 系统更重，适合复杂任务而非轻量个人入口 |
| Claude Code / Codex 类工具 | 编程与代码库操作 | 对代码理解、编辑、测试和工程流程更强 | 主要面向开发，不是通用个人助理 |
| LangChain / AutoGen / CrewAI | Agent 开发框架 | 适合开发者搭建自己的 Agent 应用 | 需要更多工程实现，不是开箱即用产品 |

简单说，OpenClaw 的特点是“把 Agent 放进日常渠道，并让它能调用技能做事”。如果目标是个人自动化和多入口助手，它比较合适；如果目标是严肃代码开发，Claude Code / Codex 更直接；如果目标是复杂研究和多 Agent 编排，DeerFlow 这类系统更完整。

## 思想和可能的发展路径

OpenClaw 背后的核心思想是：未来的 AI 助手不只是一个聊天窗口，而是一个可以长期运行、接入多个渠道、记住上下文、调用工具并执行任务的个人操作层。

它把 Agent 拆成几层：

- **模型层**：负责理解、规划和生成。
- **记忆层**：保存短期上下文和长期偏好。
- **工具 / Skills 层**：把外部世界变成可调用能力。
- **渠道层**：让用户从常用聊天工具、Web 或 API 触发任务。
- **安全层**：用沙箱、权限、审计和确认机制约束执行风险。

这个思路的价值在于把“会说话的模型”变成“能接入工作流的执行者”。但它的发展上限不只取决于模型能力，也取决于权限系统、技能质量、可观测性和用户信任。

后续可能的发展路径包括：

- **更强的 Skill 市场**：像应用商店一样沉淀可复用能力，但需要解决安全审核和版本质量问题。
- **更细的权限模型**：从“是否允许工具”发展到“允许访问哪些文件、哪些域名、哪些账号、哪些动作”。
- **更稳定的长期记忆**：记住偏好、历史任务和工作上下文，同时允许用户查看、编辑和删除记忆。
- **更好的人工协同**：高风险动作走确认，低风险动作自动执行，让 Agent 成为半自动助理，而不是完全失控的后台进程。
- **企业化部署**：团队共享 Skills、统一审计、统一模型路由和统一安全策略，会是进入组织场景的关键。

总体来看，OpenClaw 代表的是“个人 Agent OS”的方向：它不一定替代专业工具，而是把模型、工具和消息渠道串起来，成为个人或小团队自动化的中间层。

## 参考

- [OpenClaw 官方文档](https://openclawdoc.com/)
- [OpenClaw Agents](https://openclawdoc.com/docs/agents/overview/)
- [OpenClaw Skills](https://openclawdoc.com/docs/skills/overview/)
- [OpenClaw Security](https://openclawdoc.com/docs/security/overview/)
- [OpenClaw Models](https://openclawdoc.com/docs/models/overview/)
