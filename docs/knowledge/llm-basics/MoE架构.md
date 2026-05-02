---
title: MoE 架构
sidebar_position: 7
tags: [MoE, Mixture of Experts, 稀疏模型, Expert Parallel]
description: MoE 架构的核心思想、专家路由、训练推理特点和大语言模型中的工程问题。
last_update:
  date: 2026-04-17
---

# MoE 架构

:::tip[内容]
1. MoE 架构的基本思想、计算。
2. 训练与推理中的 MoE，以及与 Dense 的区别。
:::

MoE（Mixture of Experts *混合专家*）是一种 **稀疏激活** 模型架构：模型内部放置多个专家模块，每个 token 只激活其中一部分专家参与计算。

在大语言模型中，MoE 可以在扩大模型总参数量的同时控制每个 token 实际参与计算的参数量。这样可以提高模型容量，但单 token 的计算成本不必与总参数量等比例增长。

常见 MoE 模型包括 Mixtral、DeepSeek-V2 / V3、Qwen-MoE、Grok 等。不同模型的实现细节不同，但核心问题基本都围绕四个概念展开：

- **Expert**：被路由选择的专家模块，通常是 FFN / MLP。
- **Router**：决定每个 token 使用哪些专家。
- **Sparse Activation**：每个 token 只激活部分专家。
- **Load Balance**：避免少数专家过载，保证训练和推理稳定。

---

## 1. 基本思想

### 1.1 从 Dense 到 MoE

传统 Transformer LLM 通常是 dense 模型。所谓 dense，是指每个 token 都会经过每一层中的主要参数。

简化表示：

```text
Dense Transformer Block
  token -> Attention -> FFN -> output
```

其中，FFN 对所有 token 使用同一组参数。

MoE 模型则会把部分 FFN 层替换成多个专家 FFN。每个 token 通过 router 选择少数几个专家参与计算。

```text
MoE Transformer Block
  token -> Attention -> Router -> Top-k Experts -> Combine -> output
```

二者的关键差异如下：

| 维度 | Dense 模型 | MoE 模型 |
| :---: | :---: | :---: |
| 参数使用 | 每个 token 使用同一组层参数 | 每个 token 只使用部分专家参数 |
| 总参数量 | 与每次计算量强相关 | 可以很大，但激活参数较少 |
| 推理计算 | 结构稳定，调度简单 | 需要路由、专家调度和结果合并 |
| 训练难度 | 相对成熟 | 需要处理路由、负载均衡和并行通信 |
| 工程复杂度 | 较低 | 较高 |

MoE 的目标不是让所有专家同时工作，而是让不同 token 动态选择更合适的专家。

### 1.2 MoE Block

在现代 LLM 中，MoE 通常替换 Transformer Block 中的 FFN 部分，而不是替换 Attention。

Dense Block 可以简化为：

```text
x
  -> Self-Attention
  -> Dense FFN
  -> output
```

MoE Block 可以简化为：

```text
x
  -> Self-Attention
  -> Router
  -> Expert FFN 1 / Expert FFN 2 / ...
  -> Combine
  -> output
```

Dense FFN 通常占据 Transformer 参数的大部分。把 FFN 扩展成多个专家，可以显著增加模型容量，同时保持 Attention、RoPE、RMSNorm、Residual 等主干结构相对稳定。

因此，MoE 不是 Transformer 的替代品，而是 Transformer FFN 部分的一种扩展方式。

### 1.3 总参数量与激活参数量

MoE 模型经常同时标注 **总参数量** 和 **激活参数量**。

例如：

```text
总参数量: 100B
每 token 激活参数量: 20B
```

这表示模型可能包含 100B 参数，但单个 token 前向计算时只使用其中约 20B 参数。

需要区分几个指标：

| 指标 | 含义 |
| :---: | :---: |
| 总参数量 | 模型所有参数，包括所有专家 |
| 激活参数量 | 单个 token 实际参与前向计算的参数 |
| 权重显存 | 加载或分布式存放模型权重所需的显存 / 内存 |
| 计算量 | 单个 token 实际产生的 FLOPs |

MoE 可以降低“每 token 计算量相对于总参数量的比例”，但不意味着总显存需求一定很低: 所有专家权重仍然需要被加载，或通过分布式方式存放。

---

## 2. MoE 层的计算

### 2.1 Expert *专家模块*

Expert 通常是一个独立的 FFN / MLP 模块。

Transformer 中的一层 FFN 可以简化为：

```text
FFN(x) = down_proj( activation(gate_proj(x)) ⊙ up_proj(x) )
```

在 MoE 层中，会有多个这样的 FFN：

```text
Expert 1: x -> FFN_1 -> y_1
Expert 2: x -> FFN_2 -> y_2
Expert 3: x -> FFN_3 -> y_3
...
Expert N: x -> FFN_N -> y_N
```

每个 expert 都有独立参数。它们不一定对应人类语义上的“数学专家”“代码专家”或“中文专家”。更多时候，专家分工是训练过程中自动形成的内部表示分工。

### 2.2 Router 与 Top-k Routing

Router 也称为 gate，负责为每个 token 选择应该使用哪些 expert。

简化公式：

$$
p = \operatorname{softmax}(W_r x)
$$

其中：

- $x$ 是当前 token 的 hidden state。
- $W_r$ 是 router 参数。
- $p$ 是 token 被分配到各个 expert 的概率。

随后 router 会选择概率最高的 Top-k 个 expert。

例如有 8 个 expert，Top-2 routing 可能得到：

```text
token A -> Expert 2 + Expert 5
token B -> Expert 1 + Expert 2
token C -> Expert 7 + Expert 3
```

这就是稀疏激活：不是所有 expert 都参与计算，只有被路由选中的 expert 参与。

### 2.3 专家输出的合并

Top-k routing 中，最终输出通常是被选中专家输出的加权和。

以 Top-2 为例：

$$
y = \sum_{i=0}^{k} p_i E_i(x)
$$

其中：$E_i$ 是被选中的专家，$p_i$ 是 router 给出的权重。

如果 k 太小，模型表达能力可能受限；如果 k 太大，MoE 会逐渐接近 dense 计算，失去稀疏激活的成本优势。

### 2.4 Capacity 与 Token Dropping

每个 expert 一次能处理的 token 数通常有上限，这个上限与 capacity factor 有关。

简化理解：

```text
expert capacity = 平均每个 expert 应处理的 token 数 × capacity factor
```

如果某个 expert 被太多 token 选中，超过 capacity，常见处理方式包括：

- 丢弃多余 token。
- 将 token 改分配到备选 expert。
- 截断路由结果。
- 由训练或推理框架报错，具体取决于实现。

Token dropping 会影响训练稳定性和模型效果。capacity factor 过小，丢 token 风险较高；capacity factor 过大，显存、缓冲区和通信开销会增加。

---

## 3. MoE 的训练与推理

### 3.1 负载均衡

MoE 的核心训练问题之一是负载不均衡。

如果 router 总是把 token 分给少数 expert，会出现：

- 热门 expert 过载。
- 其他 expert 训练不足。
- GPU 间计算和通信不均衡。
- 训练吞吐下降。
- 模型容量被浪费。

因此，MoE 训练通常会加入负载均衡损失，使 token 尽量更均匀地分配到不同 expert。

常见目标包括：

- 每个 expert 接收的 token 数不要差异过大。
- router 给不同 expert 的概率分布不要过度集中。
- 避免所有 token 长期选择同一批 expert。

需要注意的是，负载均衡不是越平均越好。如果强行平均，可能破坏模型自然形成的专家分工。工程上需要在“有效分工”和“负载均衡”之间折中。

### 3.2 Expert Parallel 与 All-to-All 通信

MoE 模型参数量大、专家数量多，通常需要分布式并行。Expert Parallel（EP）是常见方式：把不同 expert 放到不同 GPU 上。

简化示意：

```text
GPU 0: Expert 0, Expert 1
GPU 1: Expert 2, Expert 3
GPU 2: Expert 4, Expert 5
GPU 3: Expert 6, Expert 7
```

推理或训练时，token 会根据 router 结果被发送到对应 expert 所在的 GPU，计算后再汇总回来。

典型流程如下：

```text
本地 token
  -> router 决定 expert
  -> all-to-all 发送 token 到 expert 所在 GPU
  -> expert 计算
  -> all-to-all 返回结果
  -> combine
```

因此，MoE 的性能瓶颈不只来自计算，还来自跨 GPU 通信和专家负载不均衡。单机多卡中，NVLink / PCIe 差异会影响性能；多机训练中，网络带宽和延迟会更加关键。

### 3.3 训练特点

MoE 训练的难点主要来自稀疏路由和分布式调度。

常见挑战包括：

- router 训练不稳定。
- expert 负载不均衡。
- 部分 expert 训练不足。
- token dropping 导致训练信号损失。
- 分布式通信开销高。
- batch size、sequence length 和 expert capacity 需要协调。

常见辅助策略包括：

- load balancing loss。
- router z-loss。
- expert dropout。
- capacity factor 调整。
- router jitter noise。
- 更大的 batch，以保证 expert 获得足够训练样本。

MoE 的总参数量很大，但单个 expert 在每一步看到的数据可能少于 dense FFN。因此，训练数据规模、batch 组织和路由稳定性都很重要。

### 3.4 推理特点

MoE 推理的主要优势是激活参数量较低，单 token 计算成本不随总参数量线性增长。

但推理也会引入额外成本：

- router 计算。
- expert dispatch。
- 跨 GPU 通信。
- 专家负载不均衡。
- kernel 和 batch 组织更复杂。

推理服务中需要关注：

| 问题 | 影响 |
| --- | --- |
| 专家分布在哪些 GPU | 决定通信路径和显存布局 |
| 每 token 激活几个 expert | 影响计算量和模型质量 |
| batch 内 token 路由是否均衡 | 影响吞吐和延迟 |
| 是否支持 expert parallel | 决定能否高效多卡部署 |
| 推理框架是否支持该 MoE 结构 | 决定能否加载和加速 |

MoE 模型不一定比同等激活参数量的 dense 模型更快。实际性能取决于框架实现、并行策略、batch 组织和硬件互联。

---

## 4. 与 Dense 模型的取舍

### 4.1 MoE 的优势

MoE 的主要优势包括：

- 总模型容量更大。
- 每 token 计算量相对可控。
- 在相同计算预算下可能获得更好效果。
- 适合扩展到非常大的参数规模。

可以概括为：**MoE 用稀疏激活换取更大的模型容量。**

### 4.2 MoE 的代价

MoE 的代价主要体现在工程复杂度上：

- 训练和推理流程更复杂。
- 对分布式通信更敏感。
- expert 负载不均衡会影响性能。
- 小 batch 或低并发下硬件利用率可能不理想。
- 格式转换、量化和部署生态支持可能滞后于 dense 模型。

简单对比：

```text
Dense 模型: 结构简单，成本可预测，部署更稳
MoE 模型: 容量更大，计算更稀疏，但工程复杂度更高
```

### 4.3 常见误区

**误区 1：MoE 总参数大，所以每次推理一定很贵。**  
不一定。MoE 的关键是稀疏激活。每个 token 只激活部分 expert，因此计算量主要看激活参数量，而不是总参数量。但所有 expert 权重仍然需要存储和加载。

**误区 2：MoE 一定比 Dense 模型快。**  
不一定。MoE 有 router、dispatch、combine 和跨卡通信成本。低并发、小 batch 或硬件互联较弱时，MoE 可能并不快。

**误区 3：Expert 就是人类语义上的专家。**  
不一定。专家分工是训练自动形成的内部结构，不能简单解释为“代码专家”“数学专家”或“中文专家”。

**误区 4：支持 MoE 就等于可以像 Dense 一样部署。**  
不一样。MoE 对推理框架、并行策略、通信拓扑、量化格式和显存布局都有更高要求。

---

## 5. 实践关注点

### 5.1 量化与微调

MoE 模型可以量化，但需要关注额外问题：

- expert 数量多，权重分片更多。
- 不同 expert 的权重分布可能不同，量化误差也可能不同。
- router 和 expert 的量化策略可能不同。
- GGUF、AWQ、GPTQ 等生态对不同 MoE 模型的支持程度不一致。
- 量化格式和推理框架必须支持对应 MoE 结构。

量化后不能只看模型能否加载，还需要评估路由是否正常、expert 输出是否稳定，以及长上下文、高并发、数学、代码、工具调用等任务是否退化。

MoE 微调也需要明确参数策略：

| 策略 | 优点 | 风险 |
| --- | --- | --- |
| 只调部分 expert | 成本低 | 覆盖能力有限 |
| 调所有 expert | 表达能力强 | 显存和训练成本高 |
| 调 router | 可以改变专家选择策略 | 容易影响已有专家分工 |
| LoRA 到 expert | 参数高效 | target_modules 和框架支持要匹配 |
| 冻结 expert 训练 adapter | 稳定 | 适配能力可能受限 |

微调时要关注训练数据是否覆盖不同 expert。如果数据过窄，可能导致少数 expert 被过度调整。

### 5.2 常见指标

理解和评估 MoE 时，可以关注以下指标：

| 指标 | 含义 |
| --- | --- |
| num_experts | expert 总数 |
| top_k | 每个 token 选择几个 expert |
| active parameters | 每 token 激活参数量 |
| total parameters | 模型总参数量 |
| expert capacity | 每个 expert 可接收 token 上限 |
| dropped tokens | 因容量不足被丢弃的 token |
| load balance loss | 负载均衡辅助损失 |
| expert utilization | 各 expert 被使用的比例 |
| all-to-all time | 专家并行通信耗时 |
| router entropy | router 分布是否过度集中 |

这些指标不仅影响训练效果，也影响推理性能和线上稳定性。

### 5.3 使用建议

使用 MoE 模型时，可以按以下顺序检查：

1. 同时查看总参数量和激活参数量，不要只看总参数。
2. 确认推理框架是否支持该模型的 MoE 结构。
3. 确认是否需要 expert parallel。
4. 评估硬件互联是否适合 MoE。
5. 使用真实输入长度和并发做压测。
6. 同时观察 TTFT、ITL、吞吐、显存和 expert 利用率。
7. 量化或格式转换后重新评估质量和性能。
8. 微调时确认 router、expert 和 LoRA target_modules 的策略。

如果只是单卡本地推理，dense 模型通常更简单。如果目标是更高模型容量和服务端规模化部署，MoE 才更容易体现优势。

---

## 6. 总结

MoE 架构的本质是：用多个 expert 扩大模型总容量，再通过 router 让每个 token 只激活少数 expert，从而在容量和计算成本之间取得折中。

它的核心链路可以概括为：

```text
token hidden state
  -> router 选择 Top-k expert
  -> 被选中 expert 分别计算
  -> 按 router 权重合并输出
```

MoE 能带来更大的模型容量和更低的相对激活计算量，但也引入了路由、负载均衡、专家并行、All-to-All 通信、量化和部署复杂度。

实际选择 MoE 还是 dense 模型，需要同时考虑模型效果、硬件条件、推理框架支持、并发规模和线上服务目标。
