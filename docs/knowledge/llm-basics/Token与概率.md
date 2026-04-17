---
title: Token 与概率
sidebar_position: 2
tags: [Token, 概率分布, next token prediction, LLM基础]
description: 从 token、logits、概率分布和下一个 token 预测理解大语言模型的基本工作方式。
last_update:
  date: 2026-04-17
---

# Token 与概率

本文用于解释大语言模型最基础的工作方式：把文本切成 token，并预测下一个 token 的概率分布。

待展开内容：

- token、token id、词表
- logits、softmax、概率分布
- 下一个 token 预测
- 为什么模型输出不是“直接写文字”
- greedy、sampling 与概率选择
- 概率分布和模型不确定性
- token 数和上下文长度、计费、压测的关系
