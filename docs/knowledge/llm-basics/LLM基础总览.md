---
title: LLM 基础总览
sidebar_position: 1
tags: [LLM基础, 学习路线, 大语言模型]
description: 用一条主线串起 Token、Embedding、Attention、Transformer、训练、微调、量化和评估等 LLM 基础知识。
last_update:
  date: 2026-04-17
---

# LLM 基础总览

:::tip[目的]
为学习 LLM 基础知识建立全局视野。
:::

大语言模型从输入文本到输出回答，中间到底经历了什么？模型又是如何训练、对齐、压缩、部署和评估的？

简单地说：

```text
LLM = 把文本变成 token，把 token 变成向量，用 Transformer 反复加工上下文表示，最后预测下一个 token。
```

训练和工程化围绕这件事继续展开：

```text
预训练学通用能力
  -> 指令跟随 学会对话和做任务
  -> 微调、强化学习 让行为更贴近目标
  -> 蒸馏、量化 降低成本
  -> 评估、压测 判断能不能上线
```

## 1. 从文本到 Token

模型不能直接理解人类看到的文字。输入文本会先经过 tokenizer，变成一串 token ids。

例如：

```text
文本: 解释一下 KV Cache
  -> tokenizer
token ids: [若干整数]
```

这些整数不是普通编号，而是模型词表中的 token id。不同模型的 tokenizer 不同，同一句话切出来的 token 也可能不同。

这一层要理解三个问题：

- 文本会被切成 token。
- 模型真正处理的是 token id。
- token 数会影响上下文长度、计费、延迟和显存。

对应阅读：

- [Token 与概率](./Token与概率.md)
- [Tokenizer](../engineering/Tokenizer.md)

## 2. 从 Token 到向量

token id 本身没有语义。模型会通过 embedding 层，把 token id 映射成向量。

```text
token id
  -> embedding lookup
  -> token vector
```

向量是模型可以计算的表示。后续每一层 Transformer 都会更新这些向量，让它们逐渐包含上下文信息。

比如“苹果”这个 token，在不同句子里的表示会逐层变化：

```text
我吃了一个苹果      -> 水果
苹果发布了新手机    -> 公司
```

这就是上下文表示的意义：同一个 token 在不同上下文里可以获得不同语义。

对应阅读：

- [词向量与 Embedding](./词向量与Embedding.md)

## 3. 为什么需要注意力机制

语言理解经常需要跨距离关联。

```text
小明把书放进书包，因为它很重。
```

理解“它”时，需要回看“书”。注意力机制做的事情就是：当前 token 根据上下文动态决定应该关注哪些 token。

最短版本：

```text
Q 找 K，得到权重，汇总 V。
```

也就是：

- Query：当前 token 想找什么。
- Key：其他 token 提供什么索引。
- Value：其他 token 真正提供什么内容。

注意力机制让 token 不只是看相邻位置，而是可以直接读取上下文里相关的信息。

对应阅读：

- [注意力机制](./注意力机制.md)

## 4. 位置编码让模型知道顺序

Self-Attention 本身不天然知道 token 顺序。对它来说，一组 token 更像一个集合。

所以模型需要位置编码来区分：

```text
猫追狗
狗追猫
```

这两句话 token 相似，但顺序不同，含义完全不同。

现代 LLM 常见 RoPE 等位置编码方法。位置编码也和长上下文能力密切相关。

对应阅读：

- [位置编码](./位置编码.md)

## 5. Transformer 是主体结构

Transformer 是现代 LLM 的主体架构。一个 Decoder-only Transformer 大致是：

```text
token ids
  -> embedding
  -> position encoding
  -> Transformer Block × N
       -> Self-Attention
       -> FFN
       -> residual / norm
  -> LM Head
  -> next token logits
```

每一层 Transformer Block 主要做两件事：

- Attention：让 token 之间交换信息。
- FFN：对每个 token 的表示做非线性加工。

多层堆叠后，模型就能从浅层模式逐渐形成复杂语义、格式、推理和任务表示。

对应阅读：

- [Transformer 架构](./Transformer架构.md)

## 6. MoE 是扩展模型容量的一种方式

Dense Transformer 每个 token 都经过同一套 FFN 参数。MoE 模型会准备多个 expert，每个 token 只激活少数专家。

```text
token
  -> router
  -> top-k experts
  -> combine
```

MoE 的意义是：扩大模型总参数量，同时控制每个 token 的实际计算量。

但 MoE 也引入工程复杂度：

- router 路由。
- expert 负载均衡。
- expert parallel。
- all-to-all 通信。
- 量化和部署兼容性。

对应阅读：

- [MoE 架构](./MoE架构.md)

## 7. 模型如何生成文本

LLM 每一步输出的是词表上所有 token 的分数，也就是 logits。

```text
hidden state
  -> LM Head
  -> logits
  -> softmax
  -> token probability
```

然后模型根据解码策略选择下一个 token：

- greedy：选概率最高的 token。
- sampling：按概率随机采样。
- temperature：控制随机性。
- top_p / top_k：限制候选 token 范围。

生成一个回答，本质上就是不断重复：

```text
预测下一个 token
  -> 追加到上下文
  -> 再预测下一个 token
```

对应阅读：

- [生成与解码](./生成与解码.md)

## 8. 上下文窗口限制模型能看多少

模型不是无限记忆。它每次只能看到上下文窗口里的 token。

上下文窗口包含：

- system prompt。
- 用户问题。
- 历史对话。
- RAG 检索内容。
- 工具定义。
- 模型已经生成的内容。

如果超过窗口，就需要裁剪、摘要、检索或拒绝。

长上下文也会带来更高成本，尤其是 KV Cache 显存和 prefill 延迟。

对应阅读：

- [上下文窗口](./上下文窗口.md)
- [KV Cache](../engineering/KV-Cache.md)

## 9. 预训练让模型学会通用语言能力

预训练通常使用大规模文本做自监督学习。最常见目标是 next token prediction：

```text
给定前面的 token，预测下一个 token。
```

模型通过海量文本学习：

- 语言规律。
- 常识知识。
- 代码模式。
- 文档结构。
- 推理和格式模式。

预训练得到的模型通常叫 base model。它有通用能力，但不一定擅长听指令或聊天。

对应阅读：

- [预训练](./预训练.md)

## 10. 指令跟随让模型变成 Chat Model

Base Model 会续写文本，但不一定会按人类指令完成任务。

指令微调会用类似这样的数据训练：

```text
system: 你是一个严谨的助手
user: 总结这段文字
assistant: ...
```

这样模型学会：

- 理解任务。
- 区分 system / user / assistant。
- 按要求输出格式。
- 多轮对话。
- 拒答或遵循安全规范。

对应阅读：

- [指令跟随](./指令跟随.md)
- [Chat Template](../engineering/chat-template.md)

## 11. 微调让模型适配具体任务

微调用特定数据继续训练模型，让它更适合某个领域、任务或格式。

常见目标：

- 客服问答。
- 信息抽取。
- 代码生成。
- 法律 / 医疗 / 金融领域任务。
- 固定格式输出。

常见方式：

- 全量微调。
- LoRA。
- QLoRA。
- SFT。
- 偏好优化。

对应阅读：

- [微调](./微调.md)

## 12. 强化学习和偏好优化让模型更符合目标

SFT 主要是模仿标准答案。但很多任务没有唯一标准答案，只能判断哪个更好。

强化学习和偏好优化解决的是：

```text
怎样让模型更倾向于好回答，而不是差回答？
```

常见方法：

- RLHF。
- PPO。
- DPO。
- ORPO。
- KTO。
- GRPO。

它们常用于对齐、安全、风格优化和可验证推理任务。

对应阅读：

- [强化学习](./强化学习.md)

## 13. 蒸馏把大模型能力迁移到小模型

蒸馏的核心是：用强模型教弱模型。

```text
Teacher Model
  -> 生成 soft target / 高质量回答 / 推理轨迹
  -> Student Model 学习
```

蒸馏常用于：

- 降低推理成本。
- 训练专用小模型。
- 把大模型能力迁移到部署友好的模型。
- 配合量化形成低成本服务。

对应阅读：

- [蒸馏](./蒸馏.md)

## 14. 量化降低显存和部署成本

量化把高精度权重转换成低精度表示。

例如：

```text
FP16 -> INT8 / INT4 / NF4
```

它可以降低：

- 权重显存。
- 模型文件大小。
- 显存带宽压力。

但也可能影响：

- 数学能力。
- 代码能力。
- 长上下文稳定性。
- 格式输出准确率。

对应阅读：

- [量化](./量化.md)

## 15. 多模态模型把图像等信息接入 LLM

多模态模型通常在语言模型外接视觉 encoder、projector 或 adapter，让图片、视频、音频等信息转成模型能处理的表示。

简化结构：

```text
图片
  -> vision encoder
  -> projector
  -> visual tokens
  -> LLM
```

多模态模型要额外关注：

- 图片预处理。
- 视觉占位 token。
- processor 配置。
- OCR、图表理解和视觉幻觉。

对应阅读：

- [多模态模型](./多模态模型.md)

## 16. 幻觉是生成模型的天然风险

LLM 是按概率生成 token，不是默认连接事实数据库。

因此它可能生成：

- 编造事实。
- 编造引用。
- 错误日期。
- 错误实体。
- 看似合理但无依据的解释。

缓解幻觉常见方式：

- RAG。
- 引用和溯源。
- 工具调用。
- 拒答策略。
- 事实核查。
- 更严格的评估集。

对应阅读：

- [幻觉](./幻觉.md)

## 17. Loss 和 Perplexity 是训练视角的指标

训练时模型常用交叉熵损失衡量预测下一个 token 的好坏。

Perplexity 可以理解为模型对文本“不困惑”的程度。越低通常表示模型越能预测这段文本。

但要注意：

```text
低 loss / 低 perplexity 不等于业务好用。
```

聊天、工具调用、RAG、安全和格式输出仍然需要专项评估。

对应阅读：

- [困惑度与损失函数](./困惑度与损失函数.md)

## 18. 评估决定模型是否真的可用

模型质量不能只看公开榜单。

需要同时看：

- 通用 benchmark。
- 业务评估集。
- 人工评估。
- LLM-as-a-Judge。
- RAG 评估。
- 工具调用评估。
- 安全评估。
- 格式通过率。
- 长上下文表现。

评估的关键是：贴近真实任务、可复现、可回归。

对应阅读：

- [质量与评估](./质量与评估.md)

## 19. 性能决定模型能否上线

质量好不代表能上线。线上服务还要看性能和成本。

常见性能指标：

- TTFT。
- ITL。
- E2E latency。
- tokens/s。
- QPS。
- 并发。
- 显存占用。
- KV Cache 使用量。
- 错误率和超时率。

模型上线需要同时满足：

```text
质量达标 + 延迟可接受 + 成本可控 + 稳定可观测
```

对应阅读：

- [模型性能](./性能.md)

## 20. 推荐学习路径

建议按这个顺序学习：

1. Token 与概率：先理解模型到底在预测什么。
2. 词向量与 Embedding：理解 token 如何变成向量。
3. 注意力机制：理解上下文信息如何流动。
4. 位置编码：理解顺序信息如何进入模型。
5. Transformer 架构：理解模型主体结构。
6. MoE 架构：理解现代大模型如何扩大容量。
7. 生成与解码：理解回答是如何一个 token 一个 token 生成的。
8. 上下文窗口：理解模型能看多少、为什么长上下文贵。
9. 预训练：理解模型通用能力从哪里来。
10. 指令跟随：理解 base model 如何变成 chat model。
11. 微调：理解如何适配具体任务。
12. 强化学习：理解偏好对齐和推理训练。
13. 蒸馏：理解如何把强模型能力迁移到小模型。
14. 量化：理解如何降低部署成本。
15. 多模态模型：理解图像等输入如何接入 LLM。
16. 幻觉：理解生成模型的事实性风险。
17. 困惑度与损失函数：理解训练指标。
18. 质量与评估：理解如何判断模型好不好。
19. 模型性能：理解模型能不能稳定上线。

## 21. 总结

LLM 基础知识可以串成一条链：

```text
文本
  -> Token
  -> Embedding
  -> Attention / Transformer
  -> Next Token Probability
  -> 解码生成
  -> 训练与后训练
  -> 压缩与部署
  -> 评估与性能
```

如果只记住一件事，就是：大语言模型本质上是在上下文中预测下一个 token。所有架构、训练、对齐、压缩和工程优化，都是围绕“更好、更稳、更便宜地预测和生成 token”展开的。
