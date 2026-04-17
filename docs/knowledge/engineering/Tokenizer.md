---
title: Tokenizer
sidebar_position: 2
tags: [Tokenizer, 分词器, Token, special tokens, chat template]
description: 大模型工程化中 Tokenizer 的作用、文件组成、常见算法和部署排障。
last_update:
  date: 2026-04-17
---

# Tokenizer

Tokenizer 是把文本和 token id 相互转换的组件。大语言模型本身不直接处理“汉字、英文单词、标点符号”这些人类可读文本，而是处理一串整数 token id。

可以把推理流程简化为：

```text
原始文本
  -> tokenizer.encode
  -> token ids
  -> 模型推理
  -> output token ids
  -> tokenizer.decode
  -> 输出文本
```

在工程化场景里，Tokenizer 会影响：

- 上下文长度如何计算。
- 输入输出 token 数如何统计。
- 计费、限流和压测指标是否准确。
- 模型是否能正确理解特殊 token。
- Chat Template 渲染后的 prompt 是否符合训练格式。
- 模型迁移、量化、格式转换后行为是否一致。

很多模型问题看起来像“模型变笨了”，实际可能是 tokenizer、special tokens 或 chat template 不匹配。

## 1. Token 是什么

Token 是模型处理文本的基本单位。一个 token 不一定等于一个字、一个词或一个字符。

例如：

| 文本 | 可能的 token 切分 |
| --- | --- |
| `hello` | `hello` |
| `unbelievable` | `un` + `believable`，或更细的子词 |
| `模型量化` | `模型` + `量化`，或逐字 / 子词切分 |
| `2026-04-17` | `2026` + `-` + `04` + `-` + `17` |
| `😊` | 可能是一个 token，也可能被拆成多个 byte token |

不同模型使用不同 tokenizer，因此同一段文本在不同模型下的 token 数可能不同。

这会直接影响：

- 是否超过最大上下文长度。
- 同样一段文本的推理成本。
- 长文档切块大小。
- 压测中的 input tokens / output tokens 统计。

## 2. Tokenizer 的两个方向

Tokenizer 通常包含两个核心操作。

### 2.1 Encode

Encode 把文本转换成 token ids。

```text
"你好，世界"
  -> [108386, 3837, 99488]
```

这里的数字只是示意，真实 token id 取决于具体 tokenizer。

### 2.2 Decode

Decode 把 token ids 转回文本。

```text
[108386, 3837, 99488]
  -> "你好，世界"
```

Decode 不一定总是完全还原原始输入，原因包括：

- 空格归一化。
- Unicode 标准化。
- 特殊 token 是否跳过。
- byte fallback 的处理方式。
- 不同 tokenizer 对换行和前导空格的编码规则不同。

因此，在调试模型输入时，最好同时看原始文本、token ids 和 decode 后的文本。

## 3. 常见 Tokenizer 算法

### 3.1 BPE

BPE（Byte Pair Encoding）从字符或 byte 开始，不断合并高频片段，形成词表。

特点：

- GPT 系列和很多 LLM 常用。
- 对英文、代码和符号支持较好。
- 能把未知词拆成更小片段。

### 3.2 WordPiece

WordPiece 常见于 BERT 系列。它会把词拆成子词，常用 `##` 表示词内部片段。

例如：

```text
playing -> play + ##ing
```

特点：

- 适合 encoder 模型和传统 NLP 任务。
- BERT 生态中很常见。

### 3.3 SentencePiece

SentencePiece 把文本看成 Unicode 字符序列，不强依赖空格分词。它常见于 LLaMA、T5、Qwen 等模型生态。

特点：

- 对中文、日文等没有天然空格分词的语言更友好。
- 常用特殊符号表示空格，例如 `▁`。
- 可以基于 BPE 或 Unigram 模型。

### 3.4 Byte-level Tokenizer

Byte-level tokenizer 直接或间接基于 UTF-8 byte 工作。

特点：

- 几乎不会遇到真正的 OOV（out-of-vocabulary）问题。
- 对任意 Unicode、emoji、代码和特殊字符更稳。
- 某些字符可能被拆成多个 token，导致 token 数增加。

## 4. 词表与 Token ID

Tokenizer 有一个词表（vocab），把 token 字符串映射到整数 id。

简化理解：

```json
{
  "<|endoftext|>": 0,
  "hello": 15339,
  " world": 1917,
  "模型": 99821
}
```

模型的 embedding 矩阵会按 token id 查表。因此 token id 的含义必须和训练时一致。

如果换了 tokenizer，即使文本一样，token id 也可能不同。模型看到的输入就变了，输出质量会明显受影响。

这也是为什么基座模型、微调模型、LoRA adapter 和量化模型都应该使用匹配的 tokenizer。

## 5. Special Tokens

Special tokens 是有特殊语义的 token，不只是普通文本。

常见特殊 token 包括：

| Token | 常见含义 |
| --- | --- |
| BOS | 序列开始 |
| EOS | 序列结束 |
| PAD | padding 填充 |
| UNK | 未知 token |
| MASK | 掩码 token，常见于 BERT |
| system / user / assistant 标记 | 对话角色边界 |
| tool call 标记 | 工具调用开始、结束或参数区域 |
| image / audio / video 占位符 | 多模态输入位置 |
| thinking 标记 | 推理 / 思考内容边界 |

特殊 token 配错会造成很多问题：

- 模型不停生成，不知道何时停止。
- 输出里出现奇怪的 `<|im_end|>`、`</s>` 等标记。
- 多轮对话角色混乱。
- 工具调用 JSON 无法被解析。
- 多模态模型找不到图像占位符。
- padding 被当成有效输入。

部署时要确认 `bos_token_id`、`eos_token_id`、`pad_token_id` 和推理框架停止条件一致。

## 6. Tokenizer 文件组成

Hugging Face 模型目录中，tokenizer 相关文件通常包括：

| 文件 | 作用 |
| --- | --- |
| `tokenizer.json` | fast tokenizer 的完整定义，包含词表、合并规则、normalizer、pre-tokenizer 等 |
| `tokenizer.model` | SentencePiece 模型文件，部分模型使用 |
| `vocab.json` | BPE 词表 |
| `merges.txt` | BPE 合并规则 |
| `tokenizer_config.json` | tokenizer 配置，可能包含 `chat_template` |
| `special_tokens_map.json` | 特殊 token 映射 |
| `added_tokens.json` | 额外新增 token |

不同模型不一定都有这些文件。工程上不要凭文件名猜测，应以实际 tokenizer 加载结果为准。

## 7. Tokenizer 与 Chat Template

Tokenizer 负责把最终 prompt 转成 token ids；Chat Template 负责把结构化对话消息渲染成最终 prompt。

二者关系可以理解为：

```text
messages / tools / system prompt
  -> chat_template render
  -> rendered prompt
  -> tokenizer.encode
  -> token ids
  -> model
```

因此，Chat API 里传入的 `messages` 并不是模型真正看到的内容。模型真正看到的是 chat template 渲染后再 tokenize 的 token ids。

常见问题：

- tokenizer 没有自带 `chat_template`。
- 使用了其他模型的 chat template。
- system / user / assistant 角色标记和训练格式不一致。
- assistant 起始标记缺失，导致模型不知道该从哪里开始回答。
- tool schema 渲染方式和模型训练时不一致。

排查对话效果异常时，不要只看 `messages`，要看最终 rendered prompt。

## 8. 中文、英文和代码的 Token 数差异

不同语言和内容类型的 token 密度不同。

一般来说：

- 英文常按子词和空格片段切分。
- 中文可能按字、词或子词切分，取决于 tokenizer。
- 代码中的缩进、符号、换行会消耗不少 token。
- JSON、XML、Markdown 表格等结构化文本 token 数通常比肉眼预期更多。
- emoji、罕见 Unicode 字符可能被拆成多个 token。

这会影响上下文预算。例如同样是 1000 个字符，中文、英文、代码和 JSON 的 token 数可能差异很大。

做长文档切块时，不建议只按字符数切。更稳妥的方式是按目标模型 tokenizer 计算 token 数。

## 9. 上下文长度与截断

模型的最大上下文长度通常按 token 数计算，不按字符数计算。

完整请求占用的 token 包括：

- system prompt。
- 用户输入。
- 历史对话。
- tool definitions。
- 检索召回内容。
- 多模态占位 token。
- assistant 生成的输出 token。

如果超过上下文长度，推理框架可能会：

- 直接报错。
- 截断输入。
- 丢弃部分历史消息。
- 降低可生成 token 数。

工程上要明确区分：

| 概念 | 含义 |
| --- | --- |
| input tokens | 输入 prompt 占用 token |
| output tokens | 模型生成 token |
| context length | 输入和输出合计可用的最大 token 窗口 |
| max_new_tokens | 最多生成多少新 token |
| max_model_len | 推理服务允许的最大上下文长度 |

一个 32K 上下文模型，不代表每次都可以输入 32K token 后再生成很多内容。输入和输出通常共享同一个上下文窗口。

## 10. 计费、限流和压测

LLM 服务通常按 token 计费或限流。

常见指标包括：

- prompt tokens。
- completion tokens。
- total tokens。
- tokens/s。
- input token throughput。
- output token throughput。
- TTFT。
- ITL。

如果客户端和服务端使用的 tokenizer 不一致，token 统计会偏差。轻则成本估算不准，重则切块、限流、压测数据都不可信。

建议：

- 计费以服务端真实 usage 为准。
- 压测时显式指定和服务端一致的 tokenizer。
- 对 OpenAI-compatible 服务，确认返回的 `usage` 字段是否可信。
- 做 RAG 切块时，使用目标模型 tokenizer 计算长度。

## 11. 新增 Token 与 Resize Embedding

有时微调或多模态适配需要新增特殊 token。

例如：

- `<image>`
- `<tool_call>`
- `<think>`
- 业务专用占位符。

新增 token 后，模型 embedding 矩阵也需要扩展。训练代码里通常会调用类似 `resize_token_embeddings` 的操作。

如果只改 tokenizer，不扩展或训练新增 token 对应的 embedding，模型可能无法正确使用这些 token。

工程上要记录：

- 新增了哪些 token。
- 新增 token 的 id。
- 是否 resize embedding。
- 新增 token embedding 是否参与训练。
- 导出模型时 tokenizer 和权重是否一起保存。

## 12. 多模态 Tokenizer

多模态模型通常会把图片、视频、音频位置表示成特殊 token 或占位符。

例如：

```text
<|vision_start|><|image_pad|><|vision_end|>
```

这些 token 不一定代表真实图片内容。它们更像是告诉语言模型：“这里有视觉特征会被插入或对齐”。

多模态场景要同时检查：

- tokenizer 是否包含视觉占位 token。
- chat template 是否正确插入占位符。
- processor 是否把图片转成模型需要的视觉输入。
- 推理框架是否支持该模型的多模态输入格式。
- 图片数量限制和占位 token 数是否一致。

如果只迁移语言模型权重和普通 tokenizer，多模态能力通常无法正常工作。

## 13. 常见排障

### 13.1 输出里出现特殊 token

可能原因：

- decode 时没有跳过 special tokens。
- `eos_token_id` 没有设置正确。
- chat template 把控制 token 当成普通文本。
- 模型实际训练时会输出这些 token，但客户端没有后处理。

### 13.2 模型一直生成不停

可能原因：

- EOS token 配错。
- stop words 没有配置。
- 模型使用多个 EOS，但推理框架只设置了一个。
- chat template 缺少正确的 assistant / end 标记。

### 13.3 中文 token 数异常高

可能原因：

- 使用了不匹配的 tokenizer。
- 文本包含大量罕见符号、emoji 或乱码。
- Unicode 归一化不一致。
- 使用了 byte fallback，导致部分字符被拆成多个 token。

### 13.4 微调后模型表现异常

可能原因：

- 训练和推理使用的 tokenizer 不一致。
- 新增 token 没有正确保存。
- LoRA adapter 对应的基座模型 tokenizer 版本不同。
- 训练数据格式和 chat template 不一致。

### 13.5 RAG 切块后超长

可能原因：

- 按字符数切块，没有按 token 数切。
- 检索结果拼接时加入了大量模板、引用和元数据。
- system prompt、工具定义和历史对话占用了大量上下文。

## 14. 工程实践建议

### 14.1 始终把 tokenizer 当成模型资产

不要只管理权重文件。至少要把这些内容作为一个整体：

- 模型权重。
- `config.json`。
- tokenizer 文件。
- special tokens 配置。
- chat template。
- generation config。
- processor 配置。

### 14.2 迁移模型后做 token 对齐检查

模型格式转换、量化、合并 LoRA 后，建议固定几条样本检查：

- encode 后 token ids 是否一致。
- rendered prompt 是否一致。
- special tokens 是否一致。
- decode 后文本是否符合预期。
- 相同采样参数下输出是否大体一致。

### 14.3 切块和限流按 token 计算

文档切块、上下文裁剪、费用估算和限流策略都应该按 token 计算，而不是按字符数或字节数。

### 14.4 记录 tokenizer 版本

实验记录中建议保存：

- 模型名称和 revision。
- tokenizer 文件 hash 或 revision。
- chat template 内容。
- special token ids。
- 新增 token 列表。
- 推理框架版本。

这样才能复现“同一段输入为什么变成了不同 token”。

## 15. 总结

Tokenizer 是模型输入输出协议的一部分。它决定文本如何变成 token ids，也决定模型输出的 token ids 如何还原成文本。

在工程化中，Tokenizer 需要和模型权重、special tokens、chat template、processor 和推理框架一起管理。只换权重不换 tokenizer，或只换模板不检查 token id，都可能导致模型行为变化。

最实用的判断方式是：任何涉及模型迁移、量化、微调、压测、RAG 切块或多模态输入的问题，都要确认 tokenizer 是否和目标模型完全匹配。
