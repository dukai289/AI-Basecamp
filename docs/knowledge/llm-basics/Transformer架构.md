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

**Transformer 用注意力机制替代了传统序列模型顺序处理的主路径，让模型可以更直接地建模长距离依赖，也更容易并行训练和大规模扩展。**

---

## 1. Transformer 架构的由来

在 Transformer 之前，序列建模主要依赖 RNN、LSTM、GRU，后来也出现过很多基于 CNN 的序列模型。

它们并不是不能做机器翻译、文本理解或生成，而是在规模继续变大时，暴露出了几个明显问题：

- **顺序计算导致无法并行**：RNN 类模型天然按时间步递推，前一个状态没算完，后一个状态就没法算，训练并行性差。
- **长距离依赖难建模**：理论上可以记很长，但远距离 token 之间需要经过很多步状态传递，导致信息衰减，并且优化也更困难。

2017 年的论文 [*Attention Is All You Need*](https://arxiv.org/abs/1706.03762) 提出了著名的 Transformer。

相比于之前的模型，Transformer 最关键的转变是：**让每个位置直接通过 attention 去读取其他位置的信息**。

这一步的意义非常大。它把序列建模从"沿时间传播信息"改成了"在一层内直接建立位置之间的联系"。 

注意力机制的加入既让模型更容易捕捉远距离依赖，也天然适合大规模并行训练。

---

## 2. 经典 Transformer 的结构

经典 Transformer 是一个 **Encoder-Decoder** 架构。  

它最初是为机器翻译这类 sequence-to-sequence 任务设计的：输入一段序列，输出另一段序列。

### 2.1 整体结构
整体结构可以用下面这张图来表示：

```text
输入序列
  -> Embedding + Position
  -> Encoder Stack × N
       -> Self-Attention
       -> Feed Forward
       -> Residual & Norm
  -> 输入序列表示

目标端序列
  -> Embedding + Position
  -> Decoder Stack × N
       -> Masked Self-Attention
       -> Cross-Attention
       -> Feed Forward
       -> Residual & Norm
  -> 输出层
  -> softmax(logits)
```

Transformer 的主干其实就三件事：

- 用 **attention** 让 token 和 token 之间交换信息。
- 用 **FFN** 对每个位置的表示做进一步非线性加工。
- 用 **残差连接 + 归一化** 稳定深层训练。

### 2.2 Encoder 与 Decoder

经典 Transformer 由两部分组成：

- **Encoder**：负责读输入。
- **Decoder**：负责边看输入、边生成输出。

它们的分工可以概括如下：

| 部分 | 主要作用 | 典型子模块 |
| --- | --- | --- |
| Encoder | 把输入序列编码成上下文化表示 | Self-Attention、FFN、Residual、Norm |
| Decoder | 根据目标端前缀和输入表示，逐步生成输出 | Masked Self-Attention、Cross-Attention、FFN、Residual、Norm |

其中最重要的差别有两个：
- Encoder 中每个位置都可以看见输入序列的其他位置，因此它更偏"理解"。它的输出是一整段输入的上下文化表示。
- Decoder 有两层注意力逻辑：
  - 第一层是 **Masked Self-Attention**：只能看当前位置左边，不能偷看位置右边。
  - 第二层是 **Cross-Attention**：读取 Encoder 输出，把输入序列的信息引入生成过程。

这也是为什么经典 Transformer 很适合翻译：Encoder 先把源语言句子读懂，Decoder 再结合已经生成的目标语言片段，一步步写出结果。

后来很多模型都从这个经典结构里做删减或变形：

- **BERT** 主要保留 Encoder。
- **GPT / LLaMA / Qwen** 主要保留 Decoder。
- **T5 / BART** 更接近经典 Encoder-Decoder 思路。

### 2.3 详细架构图
 
论文中也给出了详细的架构图
<img src="/img/Transformer架构.png" style={{ width: '80%' }} />

---

## 3. Transformer 中的计算

### 3.1 计算主线
从输入到输出，经典 Transformer 的计算主线可以简化成下面这样：

```text
token ids
  -> embedding + position
  -> 多层 Block
    -> Attention
    -> Residual Add
    -> Norm
    -> FFN
  -> hidden states
  -> logits
  -> softmax & 解码
```

不同实现会有 Pre-LN、Post-LN、RMSNorm 等差异，但本质没有变：  
- Attention 负责"让位置之间互相读取信息"；
- FFN 负责"对每个位置各自做更强的特征变换"；
- Residual Add 和 Norm 负责"让深层网络还能稳定学下去"。

在经典 Encoder-Decoder 结构里，信息流可以再细化为：

```text
1. 输入序列进入 Encoder，先形成一组上下文化表示。
2. Decoder 读取目标端前缀，先做 masked self-attention。
3. Decoder 再通过 cross-attention 去读取 Encoder 的输出。
4. 多层堆叠后，Decoder 每个位置的 hidden state 被送到输出层，预测对应位置的目标 token。
```

这套设计有一个很重要的特点：  

**每一层都在重复做“信息聚合 + 特征加工”**。模型不是靠某一层突然理解整句话，而是靠很多层逐步把局部信息整合成更高级的表示。

### 3.2 Encoder 和 Decoder 的交互

Encoder 和 Decoder 的交互发生在 Decoder 里的 **Cross-Attention**。

Encoder 先把完整输入序列处理成一组上下文化表示。可以把它理解成：输入中的每个 token 都已经带上了整段输入的上下文信息。

Decoder 在生成每个位置时，会先通过 masked self-attention 读取已经有的输出前缀，然后通过 cross-attention 去读取 Encoder 的输出。这里的 Q、K、V 来源不同：

```text
Query：来自 Decoder 当前层的 hidden states
Key：  来自 Encoder 的输出表示
Value：来自 Encoder 的输出表示
```

也就是说，Decoder 不是直接复制 Encoder 的结果，而是用自己的当前生成状态作为 query，去判断输入序列中哪些位置更重要，再把相关信息读回来。

用一句话概括：

```text
Encoder 负责把输入读成可被检索的表示；
Decoder 负责根据已生成前缀，按需读取这些表示，再预测下一个 token。
```

这也是 Encoder-Decoder 架构适合"输入一段内容，输出另一段内容"的原因：输入信息由 Encoder 稳定保存，生成过程由 Decoder 逐步控制，两者通过 cross-attention 连接。

### 3.3 训练与推理

#### 3.3.1 训练

经典 Encoder-Decoder Transformer 的训练过程不是"先生成一个 token，再把它接回去继续生成"，而是把输入序列和目标端序列同时组织成一个监督学习问题。

为了贴近生成式任务，这里用"根据已有开头补全文本"举例：prompt 是 Encoder 输入，补全文本是 Decoder 要学习生成的目标端序列。

```text
prompt： 今天 天气 很 好 ， 我 想
补全文本：    去 公园 走 一 走

同一次前向传播中，Decoder 并行计算这些位置：
位置 1：可见 <BOS>               -> 预测 去
位置 2：可见 <BOS> 去            -> 预测 公园
位置 3：可见 <BOS> 去 公园       -> 预测 走
位置 4：可见 <BOS> 去 公园 走    -> 预测 一
位置 5：可见 <BOS> 去 公园 走 一 -> 预测 走
```

这里涉及三个信息处理步骤：

1. **Encoder 读取完整 prompt**  
   已有文本片段一次性进入 Encoder。Encoder 端不做右移也不需要 Causal Mask；prompt 中的每个位置都可以看见其他输入位置，形成一组上下文化表示。

2. **Decoder 读取右移后的标准补全文本**  
   右移发生在 Decoder 端，而不是 Encoder 端。训练时会把标准补全文本右移一位作为 Decoder 输入，也就是常说的 teacher forcing。这样儿也可以在同一次前向传播中并行计算 logits 和 loss。

3. **Decoder 的 attention 处理**  
   Decoder 的 masked self-attention 会使用 causal mask。比如在预测“走”时，它可以看见 `<BOS>`、`去`、`公园`，但不能看见后面的“一”“走”。
   随后，Decoder 再通过 cross-attention 读取 Encoder 输出，从 prompt 中取信息。

因此，经典 Transformer 训练时的信息路径可以概括为：

```text
prompt -> Encoder -> prompt 表示
右移后的标准补全文本 -> Decoder masked self-attention
                    -> Decoder cross-attention 读取 prompt 表示
                    -> 并行预测补全文本中每个位置的 token
```

训练阶段的关键点是：**补全文本仍然遵守从左到右的因果约束，但由于标准补全文本已经给定，补全文本中的所有位置可以在同一次前向传播中并行计算损失。**

#### 3.3.2 推理

推理时，补全文本并不存在，模型只能自己一步步生成。  
这时 Encoder 和 Decoder 的工作方式要分开看：

1. **Encoder 通常只运行一次**  
   输入 prompt 已经确定。Encoder 先把整段 prompt 编码成上下文化表示，这部分结果后续会被 Decoder 反复读取。这里和训练阶段一样，prompt 本身不需要右移。

2. **Decoder 自回归生成补全文本**  
   Decoder 从 `<BOS>` 开始，每一步根据已经生成的补全前缀预测下一个 token。

```text
prompt -> Encoder -> prompt 表示

Decoder 输入：<BOS>             -> 预测：去
Decoder 输入：<BOS> 去          -> 预测：公园
Decoder 输入：<BOS> 去 公园     -> 预测：走
```

每一步里，Decoder 都会做两类注意力：

- **masked self-attention**：读取已经生成的补全前缀。
- **cross-attention**：读取 Encoder 输出的 prompt 表示。

所以推理阶段的信息路径可以概括为：

```text
prompt 表示固定不变
已生成补全前缀 -> Decoder masked self-attention
              -> Decoder cross-attention 读取 prompt 表示
              -> 预测下一个补全 token
              -> 把新 token 接回补全前缀
```

#### 3.3.3 训练与推理的区别

训练和推理时 Encoder 端都可以一次性处理完整 prompt，不同的是 Decoder 端如何获得补全前缀，以及这些位置能不能并行计算。

| 阶段 | Encoder 端 | Decoder 端 | 计算特点 |
| --- | --- | --- | --- |
| 训练 | 一次性读取完整 prompt | 读取右移后的标准补全文本，并用 mask 对注意力进行约束 | 补全文本各位置可并行计算 |
| 推理 | 一次性读取完整 prompt | 从 `<BOS>` 开始自回归生成，每步只能使用已生成前缀 | 输出依赖前一步，必须按顺序自回归生成 |

换句话说，经典 Transformer 在训练和推理时使用同一套参数和注意力结构，但 Decoder 端信息的来源不同：

- 训练时：补全前缀来自真实语料，所以可以**并行计算**。
- 推理时：补全前缀来自模型自己已经生成的内容，所以必须**自回归**地一步步生成。

---

## 4. 为什么有效

### 4.1 表达能力强

在 RNN 等序列模型里，远距离信息要沿时间步逐步传递。

而 Transformer 的模型表达能力更强：

- attention 让位置之间直接交换信息，路径短使得长距离依赖更容易建模。
- 多头机制同时捕捉不同关系，例如局部搭配、句法关系、指代关系和远距离语义关系。
- FFN 和多层堆叠能逐步形成更抽象的表示。

### 4.2 训练效率高

Transformer 训练效率高，关键在于它不需要像 RNN 那样必须沿时间步递推：
- 训练时完整序列一次性进入模型，各位置的 logits 和 loss 可在同一次前向传播中并行计算，与 GPU 的大规模矩阵乘法很匹配。
- Block 结构规则、重复度高，方便做批处理、分布式训练、算子优化和模型扩展。

---

## 5. Transformer 与现代 LLM 的关系

今天提到大语言模型时，很多人所谓的"Transformer 架构"通常指的是 **经典 Transformer 的变体**，而不是 2017 年论文里的原样实现。

现代 LLM 大多采用 **Decoder-only Transformer**，也就是：

- 保留 Transformer 的 block 设计
- 保留 masked self-attention
- 保留 FFN、Residual Add、Norm 等主干
- 去掉经典 Encoder-Decoder 里的 Encoder 和 cross-attention 主体

这样做的原因很现实：  
对于通用文本生成，`next token prediction` 本身就和 Decoder-only 结构非常匹配，训练和推理链路都更直接。

因此可以把关系理解成：

| 架构 | 代表思路 | 常见用途 |
| --- | --- | --- |
| Encoder-only | 保留"读懂输入"的部分 | 表示学习、分类、检索、Embedding |
| Encoder-Decoder | 保留经典完整结构 | 翻译、摘要、文本转换 |
| Decoder-only | 保留"自回归生成"的部分 | 聊天、写作、代码、通用 LLM |

从学术上看，Transformer 先解决了"序列怎么更有效地建模"；从产业上看，Decoder-only Transformer 又把这套结构推到了超大规模。  

所以现代 LLM 并不是取代了 Transformer，而是把 Transformer 的某一种变体扩展到了极致。
