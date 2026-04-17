---
title: 词向量与 Embedding
sidebar_position: 3
tags: [Embedding, 词向量, 语义向量, LLM基础]
description: 解释 token embedding、语义向量、embedding 矩阵和向量空间的基础概念。
last_update:
  date: 2026-04-17
---

# 词向量与 Embedding

本文用于解释模型如何把离散 token id 转换成可计算的连续向量。

待展开内容：

- token id 为什么不能直接表达语义
- embedding lookup
- embedding 矩阵
- hidden size
- 向量空间中的相似性
- 输入 embedding 与输出 LM Head
- embedding 模型和生成模型里的 embedding 区别
- RAG 中的 embedding 与模型内部 embedding 的关系
