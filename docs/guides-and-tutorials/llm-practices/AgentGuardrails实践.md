---
title: Guardrails - 提高 Agent 可靠性
sidebar_position: 1
tags: [Guardrails, Agent, Agent 工程化]
description: 工程实践 - 使用 Guardrails 提高 Agent 的数据可靠性。
draft: true
last_update:
  date: 2026-04-18
---

# 使用 Guardrails 提高 Agent 的数据可靠性

:::tip[内容]
1. Agent Guardrails 是什么。
2. 一个使用 Guardrails 的业务实践。
:::

## 问题

---

## 目的
1. 最终减少数据错误，提高可靠性。

---

## 
2. 最强大的 LLM 后模式是自纠错循环：失败的响应会在执行过程中进行修正，而不是返回给用户。

---

## 参考
- [Best Practices for Building Agents | Part 5 - Guardrails](https://www.arthur.ai/blog/best-practices-for-building-agents-guardrails)
- [Guardrails - OpenAI Agents SDK](https://openai.github.io/openai-agents-python/guardrails/)
- [Guardrails - LangChain](https://docs.langchain.com/oss/python/langchain/guardrails)

## 草稿
```text
问题：凡是依赖 prompt 让模型“自觉遵守”的方案，在 SQL Agent 这种数字严谨场景里都不可靠。

以这里要把问题从：如何提示模型不要编数字？
改成：如何让模型没有机会编数字？即使编了也无法通过系统校验。

validation logic, content filtering, and safety checks.

+ 确定性/规则: 正则、关键字、显式检查
+ 语义性:

Evidence table + 引用校验 或者 结构化 DSL + 程序渲染

数字来源校验 Guardrail - Output validation guardrail
	Agent 先正常回答
	↓
	Guardrail 提取回答中的数字
	↓
	Guardrail 提取 SQL / 工具结果中的数字
	↓
	校验，找出无来源数字
	↓
	生成校验报告 通过或者不通过
	↓
	把报告传回 Agent，让它重新生成
		1. 删除这个数字；
		2. 用工具结果中的已有数字替换；
		3. 重新调用工具补充查询。

难点：
	校验规则 - 
	失败处理 -  抛出错误、限次数重试、
	错误兜底

guardrails 里很典型的 validate → report → re-ask 模式
```
