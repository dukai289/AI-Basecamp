---
title: KV Cache
sidebar_position: 7
tags: [KV Cache, 推理缓存, 显存, 长上下文]
description: LLM 推理中 KV Cache 的作用、显存占用、并发影响和优化策略。
last_update:
  date: 2026-04-17
---

# KV Cache

本文用于整理 LLM 推理中 KV Cache 的工程知识。

待展开内容：

- KV Cache 是什么
- prefill 与 decode 阶段的区别
- KV Cache 为什么会随上下文长度和并发增长
- MHA、MQA、GQA 对 KV Cache 的影响
- KV Cache 显存估算
- paging / paged attention
- KV Cache 量化
- prefix cache
- 长上下文和高并发下的常见问题
