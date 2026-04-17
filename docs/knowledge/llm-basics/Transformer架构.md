---
title: Transformer 架构
sidebar_position: 6
tags: [Transformer, Self-Attention, LLM架构, 注意力机制]
description: Transformer 架构的核心组件、计算流程和大语言模型中的常见变体。
last_update:
  date: 2026-04-17
---

# Transformer 架构

Transformer 是现代大语言模型的基础架构。它最核心的思想是用注意力机制（Attention）建模 token 之间的关系，让模型在处理一个 token 时，可以根据上下文中其他 token 的信息动态决定“应该关注哪里”。

相比 RNN 这类逐步处理序列的结构，Transformer 更适合并行训练，也更容易扩展到大模型规模。今天常见的 GPT、LLaMA、Qwen、DeepSeek、Mistral 等大语言模型，主体结构都来自 Transformer，尤其是 Decoder-only Transformer。

## 1. 整体结构

一个 Transformer 模型通常由多层 Transformer Block 堆叠而成。

简化结构如下：

```text
输入 token ids
  -> Token Embedding
  -> Position Encoding / RoPE
  -> Transformer Block × N
      -> Attention
      -> Feed Forward Network
      -> Residual Connection
      -> LayerNorm / RMSNorm
  -> LM Head
  -> 下一个 token 概率分布
```

在 LLM 中，每一层 Transformer Block 通常包含两个主要子模块：

- Self-Attention：负责让 token 之间交换上下文信息。
- Feed Forward Network：负责对每个 token 的表示做非线性变换和特征提炼。

残差连接和归一化层则负责稳定训练，让深层模型更容易优化。

## 2. Token Embedding

模型输入首先会被 tokenizer 转换成 token ids。Token Embedding 层会把每个 token id 映射成一个向量。

例如：

```text
[15496, 11, 995]
  -> embedding lookup
  -> [x_1, x_2, x_3]
```

如果模型 hidden size 是 4096，那么每个 token 会被表示成一个 4096 维向量。

Embedding 可以理解为模型对 token 的初始语义表示。后续每一层 Transformer Block 都会不断更新这些向量，让它们逐渐包含更丰富的上下文信息。

## 3. 位置编码

Self-Attention 本身不天然知道 token 的顺序。对它来说，一组 token 更像是一个集合。因此 Transformer 需要引入位置信息。

常见位置编码方式包括：

| 方法 | 特点 | 常见场景 |
| --- | --- | --- |
| Absolute Position Embedding | 为每个位置学习一个位置向量 | 早期 Transformer、BERT |
| Sinusoidal Position Encoding | 使用固定正弦余弦函数编码位置 | 原始 Transformer |
| RoPE | 通过旋转位置编码把相对位置信息注入 Q/K | 现代 LLM 常见 |
| ALiBi | 通过 attention bias 表示距离惩罚 | 长上下文模型中出现过 |

现代 Decoder-only LLM 中，RoPE（Rotary Position Embedding）非常常见。它不是简单把位置向量加到 token embedding 上，而是在 Attention 计算中对 Query 和 Key 做旋转变换，让模型更自然地感知相对位置。

## 4. Self-Attention

Self-Attention 是 Transformer 的核心。

它的作用是：对序列中的每个 token，计算它应该关注其他 token 的程度，然后聚合相关信息。

### 4.1 Q、K、V

Attention 会把每个 token 的 hidden state 投影成三个向量：

- Query（Q）：当前 token 想查询什么信息。
- Key（K）：每个 token 能提供什么索引信息。
- Value（V）：每个 token 真正提供的内容信息。

在代码实现里，常见模块名是：

- `q_proj`：把 hidden state 投影成 Query。
- `k_proj`：把 hidden state 投影成 Key。
- `v_proj`：把 hidden state 投影成 Value。
- `o_proj`：把 attention 输出再投影回模型 hidden size。

### 4.2 Attention 公式

标准 Scaled Dot-Product Attention 可以写作：

$$
\operatorname{Attention}(Q, K, V)
= \operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

其中：

- $QK^\top$ 表示 Query 和 Key 的相似度。
- $\sqrt{d_k}$ 用来缩放分数，避免维度较大时 logits 过大。
- `softmax` 把相似度变成注意力权重。
- 最后乘以 $V$，得到聚合后的上下文表示。

直观理解：

```text
当前 token 的 Query
  和所有 token 的 Key 做匹配
  -> 得到注意力权重
  -> 按权重加权汇总所有 Value
```

## 5. Masked Self-Attention

大语言模型通常是自回归模型：根据前面的 token 预测下一个 token。

训练和推理时，当前位置不能看到未来 token。否则模型会作弊，直接利用答案后面的信息。

因此 Decoder-only LLM 会使用 causal mask：

```text
第 1 个 token 只能看第 1 个 token
第 2 个 token 可以看第 1-2 个 token
第 3 个 token 可以看第 1-3 个 token
...
```

对应的注意力矩阵大致是下三角结构：

```text
可见: 1
可见: 1 1
可见: 1 1 1
可见: 1 1 1 1
```

这就是为什么 GPT 类模型可以一个 token 一个 token 地生成文本。

## 6. Multi-Head Attention

单个 Attention 头只能从一个表示空间里计算关系。Multi-Head Attention 会把 hidden state 分成多个头，让不同头学习不同类型的关系。

例如：

- 有些头关注语法依赖。
- 有些头关注指代关系。
- 有些头关注局部上下文。
- 有些头关注远距离信息。
- 有些头关注格式和结构边界。

多头注意力的简化流程：

```text
hidden states
  -> q_proj / k_proj / v_proj
  -> split into heads
  -> 每个 head 独立做 attention
  -> concat
  -> o_proj
```

`o_proj` 的作用是把多个 attention head 的结果重新整合回模型的 hidden size。

## 7. MHA、MQA 与 GQA

为了降低推理显存和 KV Cache 成本，现代 LLM 常使用不同的 Attention 变体。

| 结构 | 含义 | 特点 |
| --- | --- | --- |
| MHA | Multi-Head Attention，每个 Q head 都有自己的 K/V head | 表达能力强，但 KV Cache 最大 |
| MQA | Multi-Query Attention，多个 Q head 共享一组 K/V head | KV Cache 小，推理更省显存 |
| GQA | Grouped-Query Attention，多组 Q head 共享一组 K/V head | 在效果和推理成本之间折中 |

GQA 是很多现代 LLM 的常见选择。它减少了 Key/Value head 数量，从而降低长上下文和高并发场景下的 KV Cache 显存占用。

## 8. Feed Forward Network

Attention 负责 token 之间的信息交互，Feed Forward Network（FFN）负责对每个 token 的表示做非线性变换。

在很多 LLM 中，FFN 通常是一个门控 MLP，例如 SwiGLU / GEGLU 结构。常见模块名包括：

- `gate_proj`：生成门控分支，控制哪些信息通过。
- `up_proj`：把 hidden size 扩展到更高维度。
- `down_proj`：把扩展后的表示投影回 hidden size。

简化形式可以理解为：

```text
x
  -> gate_proj + 激活函数
  -> up_proj
  -> 两个分支相乘
  -> down_proj
```

如果写成近似公式：

$$
\operatorname{FFN}(x) = W_{down}\left(\sigma(W_{gate}x) \odot W_{up}x\right)
$$

其中：

- $W_{gate}$ 对应 `gate_proj`。
- $W_{up}$ 对应 `up_proj`。
- $W_{down}$ 对应 `down_proj`。
- $\sigma$ 是激活函数，例如 SiLU。
- $\odot$ 表示逐元素相乘。

FFN 通常占据模型参数的大部分。很多 LoRA 微调也会选择把 `gate_proj`、`up_proj`、`down_proj` 加入 `target_modules`。

## 9. 残差连接

Transformer Block 中会大量使用残差连接（Residual Connection）。

简化形式：

```text
x = x + Attention(x)
x = x + FFN(x)
```

残差连接的作用：

- 保留原始信息。
- 缓解深层网络训练困难。
- 让梯度更容易反向传播。
- 支持模型逐层增量更新表示。

没有残差连接，几十层甚至上百层的 Transformer 会更难稳定训练。

## 10. LayerNorm 与 RMSNorm

归一化层用于稳定隐藏状态的数值分布。

常见方式包括：

| 方法 | 特点 |
| --- | --- |
| LayerNorm | 对 hidden dimension 做均值和方差归一化 |
| RMSNorm | 只使用均方根做归一化，不减均值，计算更简单 |

现代 LLM 中 RMSNorm 很常见，例如 LLaMA 系列使用 RMSNorm。

归一化位置也有区别：

- Post-LN：先做子层，再做归一化。
- Pre-LN：先归一化，再做子层。

现代大模型多采用 Pre-LN 或类似结构，因为深层训练更稳定。

## 11. Decoder-only、Encoder-only 与 Encoder-Decoder

Transformer 有三种常见架构形态。

| 架构 | 代表模型 | 适合任务 |
| --- | --- | --- |
| Encoder-only | BERT、RoBERTa | 分类、检索、理解、Embedding |
| Decoder-only | GPT、LLaMA、Qwen、DeepSeek | 文本生成、对话、代码、Agent |
| Encoder-Decoder | T5、BART | 翻译、摘要、文本到文本转换 |

### 11.1 Encoder-only

Encoder-only 模型通常使用双向 Attention。每个 token 可以看到左右两侧上下文，因此适合理解任务。

它通常不直接用于自回归生成。

### 11.2 Decoder-only

Decoder-only 模型使用 causal mask，只能看当前位置之前的信息。

现代 LLM 多数是 Decoder-only，因为它非常适合下一个 token 预测：

```text
P(x_t | x_1, x_2, ..., x_{t-1})
```

训练时，模型学习根据前文预测下一个 token；推理时，模型把刚生成的 token 追加到上下文里，再预测下一个 token。

### 11.3 Encoder-Decoder

Encoder-Decoder 模型包含两个部分：

- Encoder 读取输入。
- Decoder 根据 Encoder 输出生成目标序列。

这种结构在翻译、摘要等 seq2seq 任务中很常见，但当前通用聊天 LLM 主流是 Decoder-only。

## 12. LM Head 与下一个 Token 预测

Transformer 最后一层输出每个位置的 hidden state。LM Head 会把 hidden state 映射到词表大小的 logits。

如果词表大小是 150,000，模型会为下一个 token 输出 150,000 个分数。

简化流程：

```text
last hidden state
  -> LM Head
  -> logits
  -> softmax
  -> token probability
  -> sampling / greedy decode
  -> next token
```

训练时常用交叉熵损失：

$$
\mathcal{L} = -\sum_t \log P(x_t \mid x_{<t})
$$

这就是“预测下一个 token”的基础目标。

## 13. 训练与推理的差异

训练和推理都使用同一个 Transformer，但计算方式有明显差异。

| 阶段 | 特点 |
| --- | --- |
| 训练 | 一次输入完整序列，使用 causal mask 并行计算所有位置的 loss |
| Prefill | 推理时先处理完整输入 prompt，生成 KV Cache |
| Decode | 每次生成一个或一小批 token，复用 KV Cache |

KV Cache 保存历史 token 的 Key 和 Value。这样生成新 token 时，不需要重复计算所有历史 token 的 K/V。

这也是为什么推理服务里要关注：

- 输入长度影响 prefill 成本。
- 输出长度影响 decode 成本。
- 上下文长度和并发影响 KV Cache 显存。

## 14. Transformer Block 中常见模块名

阅读模型代码、LoRA 配置或权重文件时，经常会看到这些模块名。

| 模块名 | 所属部分 | 作用 |
| --- | --- | --- |
| `embed_tokens` | Embedding | token id 到向量的映射 |
| `q_proj` | Attention | 生成 Query |
| `k_proj` | Attention | 生成 Key |
| `v_proj` | Attention | 生成 Value |
| `o_proj` | Attention | 整合多头 attention 输出 |
| `gate_proj` | FFN | 门控分支，控制信息流 |
| `up_proj` | FFN | 升维，扩大中间表示维度 |
| `down_proj` | FFN | 降维，回到 hidden size |
| `input_layernorm` | Norm | Attention 前归一化 |
| `post_attention_layernorm` | Norm | FFN 前归一化 |
| `lm_head` | 输出层 | hidden state 到词表 logits |

这些名称在 LLaMA、Qwen、Mistral 等模型中很常见，但不同模型实现可能略有差异。

## 15. 为什么 Transformer 适合大模型

Transformer 适合扩展到大模型，主要有几个原因：

- 并行训练能力强：训练时可以并行处理序列中的多个位置。
- 表达能力强：Attention 能直接建模长距离 token 关系。
- 结构模块化：层数、hidden size、head 数、FFN 维度都可以扩展。
- 工程生态成熟：GPU kernel、推理框架、分布式训练和量化方法都围绕 Transformer 深度优化。
- 适合自监督训练：只需要大量文本就能做下一个 token 预测。

它的主要代价是 Attention 计算和 KV Cache 会随序列长度增长。长上下文、高并发推理和超大模型部署都需要额外的工程优化。

## 16. 常见误区

### 16.1 Attention 就等于解释能力

Attention 权重可以提供一些参考，但不能简单等同于“模型为什么这么回答”。模型内部表示经过多层变换，最终行为不只由某一层 attention 权重决定。

### 16.2 Transformer 天然理解顺序

Self-Attention 本身不包含顺序信息，必须依赖位置编码或相关机制。

### 16.3 参数都在 Attention 里

不是。LLM 中 FFN 通常占据大量参数，甚至是参数量主要来源之一。

### 16.4 上下文越长效果一定越好

长上下文提供更多信息，但也增加计算、显存和注意力干扰。实际应用中仍然需要检索、摘要、裁剪和上下文管理。

## 17. 总结

Transformer 的核心是：用 Self-Attention 在 token 之间传递信息，用 FFN 对每个 token 的表示做非线性加工，再通过残差连接和归一化稳定深层训练。

对现代 LLM 来说，最常见的是 Decoder-only Transformer。它通过 causal mask 做下一个 token 预测，训练时并行学习，推理时依靠 KV Cache 逐步生成。

理解 Transformer 架构时，建议抓住四条主线：

- token 如何变成向量。
- Self-Attention 如何让 token 读取上下文。
- FFN 如何加工每个 token 的表示。
- 推理时 KV Cache 如何让自回归生成更高效。

掌握这些之后，再看 LoRA 的 `target_modules`、量化的权重量化对象、推理服务的 KV Cache、上下文长度和模型性能指标，会更容易串起来。
