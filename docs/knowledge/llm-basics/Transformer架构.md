---
title: Transformer 架构
sidebar_position: 6
tags: [Transformer, Self-Attention, LLM架构, 注意力机制]
description: Transformer 的来历、经典 Encoder-Decoder 结构、核心计算流程，以及它为什么在学术和工程上都有效。
last_update:
  date: 2026-04-23
---

# Transformer 架构

:::tip[内容]
1. Transformer 的发展脉络。
2. 经典 Transformer 架构的设计。
3. Transformer 为什么有效。
:::

Transformer 是现代大语言模型最核心的基础架构。  

前几篇文章已经讲过 token、embedding、注意力机制、位置编码 等概念，这一篇的重点是围绕 Transformer 回答三个更大的问题：

- Transformer 是怎么来的？
- 经典 Transformer 架构到底长什么样？
- 它为什么能在学术上有效、在工程上也跑得起来？

一句话概括：

**Transformer 用注意力机制替代了传统序列模型里“按顺序一步步处理”的主路径，让模型可以更直接地建模长距离依赖，也更容易并行训练和大规模扩展。**

---

## 1. 这个架构是怎么来的

在 Transformer 之前，序列建模主要依赖 RNN、LSTM、GRU，后来也出现过很多基于 CNN 的序列模型。它们并不是不能做机器翻译、文本理解或生成，而是在规模继续变大时，暴露出了几个明显问题：

- **顺序计算太重**：RNN 类模型天然按时间步递推，前一个状态没算完，后一个状态就没法算，训练并行性差。
- **长距离依赖难建模**：理论上可以记很长，实际上信息在长链路上传递容易衰减。
- **路径太长**：如果句首和句尾的两个词要发生强交互，RNN 需要通过很多步状态传递，优化难度更高。

2017 年的论文 *Attention Is All You Need* 提出了 Transformer。它最关键的转变是：

- 不再把“循环”当成序列建模的主干。
- 改成让每个位置直接通过 attention 去读取其他位置的信息。

这一步的意义非常大。它把序列建模从“沿时间传播信息”改成了“在一层内直接建立位置之间的联系”。  
对于机器翻译来说，这更容易捕捉远距离依赖；对于后来的大模型来说，这种结构又天然适合大规模并行训练。

---

## 2. Transformer 到底是什么

经典 Transformer 是一个 **Encoder-Decoder** 架构。  
它最初是为机器翻译这类 sequence-to-sequence 任务设计的：输入一段序列，输出另一段序列。

可以先把整体结构记成下面这张图：

```text
输入 tokens
  -> Embedding + Position
  -> Encoder Stack × N
       -> Self-Attention
       -> Feed Forward
  -> 得到输入序列表示

目标端 tokens
  -> Embedding + Position
  -> Decoder Stack × N
       -> Masked Self-Attention
       -> Cross-Attention
       -> Feed Forward
  -> LM Head
  -> 输出下一个 token 的概率
```

如果只抓核心，Transformer 的主干其实就三件事：

- 用 **attention** 让 token 和 token 之间交换信息。
- 用 **FFN** 对每个位置的表示做进一步非线性加工。
- 用 **残差连接 + 归一化** 稳定深层训练。

前几篇已经讲过 embedding、token、MHA 的定义，所以这里可以把它们理解成“进入网络前的表示准备”和“层内的信息交互机制”。本篇更关心这些零件如何组装成一个完整架构。

---

## 3. 经典 Transformer 的结构

经典 Transformer 由两部分组成：

- **Encoder**：负责读输入。
- **Decoder**：负责边看输入、边生成输出。

它们的分工可以概括如下：

| 部分 | 主要作用 | 典型子模块 |
| --- | --- | --- |
| Encoder | 把输入序列编码成上下文化表示 | Self-Attention、FFN、Residual、Norm |
| Decoder | 根据已生成内容和输入表示，逐步生成输出 | Masked Self-Attention、Cross-Attention、FFN、Residual、Norm |

其中最经典的差别有两个：

### Encoder

Encoder 中的每个位置都可以看见输入序列中的其他位置，因此它更偏“理解”。  
它的输出不是最终文字，而是一整段输入的上下文化表示。

### Decoder

Decoder 有两层注意力逻辑：

- 第一层是 **Masked Self-Attention**：只能看当前位置左边，不能偷看未来 token。
- 第二层是 **Cross-Attention**：去读取 Encoder 输出，把输入序列的信息引入生成过程。

这也是为什么经典 Transformer 很适合翻译：

- Encoder 先把源语言句子读懂。
- Decoder 再结合已经生成的目标语言片段，一步步写出结果。

如果画成更紧凑的结构图，可以理解成：

```text
源文本 -> Encoder -> 编码表示
目标文本前缀 -> Decoder -> 下一个 token
```

后来很多模型都从这个经典结构里做删减或变形：

- **BERT** 主要保留 Encoder。
- **GPT / LLaMA / Qwen** 主要保留 Decoder。
- **T5 / BART** 更接近经典 Encoder-Decoder 思路。

所以“Transformer”不是只指一种模型家族名词，更像是一套通用积木；不同模型是在这套积木上做不同取舍。

---

## 4. 信息是怎么在 Transformer 里流动的

从输入到输出，经典 Transformer 的计算主线可以简化成下面这样：

```text
token ids
  -> embedding + position
  -> 多层 attention / FFN 堆叠
  -> 得到上下文化 hidden states
  -> 线性映射到词表 logits
  -> softmax / 解码
```

如果只看一个典型 block，它内部通常是这样的节奏：

```text
x
  -> Attention
  -> Residual Add
  -> Norm
  -> FFN
  -> Residual Add
  -> Norm
```

不同实现会有 Pre-LN、Post-LN、RMSNorm 等差异，但本质没有变：  
attention 负责“让位置之间互相读取信息”，FFN 负责“对每个位置各自做更强的特征变换”，残差和归一化负责“让深层网络还能稳定学下去”。

在经典 Encoder-Decoder 结构里，信息流可以再细化为：

1. 输入序列进入 Encoder，先形成一组上下文化表示。
2. Decoder 读取目标端前缀，先做 masked self-attention。
3. Decoder 再通过 cross-attention 去读取 Encoder 的输出。
4. 多层堆叠后，最后一个位置的 hidden state 被送到输出层，预测下一个 token。

这套设计有一个很重要的特点：  
**每一层都在重复做“信息聚合 + 特征加工”**。模型不是靠某一层突然理解整句话，而是靠很多层逐步把局部信息整合成更高级的表示。

---

## 5. 为什么它在学术上有效

Transformer 在学术上有效，不只是因为“用了 attention”，更重要的是它把几个关键问题同时解决得比较好。

### 1. 更容易建模长距离依赖

在 RNN 中，远距离信息通常要经过很多步状态传递；在 Transformer 中，一个位置可以直接对另一个远处位置分配高权重。  
这让远距离依赖的路径更短，优化更容易。

### 2. 表达能力更强

不同注意力头可以学习不同关系模式，例如：

- 词法和句法关系
- 指代关系
- 局部邻近关系
- 远距离结构依赖

它不需要人为规定“该记住什么规则”，而是通过训练自己学会哪些位置值得关注。

### 3. 分层表示更自然

Transformer 的每一层都在更新 token 表示。  
浅层更偏局部模式，深层更偏抽象语义和任务相关表示。这种逐层抽象的方式，与深度学习擅长的“表示学习”路径高度一致。

### 4. 训练目标很通用

无论是 encoder-only、decoder-only，还是 encoder-decoder，Transformer 都可以和自监督目标很好结合：

- masked language modeling
- next token prediction
- seq2seq generation

这使它不仅能做单一任务，还能在统一框架下迁移到理解、生成、翻译、摘要、代码、Agent 等多种任务。

换句话说，Transformer 的学术价值不只是“效果更好”，而是它提供了一种更通用的序列表示学习框架。

---

## 6. 为什么它在工程上也有效

很多架构论文在学术上成立，但工程上不一定能扩展。Transformer 特别强的一点是：**它不只好学，而且好堆。**

### 1. 并行训练友好

训练阶段，序列中很多位置可以并行计算，这和 GPU / TPU 的大规模矩阵计算非常匹配。  
相比 RNN 的逐步递推，这一点在大数据、大模型训练时优势巨大。

### 2. 结构规则、模块化强

Transformer block 高度重复，几乎就是同一种层不断堆叠。  
这对工程实现很友好：

- 更容易做分布式切分
- 更容易写高性能 kernel
- 更容易做量化、蒸馏、LoRA、并行推理

### 3. 扩展规律比较稳定

层数、hidden size、head 数、FFN 维度、上下文长度，都可以较系统地扩展。  
这使得 Transformer 很适合做“规模化实验”，也更容易形成 scaling law 这类经验规律。

### 4. 生态围绕它高度成熟

今天主流训练框架、推理引擎、显卡 kernel 优化、KV Cache 管理、量化方法、MoE 路由甚至 Agent 框架，很多都优先围绕 Transformer 家族构建。  
一旦整个生态都在为一种架构优化，它的工程优势会被进一步放大。

当然，Transformer 也有明显代价：

- attention 计算会随序列长度变重
- 长上下文推理时 KV Cache 占用大
- 真正部署到高并发场景时，显存和带宽压力都很明显

所以它不是“没有缺点”，而是“优点足够大，大到值得整个行业为它继续做优化”。

---

## 7. 经典 Transformer 与现代 LLM 的关系

今天讲大语言模型时，很多人说“Transformer 架构”，其实通常指的是 **经典 Transformer 的变体**，而不是 2017 年论文里的原样实现。

现代 LLM 大多采用 **Decoder-only Transformer**，也就是：

- 保留 Transformer 的 block 设计
- 保留 masked self-attention
- 保留 FFN、残差、归一化等主干
- 去掉经典 Encoder-Decoder 里的 Encoder 和 cross-attention 主体

这样做的原因很现实：  
对于通用文本生成，`next token prediction` 本身就和 Decoder-only 结构非常匹配，训练和推理链路都更直接。

因此可以把关系理解成：

| 架构 | 代表思路 | 常见用途 |
| --- | --- | --- |
| Encoder-only | 保留“读懂输入”的部分 | 表示学习、分类、检索、Embedding |
| Encoder-Decoder | 保留经典完整结构 | 翻译、摘要、文本转换 |
| Decoder-only | 保留“自回归生成”的部分 | 聊天、写作、代码、通用 LLM |

从历史上看，Transformer 先解决了“序列怎么更有效地建模”；从产业上看，Decoder-only Transformer 又把这套结构推到了超大规模。  
所以现代 LLM 并不是“取代了 Transformer”，而是把 Transformer 的某一种变体扩展到了极致。

最后可以把本篇收成一句话：

> 经典 Transformer 是一套用 attention 组织序列信息流的通用架构；现代大模型则是在这套架构上，沿着更适合大规模生成的方向持续演化出来的。
