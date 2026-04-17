---
title: MoE 架构
sidebar_position: 7
tags: [MoE, Mixture of Experts, 稀疏模型, Expert Parallel]
description: MoE 架构的核心思想、专家路由、训练推理特点和大语言模型中的工程问题。
last_update:
  date: 2026-04-17
---

# MoE 架构

MoE（Mixture of Experts，混合专家）是一种稀疏激活模型架构。它的核心思想是：模型内部准备多个“专家”模块，但每个 token 只激活其中一小部分专家参与计算。

在大语言模型中，MoE 常用于扩大模型总参数量，同时控制每次推理实际参与计算的参数量。这样可以让模型拥有更大的容量，但单个 token 的计算成本不必和总参数量等比例增长。

常见 MoE 模型包括 Mixtral、DeepSeek-V2 / V3、Qwen-MoE、Grok 等。不同模型的具体实现不同，但核心都围绕“专家、路由、稀疏激活、负载均衡”展开。

## 1. Dense 模型与 MoE 模型

传统 Transformer LLM 通常是 dense 模型。所谓 dense，是指每个 token 都会经过每一层中的所有主要参数。

简化理解：

```text
Dense Transformer Block
  token -> Attention -> FFN -> output
```

其中 FFN 对所有 token 都使用同一组参数。

MoE 模型会把某些 FFN 层替换成多个专家 FFN。每个 token 通过 router 选择少数几个专家。

```text
MoE Transformer Block
  token -> Attention -> Router -> Top-k Experts -> 合并输出
```

关键区别：

| 维度 | Dense 模型 | MoE 模型 |
| --- | --- | --- |
| 参数使用 | 每个 token 使用全部层参数 | 每个 token 只使用部分专家参数 |
| 总参数量 | 与每次计算量强相关 | 可以很大，但激活参数较少 |
| 推理计算 | 稳定、结构简单 | 需要路由和专家调度 |
| 训练难度 | 相对成熟 | 需要负载均衡和并行策略 |
| 工程复杂度 | 较低 | 较高 |

MoE 的目标不是让所有专家同时工作，而是让不同 token 动态选择更合适的专家。

## 2. MoE 放在 Transformer 的哪里

在现代 LLM 中，MoE 通常替换 Transformer Block 里的 FFN 部分，而不是替换 Attention。

Dense Transformer Block 可以简化为：

```text
x
  -> Self-Attention
  -> Dense FFN
  -> output
```

MoE Transformer Block 可以简化为：

```text
x
  -> Self-Attention
  -> Router
  -> Expert FFN 1 / Expert FFN 2 / ...
  -> combine
  -> output
```

原因是 FFN 通常占据模型参数的大部分。把 FFN 扩展成多个专家，可以显著增加模型容量，同时保持 Attention 结构相对稳定。

## 3. Expert 是什么

Expert 通常是一个独立的 FFN / MLP 模块。

在普通 Transformer 里，一层 FFN 可能是：

```text
x -> gate_proj / up_proj -> activation -> down_proj -> output
```

在 MoE 层里，会有多个这样的 FFN：

```text
Expert 1: x -> FFN_1 -> y_1
Expert 2: x -> FFN_2 -> y_2
Expert 3: x -> FFN_3 -> y_3
...
Expert N: x -> FFN_N -> y_N
```

每个 expert 都有自己的参数。它们不一定对应人类能理解的“数学专家”“代码专家”“中文专家”。更多时候，专家分工是训练过程中自动形成的内部表示分工。

## 4. Router 是什么

Router 也叫 gate，是 MoE 的路由模块。它负责为每个 token 选择应该使用哪些 expert。

简化公式：

$$
p = \operatorname{softmax}(W_r x)
$$

其中：

- $x$ 是当前 token 的 hidden state。
- $W_r$ 是 router 参数。
- $p$ 是每个 expert 的选择概率。

然后 router 会选择概率最高的 Top-k 个 expert。

例如有 8 个 expert，Top-2 routing 可能选中：

```text
token A -> Expert 2 + Expert 5
token B -> Expert 1 + Expert 2
token C -> Expert 7 + Expert 3
```

这就是“稀疏激活”：不是所有 expert 都参与计算，只有被路由选中的 expert 参与。

## 5. Top-k Routing

Top-k routing 是 MoE 中最常见的路由方式之一。

| 路由方式 | 含义 | 特点 |
| --- | --- | --- |
| Top-1 | 每个 token 只选一个 expert | 计算最省，但表达能力和稳定性可能受限 |
| Top-2 | 每个 token 选择两个 expert | 常见折中，效果和稳定性较好 |
| Top-k | 每个 token 选择 k 个 expert | k 越大计算越多，专家融合更充分 |

Top-2 routing 的输出通常是被选中专家输出的加权和：

$$
y = p_{i} E_i(x) + p_{j} E_j(x)
$$

其中：

- $E_i$ 和 $E_j$ 是被选中的专家。
- $p_i$ 和 $p_j$ 是 router 给出的权重。

如果 k 太小，模型可能表达不足；如果 k 太大，MoE 会逐渐接近 dense 计算，失去稀疏激活的成本优势。

## 6. 激活参数与总参数

MoE 模型经常会同时标注“总参数量”和“激活参数量”。

例如一个模型可能有：

```text
总参数量: 100B
每 token 激活参数量: 20B
```

这表示模型磁盘和显存里可能需要保存 100B 参数，但每个 token 推理时只使用其中约 20B 的参数参与计算。

需要区分：

| 指标 | 含义 |
| --- | --- |
| 总参数量 | 模型所有参数，包括所有 expert |
| 激活参数量 | 单个 token 实际参与前向计算的参数 |
| 权重显存 | 加载模型需要放进显存或内存的权重 |
| 计算量 | 每个 token 实际计算的 FLOPs |

MoE 可以降低“每 token 计算量相对于总参数量的比例”，但不代表总显存需求一定很低。所有专家参数通常仍然需要被加载或分布式存放。

## 7. 负载均衡

MoE 的一个核心问题是负载不均衡。

如果 router 总是把 token 分给少数几个 expert，会出现：

- 热门 expert 过载。
- 其他 expert 学不到东西。
- GPU 间通信和计算不均衡。
- 训练吞吐下降。
- 模型容量浪费。

因此 MoE 训练通常会加入负载均衡损失，让 token 尽量更均匀地分配到不同 expert。

常见目标包括：

- 每个 expert 接收的 token 数不要差异过大。
- router 给不同 expert 的概率分布不要过度集中。
- 避免所有 token 都选择同一批 expert。

负载均衡不是越平均越好。如果强行平均，可能破坏模型自然形成的专家分工。工程上需要在“分工有效”和“负载均衡”之间折中。

## 8. Capacity Factor 与 Token Dropping

每个 expert 一次能处理的 token 数通常有上限，这个上限和 capacity factor 有关。

简化理解：

```text
expert capacity = 平均每个 expert 应处理的 token 数 × capacity factor
```

如果某个 expert 被太多 token 选中，超过 capacity，可能会发生：

- 多余 token 被丢弃。
- token 改走备选 expert。
- 路由结果被截断。
- 推理或训练框架报错，取决于实现。

Token dropping 会影响训练稳定性和模型效果。capacity factor 设得太小，丢 token 风险高；设得太大，显存和计算缓冲开销增加。

## 9. Expert Parallel

MoE 模型参数量大，专家数量多，通常需要分布式并行。

Expert Parallel（EP）是 MoE 常见并行方式：把不同 expert 放到不同 GPU 上。

简化示意：

```text
GPU 0: Expert 0, Expert 1
GPU 1: Expert 2, Expert 3
GPU 2: Expert 4, Expert 5
GPU 3: Expert 6, Expert 7
```

推理或训练时，token 会根据 router 结果被发送到对应 expert 所在的 GPU，计算后再汇总回来。

这会引入通信成本：

- token dispatch：把 token 发给对应 expert。
- expert compute：专家前向计算。
- combine：把 expert 输出合并回原 token 顺序。

MoE 的性能瓶颈往往不只是计算，还包括跨 GPU 通信和负载不均衡。

## 10. All-to-All 通信

MoE 分布式训练和推理中经常涉及 All-to-All 通信。

原因是：一个 batch 里的 token 可能被路由到不同 GPU 上的 expert。每张 GPU 都可能需要把部分 token 发给其他 GPU，也会从其他 GPU 接收 token。

简化流程：

```text
本地 token
  -> router 决定 expert
  -> all-to-all 发送 token 到 expert 所在 GPU
  -> expert 计算
  -> all-to-all 返回结果
  -> combine
```

这也是为什么 MoE 对网络互联、GPU 拓扑和并行策略更敏感。

在单机多卡中，NVLink / PCIe 差异会影响性能；在多机训练中，网络带宽和延迟会更关键。

## 11. MoE 的训练特点

MoE 训练的难点主要来自稀疏路由。

常见挑战：

- router 训练不稳定。
- expert 负载不均衡。
- 部分 expert 训练不足。
- token dropping 导致训练信号损失。
- 分布式通信开销高。
- batch size、sequence length 和 expert capacity 需要协调。

训练时常见辅助策略：

- load balancing loss。
- router z-loss。
- expert dropout。
- capacity factor 调整。
- router jitter noise。
- 更大的 batch 保证专家获得足够训练样本。

MoE 的总参数量很大，但每个 expert 每步看到的数据可能比 dense FFN 少。因此训练数据规模、batch 组织和路由稳定性都很重要。

## 12. MoE 的推理特点

MoE 推理的核心优势是：激活参数量较低，单 token 计算成本不随总参数量线性增长。

但它也有额外成本：

- router 计算。
- expert dispatch。
- 跨 GPU 通信。
- 专家负载不均衡。
- kernel 和 batch 组织更复杂。

推理服务中需要关注：

| 问题 | 影响 |
| --- | --- |
| 专家分布在哪些 GPU | 决定通信路径和显存布局 |
| 每 token 激活几个 expert | 影响计算量和质量 |
| batch 内 token 路由是否均衡 | 影响吞吐和延迟 |
| 是否支持 expert parallel | 决定能否高效多卡部署 |
| 推理框架是否支持该 MoE 结构 | 决定能否加载和加速 |

MoE 模型并不一定比同等激活参数量的 dense 模型更快。实际性能取决于框架实现、并行策略和硬件互联。

## 13. MoE 与 Dense 模型的取舍

MoE 的优势：

- 总模型容量更大。
- 每 token 计算量相对可控。
- 在相同计算预算下可能获得更好效果。
- 适合扩展到非常大的参数规模。

MoE 的劣势：

- 训练和推理工程复杂。
- 对分布式通信敏感。
- 专家负载不均衡会影响性能。
- 小 batch 或低并发下硬件利用率可能不理想。
- 格式转换、量化和部署生态支持可能滞后于 dense 模型。

可以简单理解：

```text
Dense 模型: 结构简单，成本可预测，部署更稳
MoE 模型: 容量更大，稀疏计算，但工程复杂度更高
```

## 14. MoE 与 Transformer 的关系

MoE 不是替代 Transformer，而是 Transformer 内部的一种扩展方式。

大多数 MoE LLM 仍然是 Transformer：

- Attention 仍然负责 token 间信息交互。
- RoPE / RMSNorm / residual 等结构仍然存在。
- Decoder-only 自回归生成方式仍然相同。
- 主要变化是部分 FFN 层变成 MoE 层。

因此，理解 MoE 的前提仍然是理解 Transformer Block。MoE 主要是在 FFN 容量扩展和稀疏计算上做文章。

## 15. MoE 与量化

MoE 模型也可以量化，但会有一些额外问题。

需要注意：

- expert 数量多，权重分片更多。
- 不同 expert 的权重分布可能不同，量化误差也可能不同。
- 量化格式和推理框架必须支持对应 MoE 结构。
- GGUF、AWQ、GPTQ 等生态对不同 MoE 模型的支持程度不一致。
- router 和 expert 的量化策略可能不同。

量化 MoE 后不能只看模型能否加载，还要评估：

- 路由是否正常。
- expert 输出是否稳定。
- 长上下文和高并发下是否出现性能抖动。
- 数学、代码、工具调用等任务是否退化。

## 16. MoE 与微调

MoE 微调也需要注意参数选择。

常见策略包括：

- 只微调部分专家。
- 微调所有专家。
- 微调 router。
- 对 attention 和 expert FFN 加 LoRA。
- 冻结 expert，只训练 adapter。

不同策略取舍不同：

| 策略 | 优点 | 风险 |
| --- | --- | --- |
| 只调部分专家 | 成本低 | 可能覆盖能力有限 |
| 调所有专家 | 表达能力强 | 显存和训练成本高 |
| 调 router | 改变专家选择策略 | 容易影响已有分工 |
| LoRA 到 expert | 参数高效 | target_modules 和框架支持要匹配 |
| 冻结专家训练 adapter | 稳定 | 适配能力可能受限 |

MoE 微调时要特别关注训练数据是否足够覆盖不同 expert。如果数据太窄，可能导致少数专家被过度调整。

## 17. 常见指标

理解和评估 MoE 时，可以关注这些指标：

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

## 18. 常见误区

### 18.1 MoE 总参数大，所以每次推理一定很贵

不一定。MoE 的关键是稀疏激活。每个 token 只激活部分 expert，因此计算量主要看激活参数量，而不是总参数量。

但所有 expert 权重仍然需要存储和加载，所以显存、内存和分布式部署成本仍然要认真评估。

### 18.2 MoE 一定比 Dense 模型快

不一定。MoE 有额外的 router、dispatch、combine 和跨卡通信成本。低并发、小 batch 或互联较弱时，MoE 可能并不快。

### 18.3 Expert 就是人类语义上的专家

不一定。专家分工是训练自动形成的内部结构，不能简单解释为“代码专家”“数学专家”“中文专家”。

### 18.4 只要模型支持 MoE，部署就和 Dense 一样

不一样。MoE 对推理框架、并行策略、通信拓扑、量化格式和显存布局都有更高要求。

## 19. 实践建议

使用 MoE 模型时，可以按这个顺序检查：

1. 看总参数量和激活参数量，不要只看总参数。
2. 确认推理框架是否支持该模型的 MoE 结构。
3. 确认是否需要 expert parallel。
4. 评估硬件互联是否适合 MoE。
5. 用真实输入长度和并发做压测。
6. 同时看 TTFT、ITL、吞吐、显存和 expert 利用率。
7. 量化或格式转换后重新评估质量和性能。
8. 微调时确认 router、expert 和 LoRA target_modules 的策略。

如果只是单卡本地推理，dense 模型往往更简单。如果是追求更高模型容量和服务端规模化部署，MoE 才更有优势。

## 20. 总结

MoE 架构的本质是：用多个专家模块扩大模型总容量，再通过 router 让每个 token 只激活少数专家，从而在容量和计算成本之间取得折中。

理解 MoE 可以抓住四个关键词：

- Expert：多个独立 FFN / MLP 模块。
- Router：决定每个 token 使用哪些专家。
- Sparse Activation：每个 token 只激活部分专家。
- Load Balance：避免少数专家过载，保证训练和推理稳定。

MoE 不是 Transformer 的替代品，而是 Transformer FFN 部分的一种扩展。它能带来更大的模型容量，但也引入了路由、通信、负载均衡、量化和部署复杂度。实际选择 MoE 还是 dense 模型，需要同时看模型效果、硬件条件、推理框架支持和线上服务目标。
