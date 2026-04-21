---
title: LangChain
sidebar_position: 1
tags: [LangChain, LangGraph, LangSmith, Agent开发, RAG]
description: LangChain v1 是面向 LLM 应用与 Agent 开发的开源框架，提供模型接口、工具调用、RAG、记忆、结构化输出和可观测性能力。
last_update:
  date: 2026-04-20
---


# LangChain

LangChain 是一个用于构建 LLM 应用和 Agent 的开源框架。按照当前官方 v1 文档的定位，它的核心目标不是把所有复杂工作流都藏进一个黑盒，而是提供一组相对统一的抽象：模型接口、消息格式、工具调用、Agent、RAG、记忆、结构化输出、人工审核和可观测性。开发者可以先用很少的代码搭出一个能调用工具的 Agent，再在需要时逐步加入检索、状态、审批、追踪和更复杂的图编排。

需要注意的是，LangChain v1 已经明显收敛到“面向生产 Agent 的基础层”。旧版本里很多传统 chain、loader、memory 等能力被迁移到 `langchain-classic`；新版本推荐用 `create_agent` 构建 Agent，用 LangGraph 承接更复杂的可控工作流，用 LangSmith 做调试、追踪和评估。[citation:LangChain v1 release notes](https://docs.langchain.com/oss/python/releases/langchain-v1)

---

## 一、它解决什么问题

LLM 本身只会根据上下文生成文本。真实应用通常还需要：

1. 接入不同模型供应商，例如 OpenAI、Anthropic、Google、xAI、本地模型等。
2. 调用外部工具，例如搜索、数据库、文件系统、业务 API、代码执行器。
3. 检索私有知识库，解决模型知识过期和上下文有限的问题。
4. 让模型输出稳定结构，例如 JSON、Pydantic 对象、表单字段、数据库记录。
5. 让长对话或长任务可以保存状态、恢复执行、人工审核。
6. 调试 Agent 为什么调用某个工具、在哪一步失败、token 和成本消耗如何。

LangChain 就是在这些能力之间提供“胶水层”和“标准接口”。它不是一个模型，也不是一个向量数据库，而是把模型、工具、数据和执行流程组织起来的应用框架。

[citation:LangChain overview](https://docs.langchain.com/oss/python/langchain/overview)

---

## 二、核心特点

### 1. 标准模型接口

不同模型厂商的 API、消息格式、工具调用格式和返回结构不完全一致。LangChain 提供统一的模型调用接口，让应用代码尽量少绑定某一家供应商。这样在测试不同模型、做 fallback 或迁移模型时，业务层不需要大改。[citation:LangChain overview](https://docs.langchain.com/oss/python/langchain/overview)

### 2. `create_agent` 是 v1 的核心入口

当前官方文档推荐用 `create_agent` 构建 Agent。它能把模型、工具、系统提示词、结构化输出、状态和中间件组合起来。简单 Agent 可以十行以内启动；复杂场景可以继续加入 middleware、memory、human-in-the-loop 等能力。[citation:LangChain v1 release notes](https://docs.langchain.com/oss/python/releases/langchain-v1)

### 3. 工具调用是 Agent 的行动接口

工具本质上是有清晰输入输出的函数。模型根据上下文决定是否调用工具，以及传入什么参数。工具可以连接搜索、数据库、CRM、订单系统、文件系统、代码执行环境等。[citation:LangChain Tools](https://docs.langchain.com/oss/python/langchain/tools)

### 4. RAG 支持简单模式和 Agentic 模式

LangChain 把 RAG 拆成两类常见架构：

| 架构 | 思路 | 适合场景 |
| --- | --- | --- |
| 2-Step RAG | 先检索，再生成 | FAQ、文档问答、延迟要求稳定的场景 |
| Agentic RAG | Agent 自己决定何时检索、检索什么、是否继续查 | 研究助手、多工具问答、问题边界不清晰的场景 |
| Hybrid | 检索、生成、校验组合 | 高质量要求的垂直领域问答 |

这个划分很实用：简单问答不必上复杂 Agent；问题开放、需要多次查证时，再用 Agentic RAG。[citation:LangChain Retrieval](https://docs.langchain.com/oss/python/langchain/retrieval)

### 5. 结构化输出降低工程脆弱性

在生产系统里，直接解析自然语言很脆弱。LangChain 支持通过 `response_format` 让 Agent 返回 Pydantic、dataclass、TypedDict 或 JSON Schema 等结构化结果。若模型供应商支持原生结构化输出，LangChain 会优先使用 ProviderStrategy；否则可退回到工具调用策略。[citation:LangChain Structured Output](https://docs.langchain.com/oss/python/langchain/structured-output)

### 6. 基于 LangGraph 获得持久执行和状态能力

LangChain Agent 底层建立在 LangGraph 之上，因此可以获得 durable execution、streaming、human-in-the-loop、persistence 等能力。简单 Agent 不需要直接写 LangGraph；当流程需要精确状态机、分支、循环、并行和恢复时，再下沉到 LangGraph。[citation:LangChain overview](https://docs.langchain.com/oss/python/langchain/overview)

### 7. LangSmith 用于调试和观测

Agent 的问题往往不是“报错”这么简单，而是模型在某一步做了错误判断。LangSmith 提供执行轨迹、状态变化、运行指标和调试视图，适合排查工具调用、提示词、检索质量和多步 Agent 行为。[citation:LangChain overview](https://docs.langchain.com/oss/python/langchain/overview)

---

## 三、核心思想

### 把 LLM 当成推理引擎，而不是整个系统

LangChain 的设计默认 LLM 只是系统中的一个组件。真实应用还需要工具、状态、检索、权限、审批、日志和 UI。不要把所有业务逻辑都塞进 prompt，而是把确定性的事情交给代码、数据库和工具，把不确定的理解、规划、改写、总结交给模型。

### 从简单 Agent 开始，逐步加复杂度

LangChain v1 的推荐路径很清楚：

1. 简单任务：直接用 `create_agent`。
2. 需要知识库：加入 RAG 或检索工具。
3. 需要稳定输出：加入结构化输出。
4. 需要长对话：加入 checkpointer 和 memory。
5. 需要人工审批：加入 Human-in-the-loop middleware。
6. 需要复杂流程控制：迁移到 LangGraph。

这比一开始就搭大型多 Agent 系统更稳。

### 用统一接口隔离模型变化

模型更新很快。LangChain 的一个重要价值是让应用层尽量不直接依赖某个模型 API 的细节。模型可以替换，工具和业务流程尽量保持稳定。

---

## 四、适用场景

| 场景 | 是否适合 LangChain | 原因 |
| --- | --- | --- |
| 企业知识库问答 | 适合 | RAG、retriever、结构化引用、LangSmith 调试都能用上 |
| 业务系统 Agent | 适合 | 工具调用、权限控制、人工审核、状态保存是核心需求 |
| 文档/表单/邮件自动化 | 适合 | 模型理解 + 工具执行 + 结构化输出组合自然 |
| 数据库/BI 助手 | 适合，但要谨慎 | 需要 SQL 工具、审批、只读权限和审计 |
| 复杂多步骤研究助手 | 适合 | Agentic RAG、工具调用、长任务追踪有价值 |
| 极低延迟单次模型调用 | 不一定适合 | 直接调用模型 SDK 更简单，框架抽象可能多余 |
| 需要强确定性流程的核心交易系统 | 部分适合 | LLM 只适合做辅助理解，关键写操作需要规则、审批和审计 |
| 复杂图状态机、多 Agent 编排 | 可用，但更建议直接用 LangGraph | LangChain Agent 是高层入口，LangGraph 更适合精细编排 |

---

## 五、与其它框架的简单对比

| 框架 | 更像什么 | 优点 | 取舍 |
| --- | --- | --- | --- |
| LangChain | LLM 应用与 Agent 开发框架 | 上手快、生态大、模型和工具集成多、RAG/结构化输出方便 | 抽象层较多，复杂生产系统需要理解底层执行 |
| LangGraph | Agent 状态机和运行时 | 可控、可恢复、适合复杂流程和长任务 | 需要自己设计图、状态和节点，学习成本更高 |
| LlamaIndex | 数据/RAG 应用框架 | 数据连接、索引、检索和知识库问答体验强 | 如果核心是工具执行和多步 Agent，LangChain/LangGraph 更直接 |
| Haystack | 搜索和 RAG pipeline 框架 | 检索 pipeline、企业搜索、可组合组件清晰 | Agent 生态和模型工具集成不如 LangChain 广 |
| CrewAI | 角色式多 Agent 框架 | 适合快速表达角色分工和任务协作 | 精细状态控制、生产可观测性需要额外设计 |
| AutoGen | 多 Agent 对话与协作框架 | 适合研究多 Agent 通信、协作和自动对话 | 业务工具、RAG 和生产链路通常要自行拼装 |

简单说：如果你要快速做 LLM 应用和 Agent，LangChain 是通用入口；如果你已经知道流程很复杂，直接考虑 LangGraph；如果主要是知识库和检索，LlamaIndex/Haystack 也值得比较。

---

## 六、典型例子

下面示例以 Python 版 LangChain v1 风格为主。代码侧重表达典型模式，真实项目需要补齐 API Key、错误处理、权限、日志和部署配置。

### 例 1：最小工具调用 Agent

```python
# pip install -U langchain "langchain[anthropic]"
from langchain.agents import create_agent


def get_weather(city: str) -> str:
    """Get weather for a given city."""
    return f"{city} 今天晴，适合出门。"


agent = create_agent(
    model="anthropic:claude-sonnet-4-6",
    tools=[get_weather],
    system_prompt="你是一个简洁的中文助手。",
)

result = agent.invoke({
    "messages": [
        {"role": "user", "content": "上海今天天气怎么样？"}
    ]
})

print(result["messages"][-1].content)
```

这个例子体现 LangChain Agent 的最小形态：模型负责判断是否调用工具，工具负责提供外部能力。[citation:LangChain overview](https://docs.langchain.com/oss/python/langchain/overview)

---

### 例 2：结构化信息抽取

```python
from pydantic import BaseModel, Field
from langchain.agents import create_agent


class ContactInfo(BaseModel):
    name: str = Field(description="联系人姓名")
    email: str = Field(description="邮箱")
    phone: str = Field(description="电话")


agent = create_agent(
    model="openai:gpt-5",
    response_format=ContactInfo,
    system_prompt="从用户文本中抽取联系人信息。",
)

result = agent.invoke({
    "messages": [
        {
            "role": "user",
            "content": "张三，邮箱 zhangsan@example.com，电话 13800000000"
        }
    ]
})

contact = result["structured_response"]
print(contact.name, contact.email, contact.phone)
```

适合表单填充、CRM 线索抽取、工单分类、发票字段解析等场景。相比让模型输出“看起来像 JSON 的文本”，结构化输出更适合进入业务系统。[citation:LangChain Structured Output](https://docs.langchain.com/oss/python/langchain/structured-output)

---

### 例 3：2-Step RAG 文档问答

```python
# 伪代码：表达结构，具体 loader/vectorstore 可按项目替换
from langchain.chat_models import init_chat_model


model = init_chat_model("openai:gpt-5-mini")
retriever = vector_store.as_retriever(search_kwargs={"k": 5})


def answer_with_docs(question: str) -> str:
    docs = retriever.invoke(question)
    context = "\n\n".join(doc.page_content for doc in docs)

    prompt = f"""
    你只能根据下面资料回答。
    如果资料不足，明确说不知道。

    资料：
    {context}

    问题：
    {question}
    """

    response = model.invoke(prompt)
    return response.content
```

这是最稳定、最容易控成本的 RAG 模式：每次先检索，再调用一次模型生成答案。适合 FAQ、产品文档、内部制度、帮助中心。[citation:LangChain Retrieval](https://docs.langchain.com/oss/python/langchain/retrieval)

---

### 例 4：Agentic RAG，把检索做成工具

```python
from langchain.agents import create_agent
from langchain.tools import tool


@tool
def search_docs(query: str) -> str:
    """Search internal documentation and return relevant snippets."""
    docs = retriever.invoke(query)
    return "\n\n".join(doc.page_content for doc in docs)


agent = create_agent(
    model="anthropic:claude-sonnet-4-6",
    tools=[search_docs],
    system_prompt="""
    你是内部知识库助手。
    当问题涉及公司制度、产品配置或 API 行为时，先调用 search_docs。
    回答时说明依据；资料不足时不要编造。
    """,
)

result = agent.invoke({
    "messages": [
        {"role": "user", "content": "我们产品的 SSO 怎么配置？如果失败怎么排查？"}
    ]
})
```

Agentic RAG 适合问题不确定、可能需要多次检索、需要边查边判断的场景。代价是延迟和成本不如 2-Step RAG 稳定。[citation:LangChain Retrieval](https://docs.langchain.com/oss/python/langchain/retrieval)

---

### 例 5：短期记忆，让同一会话可恢复

```python
from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver


agent = create_agent(
    model="openai:gpt-5-mini",
    tools=[],
    checkpointer=InMemorySaver(),
    system_prompt="你是一个能记住本轮对话上下文的助手。",
)

config = {
    "configurable": {
        "thread_id": "user-123-session-001"
    }
}

agent.invoke(
    {"messages": [{"role": "user", "content": "我叫小林，正在做 LangChain 文档。"}]},
    config=config,
)

result = agent.invoke(
    {"messages": [{"role": "user", "content": "我刚才说我在做什么？"}]},
    config=config,
)

print(result["messages"][-1].content)
```

短期记忆是 thread 级别的状态持久化。它适合同一会话内的连续任务，但长对话仍需要摘要、裁剪或长期记忆策略，不能无限堆上下文。[citation:LangChain Short-term Memory](https://docs.langchain.com/oss/python/langchain/short-term-memory)

---

### 例 6：高风险工具加人工审批

```python
from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware
from langgraph.checkpoint.memory import InMemorySaver


def send_email(to: str, subject: str, body: str) -> str:
    """Send an email."""
    # 真实项目里这里会调用邮件 API
    return "sent"


def query_customer_db(sql: str) -> str:
    """Query customer database."""
    return "query result"


agent = create_agent(
    model="openai:gpt-5",
    tools=[send_email, query_customer_db],
    checkpointer=InMemorySaver(),
    middleware=[
        HumanInTheLoopMiddleware(
            interrupt_on={
                "send_email": True,
                "query_customer_db": {"allowed_decisions": ["approve", "reject"]},
            }
        )
    ],
    system_prompt="你是企业运营助手。涉及外发邮件或客户数据库时必须等待审批。",
)
```

Human-in-the-loop 适合写文件、发邮件、执行 SQL、提交订单、修改配置等高风险动作。LangChain 会在工具执行前暂停，把状态保存下来，等待人工 approve、edit 或 reject。[citation:LangChain Human-in-the-loop](https://docs.langchain.com/oss/python/langchain/human-in-the-loop)

---

## 七、实践建议

1. **不要一开始就做多 Agent。** 先用单 Agent + 明确工具跑通，再看是否需要拆分。
2. **工具描述要具体。** 模型是否正确调用工具，很大程度取决于工具名、参数和 docstring。
3. **RAG 先做 2-Step。** 如果简单检索能解决，就不要引入 Agentic RAG 的不确定性。
4. **结构化输出优先于正则解析。** 业务系统需要稳定字段时，用 schema 约束输出。
5. **高风险动作必须审批。** 写操作、外部发送、数据库修改、付款和权限变更都应加人工或规则保护。
6. **用 LangSmith 看轨迹。** Agent 失败时，单看最终答案不够，要看每一步 prompt、工具调用和状态。
7. **复杂工作流下沉到 LangGraph。** 如果你开始手写大量状态分支，说明已经超过 LangChain Agent 的舒适区。

---

## 八、总结

LangChain v1 的定位可以概括为：**快速构建可接工具、可接模型、可接知识库的生产型 Agent 应用基础框架**。

它最适合那些既需要 LLM 推理，又需要真实系统能力的应用：知识库助手、客服 Agent、数据分析助手、自动化办公、业务流程助手、研发工具和内部运营系统。它的价值不在于“让模型更聪明”，而在于把模型放进一个能接工具、接数据、可观测、可审批、可演进的工程结构里。

如果需求只是一次简单模型调用，直接用模型 SDK 就够；如果需求已经是复杂状态机、多 Agent 编排、长任务恢复和严格流程控制，则应尽早学习并使用 LangGraph。

---

## Sources

- [LangChain overview](https://docs.langchain.com/oss/python/langchain/overview) - LangChain v1 的定位、核心收益、LangGraph 和 LangSmith 关系。
- [What's new in LangChain v1](https://docs.langchain.com/oss/python/releases/langchain-v1) - `create_agent`、标准内容块、命名空间简化和 v1 迁移方向。
- [LangChain Tools](https://docs.langchain.com/oss/python/langchain/tools) - 工具定义、工具执行、状态注入和工具节点说明。
- [LangChain Retrieval](https://docs.langchain.com/oss/python/langchain/retrieval) - RAG、2-Step RAG、Agentic RAG 和 Hybrid RAG 架构说明。
- [LangChain Structured Output](https://docs.langchain.com/oss/python/langchain/structured-output) - 结构化输出、ProviderStrategy、ToolStrategy 和 schema 支持。
- [LangChain Short-term Memory](https://docs.langchain.com/oss/python/langchain/short-term-memory) - thread 级短期记忆、checkpointer 和状态管理。
- [LangChain Human-in-the-loop](https://docs.langchain.com/oss/python/langchain/human-in-the-loop) - 人工审批中间件、approve/edit/reject 和恢复执行机制。
