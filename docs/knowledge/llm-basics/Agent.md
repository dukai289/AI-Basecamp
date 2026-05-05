---
title: Agent 智能体
sidebar_position: 10
tags: [Agent, AI Agent, 工具调用, 多智能体, Agent框架]
description: 解释大语言模型 Agent 的基本概念、意义、运行循环、系统构成，以及常见 Agent 开发框架。
last_update:
  date: 2026-04-30
---

# Agent *智能体*

:::tip[内容]
Agent 的基本概念、构成与运行循环，以及一些开发框架的介绍。
:::

Agent 是大语言模型应用从"生成回答"走向"执行任务"的关键形态，是将模型、提示词、工具、状态、记忆、规划、执行控制和评估监控组织起来的系统。

简单地概括：**Agent 是由 LLM 驱动、能够基于目标规划动作、调用工具并根据反馈继续执行任务的系统**。

在前面的基础篇中，已经讨论了 Token、Embedding、Attention、Transformer、解码和提示工程。这些内容解释了模型如何理解上下文并生成下一个 token。

Agent 则关注更高一层的问题：如何让模型不只是回答，而是在受控边界内完成一个可验收的任务。

---

## 1. Agent 介绍

### 1.1 Agent - 从理论到实践

基于 LLM 的 Chatbot 本身有思考、规划的能力，可以给出解法问题的方法，但缺少与现实世界真正的交互所以无法直接执行现实任务。

换句话说，LLM 可以成为像霍金一样的思考者，但与现实世界的实践相隔着巨大的鸿沟。

Agent 的出现就是用来连接 LLM 与现实世界 - **把人工智能的能力从理论推广到社会实践中**。

在 LLM 场景中，Agent 通常指一种具有以下特征的系统：

- 目标方面，可以接收用户目标或外部事件。
- 交互性方面，可以调用工具、检索资料、读写文件、访问 API 或执行代码。
- 可自主决策：基于上下文或者根据工具结果和环境反馈继续决策。
- 有真正的交付：在满足完成条件后输出结果或交付物。

Agent 与普通 Chatbot 的差异在于是否形成了**目标驱动的执行闭环**。

严格来说，Agent 并不是"模型自己行动"：
- LLM 模型通常只作为大脑，生成文本或结构化 tool call。
- 真正执行动作的是 Agent 提供的应用层、工具层或运行时环境。

### 1.2 Agent 的意义

Agent 远远扩展了 LLM 的作用范围。

普通 LLM 调用擅长处理单次输入输出，例如解释概念、总结文本、改写文档、生成代码片段。Agent 更适合处理开放目标和多步骤任务。

从系统设计角度看，Agent 的价值主要体现在四个方面：

| 价值 | 说明 |
| --- | --- |
| 连接外部世界 | 通过工具访问实时数据、私有系统和可执行环境 |
| 处理多步骤任务 | 将单次回答扩展为计划、执行、观察、修正的循环 |
| 动态决策 | 根据中间结果选择下一步，而不是固定执行预设流程 |
| 形成可交付结果 | 产出文件、代码、记录、分析结论或业务动作 |

当然，Agent 不是所有 LLM 应用的默认答案：
- 如果任务边界清晰、流程确定、输入输出简单，普通模型调用或者工作流往往更稳定、更便宜。
- Agent 更适合问题路径不完全可预设、需要工具反馈、需要跨步骤调整的场景。

### 1.3 Agent 与 LLM、Workflow 的关系

LLM、Workflow 和 Agent 解决的问题层级不同：
- LLM 主要针对生成与判断。
- Workflow 适用于确定性流程。
- Agent 更偏向于在目标约束下动态选择动作。

| 类型 | 核心特点 | 适合场景 |
| --- | --- | --- |
| LLM | 单次或少量模型调用，主要输出文本或结构化结果 | 总结、分类、抽取、改写、问答 |
| Workflow | 流程由代码或规则预先定义，执行路径相对固定 | 审批流、ETL、固定表单处理、标准业务自动化 |
| Agent | 由模型根据目标、状态和反馈动态决定下一步动作 | 研究助手、代码任务、多工具排障、开放式任务执行 |

Workflow 可以理解成一种狭义上的 Agent - 有固定执行路径。广义的 Agent 更强调自主规划路径和决策。 

---

## 2. Agent 系统的构成

了解了 Agent 这个概念后，我们来讨论一下 Agent 系统的构成。

### 2.1 模型与指令

模型是 Agent 的推理与生成核心，它负责理解目标、读取上下文、选择工具、组织输出和处理异常。

提示词作为指令则定义 Agent 的角色、任务边界、工具使用规则、输出格式和不确定性处理方式。

一个 Agent 中模型与指令基础配置通常包括：

- 模型：决定理解、推理、工具调用和多模态能力上限。
- 推理参数：temperature、max tokens、tool choice 等。
- System instructions：定义行为边界和任务规范等。
- 输出格式：自然语言、结构化对象、工具参数或文件。

模型越强，Agent 的决策质量通常越好；但 Agent 的可靠性不能只依赖模型。工具接口、状态、权限和评估同样决定系统上限。

### 2.2 工具与外部系统

工具是 Agent 的行动接口。

常见工具包括：
- 搜索引擎和 RAG 检索器。
- 数据库查询和业务 API。
- 文件系统、代码编辑器和命令执行器。
- 浏览器、邮件、日历、计算器、图表生成器、表格处理器等基础办公工具。
- 其他 Agent 或子任务执行器。

工具设计应满足几个原则：

- 名称和描述清晰，避免模型误用。
- 参数 schema 可校验。
- 返回结果结构化，便于后续上下文使用。
- 副作用明确区分，例如只读、写入、发送、删除、支付。
- 高风险工具必须有审批、预览、回滚或人工确认。

工具不是越多越好。工具过多会增加上下文成本和选择错误概率。实际系统常通过路由、权限和任务类型限制可用工具集。

### 2.3 状态、记忆与上下文管理

Agent 需要处理两类信息：

| 类型 | 作用 | 常见载体 |
| --- | --- | --- |
| 短期上下文 | 支撑当前一步模型决策 | messages、工具结果、当前文件片段、检索证据 |
| 外部状态 | 支撑跨步骤、跨会话和可恢复执行 | 数据库、checkpoint、任务状态对象、记忆库 |

上下文窗口通常是有限的。Agent 不能把所有历史、工具结果和文件内容都放入 prompt。更稳妥的方式是：

- 当前决策必须使用的信息进入上下文。
- 长期偏好、项目事实和历史决策保存在外部记忆。
- 工具结果先过滤、摘要或结构化，再注入模型。
- 任务状态用明确字段保存，而不是只依赖对话历史。
- 长任务使用 checkpoint 支持暂停、恢复和回放。

相关工程细节见 [上下文管理](../engineering/上下文管理.md)。

### 2.4 规划与执行

Agent 往往需要把目标拆成步骤来执行。任务规划可以由模型动态生成，也可以由代码或工作流预先定义。

常见规划与执行模式包括：

| 模式 | 说明 | 适合场景 |
| --- | --- | --- |
| 单步工具调用 | 模型判断一次工具调用后回答 | 简单查询、表单补全、计算 |
| ReAct 循环 | 在推理、行动、观察之间迭代 | 搜索、排障、代码任务 |
| Plan-and-Execute | 先生成计划，再逐步执行 | 多步骤研究、复杂文档处理 |
| 图工作流 | 用节点和边定义执行路径 | 需要可控分支、恢复和人工介入的流程 |
| 多 Agent 协作 | 不同 Agent 分工处理子任务 | 专业分工明显、上下文需要隔离的任务 |

Agent 在规划、执行方面的设计是影响 Agent 智能水平的重要因素，也是 Agent 区别于 Workflow 和 Chatbot 最大的方面。

### 2.5 验证与防护

Agent 的风险可能来自模型输出，也可能来自工具副作用。这就需要验证与防护，工程上一般称之为 Guardrials。

验证是 Agent 系统中经常被低估的一环。Agent 执行完并不代表任务完成。系统需要检查输出是否满足格式、证据、测试、权限、预算和业务规则。
- 对于代码任务，验证可能是运行测试；
- 对于 RAG 任务，验证可能是答案是否有证据支持；
- 对于业务动作，验证可能是审批记录和操作结果一致。

验证一般是指偏向于业务规则的，而防护则是系统上更一般的概念。通用的基础防护则包括：

- 输入检查：用户请求是否越权、恶意或缺少必要信息。
- 工具检查：参数是否合规、权限是否允许、是否需要确认。
- 输出检查：是否泄露敏感信息、是否符合格式和证据要求。
- 成本控制：限制最大循环次数、token、工具调用次数和运行时间。

### 2.6 可观测性

另外， Agent 需要全程的观测来监控运行。

一般是通过日志与追踪的方式来记录模型调用、工具调用、状态变化和错误。

没有可观测性，就很难判断 Agent 是因为 prompt、检索、工具、模型、状态还是权限设计而失败。

生产系统应保留 trace、span、工具输入输出、模型版本和关键状态变更。

### 2.7 小结

总结一下，一个完整的 Agent 系统包括下面几个结构：

| 构成因素 | 核心作用 |
| :---: | --- |
| 模型与指令 | 理解目标、选择动作、生成回答或工具调用 |
| 工具与外部系统 | 连接检索、数据库、文件、代码执行和业务 API |
| 状态、记忆与上下文管理 | 保存任务进度、历史决策和跨步骤上下文 |
| 规划与执行 | 将目标拆成步骤，并根据反馈调整路径 |
| 验证与防护 | 检查输出、权限、工具副作用和风险边界 |
| 可观测性 | 记录模型调用、工具调用、状态变化和错误 |

这些因素共同决定 Agent 能否从一次回答扩展为可控、可恢复、可验证的任务执行系统。

---

## 3. Agent Loop 与设计

在对 Agent 的结构有了基本认识后，我们就可以谈谈 Agent 的运行了。

### 3.1 循环

一个典型 Agent 可以抽象为下面这个循环：

```text
目标
  -> 观察当前上下文和状态
  -> 决定下一步动作
  -> 调用工具或生成中间结果
  -> 接收反馈
  -> 更新状态
  -> 判断是否完成
```

这个循环被称为 agent loop。它不是某个固定算法，而是一类系统结构。

不同框架可能采用 ReAct、函数调用、图编排、状态机、多 Agent 协作或工作流节点来实现。

### 3.2 Tool Calling

一般在 Agent 中会涉及大量的工具使用，这个最基础的执行能力来自 [工具调用](../engineering/工具调用.md) - 模型根据上下文和 tools schema 判断是否需要工具，并生成结构化调用请求：

```text
用户目标
  -> 模型选择工具和生成参数
  -> 应用层校验参数与权限
  -> 执行工具
  -> 工具结果回填上下文
  -> 模型继续判断或输出结果
```

这个闭环要注意两个边界：

1. 模型生成的是调用意图，不应直接拥有无约束执行权。
2. 工具结果是新的上下文，可能影响下一步决策，也可能引入错误、噪声或恶意内容。

因此，工具调用需要 schema、权限、超时、重试、审计、错误格式和结果过滤。这些工程边界用来保证 Agent 自动化的可控性。

### 3.3 自主性设计

Agent 常被描述为"自主系统"，这种自主性也是 Agent 智能的主要来源，但自主性应按风险分级设计。

| 自主级别 | 行为方式 | 适合场景 |
| :---: | --- | --- |
| 建议型 | 只给出计划或建议，不执行动作 | 高风险决策、生产变更、法律或财务判断 |
| 半自动 | 执行低风险动作，高风险动作需确认 | 办公自动化、客服辅助、代码修改预览 |
| 自动执行 | 在限定工具、权限和预算内持续执行 | 检索整理、数据清洗、批量低风险任务 |
| 多 Agent 协作 | 多个专业 Agent 分工、交接或互审 | 研究、复杂文档、软件工程、运营流程 |

工程目标不是让 Agent 尽可能自由，而是让它在明确目标、权限、预算和验收标准内完成任务。

---

## 4. Agent 开发框架

Agent 框架的作用是提供模型调用、工具注册、状态管理、多步骤编排、人工介入、追踪和部署等基础设施。

不同框架的抽象层次不同：有的偏轻量 SDK，有的偏图编排，有的偏多 Agent 协作，有的提供多种场景的 Agent 快速上手。

### 4.1 OpenAI Agents SDK

OpenAI Agents SDK 是 OpenAI 推出的轻量级 Agent 开发 SDK。

在 [OpenAI Agents SDK - Agents](https://openai.github.io/openai-agents-python/agents/) 中，将 Agent 定义为配置了 instructions、tools，并可选 handoffs、guardrails、structured outputs 等运行时的 LLM。

它的核心 primitives 包括：

- Agents：带 instructions 和 tools 的 LLM。
- Agents as tools / Handoffs：允许 Agent 委托给其他 Agent。
- Guardrails：对输入、输出和工具调用做校验。
- Sessions / memory：维护会话历史或长期运行记忆。
- Tracing：记录 LLM generation、tool call、handoff、guardrail 等事件。

官方概览强调，SDK 用较少抽象表达工具和 Agent 关系，并内置 tracing 以便调试和监控 agentic flows。

OpenAI Agents SDK 适用于下面的场景：

- 使用 OpenAI 模型和工具生态构建 Agent。
- 需要轻量、直接、可观察的工具调用闭环。
- 需要 handoff、guardrails、session memory 和 tracing 的应用。

### 4.2 LangChain 与 LangGraph

LangChain 是 LLM 应用与 Agent 开发框架，提供标准模型接口、工具、Agent、RAG、结构化输出和可观测性。

LangGraph 是更底层的 Agent 编排框架和运行时，面向长任务、状态化 Agent 和复杂工作流。官方将其定位为 low-level orchestration framework，重点能力包括 durable execution、streaming、human-in-the-loop 和 memory。

LangChain Agents 构建在 LangGraph 之上，从而获得 durable execution、streaming、human-in-the-loop、persistence 等能力。

LangChina 和 LangGraph 二者可以这样区分：

| 框架 | 主要定位 | 适合场景 |
| --- | --- | --- |
| LangChain | 快速构建 LLM 应用和常见 Agent | 工具调用、RAG、结构化输出、简单 Agent |
| LangGraph | 精细控制状态、节点、分支和持久执行 | 长任务、复杂流程、多 Agent、人工介入 |

在具体地使用上：
- 如果只是快速搭建一个带工具的 Agent，LangChain 的高层接口更直接；
- 如果需要可恢复执行、复杂状态机、分支循环和人工审核，LangGraph 更合适。

### 4.3 LlamaIndex

LlamaIndex 以数据和检索增强应用为核心，也提供 Agent 与 Workflow 能力。

在 [LlamaIndex - Agents](https://docs.llamaindex.ai/en/stable/module_guides/deploying/agents/) 中，将 Agent 定义为使用 LLM、memory 和 tools 来处理外部用户输入的系统，并区分 agent 与更宽泛的 agentic 系统。

LlamaIndex 的优势在于把 RAG、query engine、工具和 Agent 结合起来。它支持 FunctionAgent、AgentWorkflow、多 Agent 系统、QueryEngineTool、FunctionTool 等抽象，也可以用 Workflows 自定义事件驱动流程。

LlamaIndex 一般适用于以下场景：

- 以文档、知识库、结构化数据和 RAG 为核心的 Agent。
- 希望把检索器、query engine 和工具统一暴露给 Agent。
- 需要从预置 Agent 逐步下沉到自定义 Workflow 的系统。

### 4.4 AutoGen

AutoGen 是 Microsoft 维护的多 Agent 应用框架。

[AutoGen AgentChat](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/index.html) 是其高层 API，构建在 `autogen-core` 之上，面向多 Agent 应用，提供 preset agents、teams、group chat、GraphFlow、memory 和 logging 等能力。

在 [AutoGen - Agents](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/agents.html) 中，Agent 具有 name、description、run、run_stream 等接口；AssistantAgent 使用语言模型并可以使用工具，Agent 被设计为有状态组件。

适合场景：

- 研究或构建多 Agent 协作系统。
- 需要团队、群聊、角色分工和 Agent 间交互。
- 需要从高层 AgentChat 逐步进入更底层 event-driven 核心。

### 4.5 CrewAI

CrewAI 面向多 Agent 团队和复杂工作流。

[CrewAI](https://docs.crewai.com/en/introduction) 将其架构分为 Flows 和 Crews：
- Flows 提供结构化、事件驱动的流程、状态和控制；
- Crews 是由多个 Agent 组成的协作单元，用于完成 Flow 委派的复杂任务。

在 [CrewAI - Agents](https://docs.crewai.com/en/concepts/agents) 中，Agent 是能够执行特定任务、基于角色和目标做决策、使用工具、协作、维护记忆并在允许时委派任务的自治单元。

适合场景：

- 希望用"角色、任务、Crew、Flow"组织多 Agent 自动化。
- 需要在结构化流程中嵌入一组协作 Agent。
- 团队更偏好高层业务流程抽象，而不是从底层状态图开始。

### 4.6 框架选择原则

选择 Agent 框架时，不应只看是否"功能多"。更重要的是根据当前业务场景、任务形态和工程约束来考量：

| 需求 | 更应关注 |
| :---: | --- |
| 快速接入模型和工具 | 模型接口、tool calling、结构化输出 |
| 长任务和可恢复执行 | checkpoint、durable execution、状态管理 |
| 多 Agent 分工 | handoff、team、crew、agent-as-tool、上下文隔离 |
| RAG 和数据应用 | query engine、retriever、document pipeline |
| 高风险工具 | guardrails、权限、审批、审计、回滚 |
| 线上调试 | tracing、日志、指标、评估集成 |

框架只能提供基础设施，真正决定 Agent 质量的仍然是任务定义、工具设计、状态建模、上下文管理、评估和风险控制。

---

## 小结

Agent 是由 LLM 驱动的自主任务执行系统。它通过目标、上下文、工具、状态和反馈循环等，把模型的语言生成能力扩展为多步骤任务执行能力。

理解 Agent 时，应把握几个要点：

- Agent 是系统，不只是模型。
- 工具调用是 Agent 行动能力的基础。
- 状态、记忆和上下文管理决定长任务能否稳定执行。
- 规划、执行和验证需要同时设计。
- Guardrails、权限、沙箱、审批和可观测性是生产 Agent 的必要条件。
- Agent 框架应按任务形态和场景选择，而不是按流行度选择。

对工程实践而言，Agent 的核心问题是"让模型在明确目标、受控工具、可恢复状态和可验证标准下完成任务"。
