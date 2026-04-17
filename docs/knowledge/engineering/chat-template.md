---
title: Chat Template
sidebar_position: 3
tags: [Chat Template, 模型部署]
description: 给模型拼提示词的格式模板。
last_update:
  date: 2026-04-17
---

# Chat Template

## 1. 为什么需要 Chat Template

我们调用 Chat API 时，传入的通常是结构化数据：

```json
{
  "messages": [
    { "role": "system", "content": "你是一个严谨的助手。" },
    { "role": "user", "content": "解释一下 KV Cache。" }
  ]
}
```

但大模型本身并不直接理解 `messages` 这个 JSON 字段。模型真正接收的是一段 token 序列，也可以先理解成一段被拼好的文本 Prompt。

问题在于：不同模型训练时使用的对话格式不一样。

比如同样的 system / user / assistant 三种角色，模型可能需要被渲染成类似下面这样的格式：

```text
<|im_start|>system
你是一个严谨的助手。<|im_end|>
<|im_start|>user
解释一下 KV Cache。<|im_end|>
<|im_start|>assistant
```

也可能是另一种格式：

```text
[INST] <<SYS>>
你是一个严谨的助手。
<</SYS>>

解释一下 KV Cache。 [/INST]
```

`chat_template` 的作用就是解决这个转换问题：

```text
结构化请求 messages / tools / 参数
        ↓
chat_template render
        ↓
模型真正看到的 rendered prompt
```

所以，`chat_template` 不是“装饰格式”，而是模型对话协议的一部分。  
它决定角色怎么标记、消息怎么分隔、工具怎么声明、图片占位符怎么插入、是否打开思考模式等。

## 2. 核心概念

`chat_template` 是把结构化对话消息转换成模型可读 Prompt 的模板。

接口层常见输入包括：

- `messages`
- `tools`
- `system prompt`
- `response_format`
- `extra_body.chat_template_kwargs`

渲染后的结果常见叫法包括：

- `rendered prompt`
- `formatted prompt`
- `formatted chat prompt`

## 3. 从请求到 Rendered Prompt 的例子

下面用一个带图片和思考模式参数的请求举例。

### 3.1 请求体

```json
{
  "model": "example-vl-model",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/receipt.png"
          }
        },
        {
          "type": "text",
          "text": "识别图中的文字和格式，给我完整地列出来"
        }
      ]
    }
  ],
  "extra_body": {
    "chat_template_kwargs": {
      "enable_thinking": true
    }
  }
}
```

### 3.2 渲染时发生了什么

`chat_template` 会把这些结构化字段转换成模型训练时熟悉的格式。例如：

- `role: user` 被转换成用户角色标记。
- 图片输入被转换成模型使用的视觉占位符，例如 `<|vision_start|><|image_pad|><|vision_end|>`。
- 文本内容被拼到用户消息中。
- `enable_thinking: true` 影响 assistant 开头，让模型进入思考输出格式。

### 3.3 可能的 Rendered Prompt

注意：下面只是示意，具体格式取决于模型和推理框架。

```text
<|im_start|>user
<|vision_start|><|image_pad|><|vision_end|>识别图中的文字和格式，给我完整地列出来<|im_end|>
<|im_start|>assistant
<think>
```

如果关闭思考模式：

```json
{
  "extra_body": {
    "chat_template_kwargs": {
      "enable_thinking": false
    }
  }
}
```

对应的 rendered prompt 可能变成：

```text
<|im_start|>user
<|vision_start|><|image_pad|><|vision_end|>识别图中的文字和格式，给我完整地列出来<|im_end|>
<|im_start|>assistant
<think>

</think>
```

这里的关键点是：`enable_thinking` 不一定会作为普通文本出现在用户消息里，它可能是在模板渲染阶段改变 assistant 开头的格式。

## 4. `chat_template_kwargs` 的作用

`chat_template_kwargs` 可以影响模板渲染方式。

例如不同的参数可以决定：

- 是否启用思考模式。
- 工具调用内容如何组织。
- `system` / `user` / `assistant` 消息如何拼接。
- 多模态内容如何展开。
- 结构化输出约束如何写入 Prompt。

所以它影响的是“模型最终看到的 Prompt 长什么样”，而不只是普通请求参数。

## 5. 在 vLLM 中的应用

以 vLLM 的 OpenAI-compatible server 为例，`chat_template` 会在服务端把 Chat API 请求转换成推理引擎需要的 prompt。

大致流程是：

```text
vllm serve 启动
  ├── 从 tokenizer 读取 chat_template
  ├── 或通过 --chat-template 显式指定模板
  └── 且通过 --default-chat-template-kwargs 设置模板默认参数

        ↓

客户端请求 /v1/chat/completions
  ├── messages
  ├── tools
  └── extra_body.chat_template_kwargs

        ↓

vLLM 合并模板参数
  ├── 先应用服务端 default_chat_template_kwargs
  └── 再应用请求级 chat_template_kwargs，请求级优先生效

        ↓

渲染 rendered prompt

        ↓

送入模型推理
```

### 5.1 `--chat-template`

`--chat-template` 用来指定服务端使用的 chat template。

它可以是：

- chat template 文件路径。
- 单行形式的模板字符串。

示例：

```bash
vllm serve Qwen/Qwen3-8B \
  --chat-template ./qwen3-chat-template.jinja
```

常见使用场景：

- tokenizer 里没有自带 `chat_template`。
- 想用自己修正过的模板。
- 同一个模型在某个推理框架里默认模板不符合预期。
- 需要明确控制 tool、thinking、多模态占位符等渲染方式。

注意：如果模型 tokenizer 没有定义 `chat_template`，而你又没有通过 `--chat-template` 指定模板，Chat API 请求可能无法被正确处理。

### 5.2 `--default-chat-template-kwargs`

`--default-chat-template-kwargs` 用来给 chat template renderer 传服务端默认参数。

它适合配置“所有请求默认都应该这样渲染”的行为。例如对某些 reasoning model，默认关闭或开启 thinking mode：

```bash
vllm serve Qwen/Qwen3-8B \
  --reasoning-parser qwen3 \
  --default-chat-template-kwargs '{"enable_thinking": false}'
```

这表示：如果请求里没有额外指定 `chat_template_kwargs`，服务端默认用 `enable_thinking: false` 去渲染 chat template。

请求级参数可以覆盖服务端默认值。例如服务端默认关闭 thinking：

```bash
vllm serve Qwen/Qwen3-8B \
  --reasoning-parser qwen3 \
  --default-chat-template-kwargs '{"enable_thinking": false}'
```

某次请求临时打开 thinking：

```json
{
  "model": "Qwen/Qwen3-8B",
  "messages": [
    {
      "role": "user",
      "content": "认真推理一下这个问题。"
    }
  ],
  "extra_body": {
    "chat_template_kwargs": {
      "enable_thinking": true
    }
  }
}
```

最终合并逻辑可以理解为：

```text
最终 chat_template_kwargs
= 服务端 --default-chat-template-kwargs
  + 请求级 chat_template_kwargs

如果同名字段冲突，请求级 chat_template_kwargs 优先。
```

### 5.3 `--chat-template` 和 `--default-chat-template-kwargs` 的区别

| 参数 | 解决的问题 | 例子 |
| --- | --- | --- |
| `--chat-template` | 用哪个模板渲染 | 使用 `./qwen3-chat-template.jinja` |
| `--default-chat-template-kwargs` | 给模板传什么默认变量 | 默认 `{"enable_thinking": false}` |

可以这样理解：

```text
--chat-template 决定“模板长什么样”
--default-chat-template-kwargs 决定“渲染模板时默认传哪些变量”
```

### 5.4 vLLM 中的实际注意事项

- 如果只是想调整 thinking mode 这类模板变量，优先考虑 `--default-chat-template-kwargs`，不要急着改模板文件。
- 如果模型缺少 chat template，或者默认模板确实不对，再使用 `--chat-template` 指定模板。
- 请求级 `chat_template_kwargs` 会覆盖服务端默认值，适合做单次请求的特殊控制。
- 不要让客户端随意传入自定义 `chat_template`，除非明确启用了并理解 `--trust-request-chat-template` 的风险。
- 多模态模型还要注意 `--chat-template-content-format`，因为消息 content 可能按字符串或 OpenAI 风格的 list-of-dicts 渲染。

参考：

- vLLM CLI serve 文档：https://docs.vllm.ai/en/latest/cli/serve/
- vLLM reasoning outputs 文档：https://docs.vllm.ai/en/stable/features/reasoning_outputs.html

## 6. 实际使用时要注意什么

### 6.1 不同模型的模板不能随便混用

不同模型训练时使用的对话格式可能不同。同一组 `messages`，用不同 `chat_template` 渲染出来的 Prompt 可能完全不一样。

如果模板和模型不匹配，常见问题包括：

- 模型不遵循 system prompt。
- 多轮对话角色混乱。
- 工具调用格式异常。
- 输出里出现奇怪的特殊 token。
- 思考模式开启或关闭不符合预期。

### 6.2 排查问题时要看最终 Prompt

如果模型输出异常，不要只看请求里的 `messages`。更应该确认最终渲染出来的 Prompt。

重点检查：

- system prompt 是否真的被写入。
- user / assistant 角色是否正确闭合。
- 工具定义是否按模型要求插入。
- 图片、音频等多模态内容是否变成正确占位符。
- `enable_thinking`、`tools`、`response_format` 等参数是否影响了渲染结果。

### 6.3 工具调用依赖模板格式

工具调用不是只把 `tools` 字段传进去就结束了。很多模型需要在 Prompt 里看到特定的工具声明格式，才能按预期生成工具调用。

因此，工具调用异常时，要同时检查：

- API 请求里的 `tools` 是否正确。
- `chat_template` 是否支持工具声明。
- 模型本身是否按这种工具格式训练过。
- 推理框架是否对工具调用做了额外封装。

### 6.4 自定义模板要谨慎

自定义 `chat_template` 前，先确认模型官方推荐格式。除非明确知道模型训练时的对话格式，否则不要随意修改：

- 角色标记。
- 消息结束符。
- assistant 开头。
- 工具调用格式。
- 多模态占位符。
- 思考模式标签。

### 6.5 记录实验时要记录模板信息

做模型评测或问题复现时，建议同时记录：

- 模型名称和版本。
- 推理框架和版本。
- 原始 `messages`。
- 关键 `chat_template_kwargs`。
- 最终 rendered prompt，如果框架支持导出。

这样后面复盘时，才能判断问题来自模型本身、请求参数，还是模板渲染。
