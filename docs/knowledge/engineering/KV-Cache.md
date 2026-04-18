---
title: KV Cache
sidebar_position: 7
tags: [KV Cache, 推理缓存, 显存, 长上下文]
description: LLM 推理中 KV Cache 的作用、显存占用、并发影响和优化策略。
last_update:
  date: 2026-04-18
---

# KV Cache

KV Cache 是大模型推理里最重要的缓存之一。

它的核心作用是：在自回归生成时，把历史 token 在每一层 attention 中产生的 Key 和 Value 保存下来，后续生成新 token 时直接复用，避免每一步都重新计算完整上下文。

一句话概括：

```text
KV Cache 用显存换计算时间，让 decode 阶段可以复用历史上下文。
```

它带来的收益很直接：生成速度更快、首轮 prompt 之后的逐 token 推理成本更低。

它带来的代价也很直接：上下文越长、并发越高，KV Cache 占用的显存越多。长上下文和高并发服务里，瓶颈经常不是模型权重，而是 KV Cache。

## 1. 为什么需要 KV Cache

Decoder-only LLM 是自回归生成模型。生成第 `t` 个 token 时，模型需要看见前面所有 token：

```text
token_1, token_2, ..., token_{t-1}
  -> 预测 token_t
```

如果没有 KV Cache，每生成一个新 token，都要把完整历史上下文重新送进模型，重新计算所有历史 token 的 attention 中间结果。

这样会造成大量重复计算：

```text
生成第 1 个 token：计算 prompt
生成第 2 个 token：重新计算 prompt + 第 1 个 token
生成第 3 个 token：重新计算 prompt + 第 1、2 个 token
...
```

KV Cache 的做法是：

1. prompt 进入模型时，计算每一层 attention 的 Key / Value。
2. 把这些 Key / Value 写入缓存。
3. 生成新 token 时，只计算新 token 对应的 Query / Key / Value。
4. 新 token 的 Query 和历史缓存里的 Key / Value 做 attention。
5. 把新 token 的 Key / Value 继续追加进缓存。

这样，历史 token 的 Key / Value 不需要反复计算。

## 2. Prefill 与 Decode

理解 KV Cache，必须区分两个阶段：

| 阶段 | 做什么 | 主要特点 | 主要瓶颈 |
| --- | --- | --- | --- |
| Prefill | 处理完整输入 prompt，生成初始 KV Cache | 一次处理很多输入 token | 算力、attention 计算、TTFT |
| Decode | 每次生成一个或一小批新 token，复用 KV Cache | 多次小步生成 | 显存带宽、KV Cache 读写、调度 |

### 2.1 Prefill 阶段

Prefill 是“读题”阶段。

用户输入的 prompt、历史对话、RAG 内容、工具定义都会先被 tokenizer 转成 token，然后一次性送入模型。模型在每一层中计算这些 token 的 Key / Value，并写入 KV Cache。

这个阶段通常决定 TTFT，也就是 Time To First Token。

长 prompt 会让 prefill 变慢，因为模型需要先处理完整输入，才能开始输出第一个 token。

### 2.2 Decode 阶段

Decode 是“逐字生成”阶段。

每生成一个 token，模型都会读取已有 KV Cache，并把新 token 的 Key / Value 追加进去。

这个阶段通常决定输出速度，也就是 tokens/s、ITL 和用户体感流畅度。

对于在线服务，decode 阶段常常偏访存瓶颈：每一步计算量不一定很大，但需要持续读取模型权重和历史 KV Cache。

## 3. KV Cache 存什么

Attention 中每个 token 会产生三个向量：

- Query：当前 token 用来查询上下文。
- Key：历史 token 用来被匹配。
- Value：历史 token 被加权汇总时提供的信息。

推理时，历史 token 的 Query 通常不需要保存，因为后续生成只需要新 token 的 Query 去访问历史 Key / Value。

所以 KV Cache 保存的是：

```text
每一层、每个 token 的 Key 和 Value
```

从形状上看，可以粗略理解为：

```text
KV Cache ≈ layers × tokens × kv_heads × head_dim × 2
```

最后的 `2` 分别代表 Key 和 Value。

## 4. 为什么 KV Cache 会变大

KV Cache 和这些因素强相关：

| 因素 | 对 KV Cache 的影响 |
| --- | --- |
| 层数 | 层数越多，每个 token 要保存的 K/V 越多 |
| KV heads | KV head 越多，缓存越大 |
| head dim | 每个 head 的维度越大，缓存越大 |
| token 数 | 输入 token + 已生成 token 越多，缓存越大 |
| 并发数 | 同时保留的请求越多，总缓存越大 |
| KV 精度 | FP16 / BF16 比 FP8 占用更高 |

这也是为什么“模型能加载”不等于“服务能稳定跑”。

模型权重加载成功，只说明权重放进了显存。真正服务时，还要给每个请求分配 KV Cache。如果上下文长度、并发或输出长度变大，显存可能很快被 KV Cache 吃满。

## 5. 显存估算

标准 Multi-Head Attention 下，可以用下面的简化公式估算：

```text
KV Cache 显存 ≈ 2 × 层数 × hidden_size × 每元素字节数 × 总 token 数
```

其中：

- `2`：Key 和 Value。
- `层数`：Transformer block 数量。
- `hidden_size`：标准 MHA 下可用于粗略估算 K/V 总维度。
- `每元素字节数`：FP16 / BF16 通常是 2 bytes，FP8 通常是 1 byte。
- `总 token 数`：约等于 `并发请求数 × 每个请求保留的 token 数`。

更精确的公式是：

```text
KV Cache 显存 ≈ 2 × 层数 × num_key_value_heads × head_dim × 每元素字节数 × 总 token 数
```

### 示例

假设模型和请求配置如下：

| 参数 | 值 |
| --- | --- |
| 层数 | 32 |
| hidden_size | 4096 |
| KV Cache 精度 | FP16，2 bytes |
| 并发请求数 | 8 |
| 每个请求保留 token 数 | 4096 |

总 token 数：

```text
8 × 4096 = 32768
```

按标准 MHA 简化估算：

```text
KV Cache 显存
≈ 2 × 32 × 4096 × 2 bytes × 32768
≈ 16.0 GiB
≈ 17.2 GB
```

这还只是 KV Cache，不包含模型权重、CUDA runtime、workspace、通信 buffer、显存碎片和框架预留空间。

更完整的显存估算见：[模型尺寸与显存估算](../hardware/模型占用显存估算.md) 和 [显存](../hardware/显存.md)。

## 6. MHA、GQA、MQA 的影响

不同 attention 结构会明显影响 KV Cache 大小。

| 结构 | K/V head 关系 | KV Cache 占用 | 说明 |
| --- | --- | --- | --- |
| MHA | 每个 Query head 都有自己的 Key / Value head | 最大 | 传统 Multi-Head Attention |
| GQA | 多个 Query head 共享一组 Key / Value head | 中等 | 现代 LLM 常见选择 |
| MQA | 所有 Query head 共享一组 Key / Value head | 最小 | 推理省显存，但模型结构约束更强 |

标准 MHA 中：

```text
num_key_value_heads = num_attention_heads
```

GQA / MQA 中：

```text
num_key_value_heads < num_attention_heads
```

所以在同样层数、上下文长度和精度下，GQA / MQA 的 KV Cache 会更小。

这也是部署长上下文模型时要关注 `num_key_value_heads` 的原因。只看参数量不够，同样是 7B 或 32B 模型，KV Cache 压力可能因为 attention 结构不同而差很多。

## 7. PagedAttention 与分页管理

朴素 KV Cache 管理容易浪费显存。

原因是在线请求长度差异很大：

- 有的请求只有几百 token。
- 有的请求有几万 token。
- 有的请求很快结束。
- 有的请求持续流式输出很久。

如果为每个请求按最大长度一次性预留连续显存，会产生两个问题：

1. 预留太多，很多空间实际没有用到。
2. 连续大块显存难以管理，容易产生碎片。

PagedAttention 的思路类似操作系统分页：把 KV Cache 切成固定大小的 block / page，请求需要多少就分配多少。

这样可以：

- 减少预分配浪费。
- 降低显存碎片。
- 支持 continuous batching。
- 更容易做请求调度、抢占和释放。

vLLM 的高吞吐能力很大程度上就来自这类 KV Cache 分页管理和调度策略。

## 8. Prefix Cache

Prefix Cache 是对“相同前缀 prompt”的复用。

很多业务请求有共同前缀，例如：

- 固定 system prompt。
- 固定工具定义。
- 固定 RAG 模板。
- 同一段长文档的多轮追问。
- 多用户共享的长上下文前缀。

如果每个请求都重新 prefill 这些相同前缀，会浪费计算。

Prefix Cache 会把相同前缀对应的 KV Cache 保存下来，后续请求命中时直接复用。

它的收益主要体现在：

- 降低 TTFT。
- 减少重复 prefill 计算。
- 提高长 prompt 场景吞吐。

但 prefix cache 也有边界：

- 只有前缀完全或可识别地一致时才容易命中。
- chat template、特殊 token、空格、工具定义顺序不同，都可能导致 token 序列不同。
- 缓存本身也占显存或内存，需要淘汰策略。
- 多租户场景要注意数据隔离，不能把用户私有上下文错误复用给别人。

## 9. KV Cache 量化

KV Cache 量化是把缓存里的 Key / Value 用更低精度保存，例如 FP8。

它的主要目的不是降低模型权重，而是降低长上下文和高并发下的缓存显存。

| 方案 | 大致效果 | 风险 |
| --- | --- | --- |
| FP16 / BF16 KV Cache | 兼容性最好 | 显存占用高 |
| FP8 KV Cache | 显存约可降低到一半 | 需要硬件和框架支持，可能有精度影响 |
| 更低 bit KV Cache | 显存更低 | 质量、稳定性和支持度风险更高 |

KV Cache 量化是否值得启用，要看场景：

- 如果瓶颈是权重显存，优先看权重量化。
- 如果瓶颈是长上下文或高并发，KV Cache 量化更有价值。
- 如果业务对生成质量很敏感，需要用真实数据评估量化影响。

生产环境不要只看能不能启动，要压测不同输入长度、输出长度和并发下的效果。

## 10. 调度与并发

KV Cache 和调度系统强相关。

LLM 服务的并发不是简单的 HTTP 请求数。两个请求的显存压力可能完全不同：

| 请求 | 输入长度 | 输出长度 | KV Cache 压力 |
| --- | ---: | ---: | --- |
| 简短问答 | 200 tokens | 200 tokens | 低 |
| 长文档总结 | 32000 tokens | 1000 tokens | 高 |
| 多轮对话 | 8000 tokens | 2000 tokens | 中高 |

调度器需要同时考虑：

- 当前 batch 中的 token 数。
- 每个请求的剩余输出预算。
- GPU 剩余显存。
- KV Cache block 使用率。
- prefill 和 decode 的混合调度。
- 请求是否可以抢占、暂停或迁移。

如果只按“请求数”限流，很容易出现少量长上下文请求拖垮整个服务的情况。

更合理的做法是按 token 和缓存预算限流，例如：

- 限制最大上下文长度。
- 限制最大输出 token 数。
- 限制单用户并发。
- 对超长 prompt 单独排队。
- 按输入 token 和输出 token 做容量规划。
- 根据 KV Cache 使用率做动态降级或拒绝。

## 11. 多卡场景

多卡部署时，KV Cache 的位置取决于并行策略和推理框架实现。

常见情况：

- 多副本：每张卡或每组卡运行一份模型副本，请求被路由到某个副本，KV Cache 留在该副本上。
- Tensor Parallel：模型一层内的权重分片到多卡，KV Cache 也可能按 head 或张量维度分布。
- Pipeline Parallel：不同层放在不同卡上，每层对应的 KV Cache 通常跟随该层所在设备。

多卡不是自动解决 KV Cache 问题。

它可以提供更多总显存，但也会引入：

- 跨卡通信。
- 调度复杂度。
- 负载不均。
- 某些卡 KV Cache 更紧张。
- 请求迁移成本。

如果是多副本在线推理，路由层不要只按请求数分配流量，还要看每个 worker 的显存、KV Cache 使用率、batch 状态和队列长度。

## 12. 常见问题

### 12.1 模型能加载，但一并发就 OOM

常见原因：

- 只估算了权重显存，没有估算 KV Cache。
- `max_model_len` 设置过大，框架预留了大量缓存。
- 并发请求的上下文长度过长。
- 输出 token 上限太高。
- 运行时开销和显存碎片没有预留空间。

处理方式：

- 降低 `max_model_len`。
- 限制输入长度和输出长度。
- 降低并发。
- 启用 GQA / MQA 模型或 KV Cache 量化。
- 使用更好的分页 KV Cache 管理。
- 换更大显存或多卡方案。

### 12.2 TTFT 很高

常见原因：

- prompt 太长，prefill 阶段耗时高。
- RAG 拼接内容过多。
- system prompt 或工具定义过长。
- prefix cache 没有命中。
- prefill batch 调度不合理。

处理方式：

- 压缩 prompt 和工具定义。
- 控制 RAG chunk 数量。
- 对固定前缀启用 prefix cache。
- 分离长 prompt 请求和短请求队列。
- 关注 prefill tokens/s，而不是只看整体 QPS。

### 12.3 输出越来越慢

常见原因：

- decode 阶段持续读取越来越长的 KV Cache。
- batch 中混入长输出请求。
- 显存带宽成为瓶颈。
- KV Cache block 接近耗尽，调度器频繁等待或抢占。

处理方式：

- 限制最大输出 token。
- 对长输出请求单独调度。
- 使用 continuous batching。
- 观察 ITL、tokens/s 和 KV Cache 使用率。
- 在可接受质量范围内启用 KV Cache 量化。

### 12.4 Prefix cache 命中率低

常见原因：

- prompt 表面相似，但 token 序列不同。
- chat template 渲染不稳定。
- 工具定义顺序变化。
- RAG 内容插入位置不同。
- 时间戳、请求 ID 等动态字段放在前缀中。

处理方式：

- 固定 system prompt 和工具定义顺序。
- 把动态字段尽量后置。
- 保持 chat template 一致。
- 记录 prefix cache hit rate。
- 用 token 级别而不是字符串级别排查差异。

## 13. 监控指标

生产环境建议至少关注这些指标：

| 指标 | 说明 |
| --- | --- |
| GPU memory used / reserved | 判断显存余量和框架预留情况 |
| KV Cache usage | 判断缓存块或页的使用率 |
| Prefix cache hit rate | 判断共享前缀复用效果 |
| TTFT | 主要反映 prefill、排队和调度 |
| ITL | 主要反映 decode 阶段流畅度 |
| input tokens / request | 判断请求输入长度分布 |
| output tokens / request | 判断生成长度分布 |
| running / waiting requests | 判断队列和调度压力 |
| OOM / preemption 次数 | 判断缓存和显存是否紧张 |

排障时不要只看 GPU 利用率。

GPU 利用率高可能是正常高吞吐，也可能是长 prompt 压力；GPU 利用率不高但延迟很差，也可能是调度、KV Cache、CPU tokenizer、网络或队列问题。

## 14. 实践建议

部署 LLM 服务时，可以按这个顺序检查：

1. 先估算权重显存。
2. 再按真实上下文长度和并发估算 KV Cache。
3. 查看模型是否使用 GQA / MQA，以及 `num_key_value_heads`。
4. 根据业务设置合理的 `max_model_len`。
5. 分别压测短 prompt、长 prompt、短输出、长输出。
6. 观察 TTFT、ITL、KV Cache 使用率和 OOM。
7. 对固定前缀场景启用 prefix cache。
8. 对长上下文或高并发场景评估 KV Cache 量化。
9. 为框架运行时、workspace、通信 buffer 和碎片预留显存。
10. 在线限流不要只按请求数，要按 token 和缓存压力。

## 15. 和其他概念的关系

- 和 [上下文管理](./上下文管理.md)：上下文越长，KV Cache 压力越大。
- 和 [并发与批处理](./并发与批处理.md)：batch 调度会直接影响 KV Cache 分配和释放。
- 和 [流式输出](./流式输出.md)：流式输出发生在 decode 阶段，持续复用并追加 KV Cache。
- 和 [推理服务架构](./推理服务架构.md)：调度器、worker 和路由层都需要感知 KV Cache 压力。
- 和 [硬件选型](../hardware/硬件选型.md)：长上下文服务要优先关注显存容量、带宽和 KV Cache 管理能力。

## 16. 总结

KV Cache 是 LLM 推理性能和显存成本之间的核心交换。

它让模型不必反复计算历史上下文，因此显著提升 decode 效率；但它也会随上下文长度、输出长度和并发数线性增长，成为长上下文和高并发服务的主要显存压力。

判断一个模型能不能稳定上线，不能只看权重大小。更可靠的方式是：

```text
权重显存 + KV Cache 显存 + 运行时开销 + 冗余空间
```

其中 KV Cache 要按真实的输入长度、输出长度、并发、attention 结构和推理框架管理策略一起估算。
