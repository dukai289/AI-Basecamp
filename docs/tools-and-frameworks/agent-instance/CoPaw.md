---
title: CoPaw
sidebar_position: 4
tags: [Agent, 龙虾]
description: 类龙虾Agent CoPaw, AgentScope团队开发。
last_update:
  date: 2026-04-13
---

# CoPaw

## 介绍
个人助理型产品，部署在你自己的环境中。  
由 `AgentScope` 团队 基于 `AgentScope`、 `AgentScope Runtime` 与 `ReMe` 构建。
+ 多通道对话 — 通过钉钉、飞书、Discord、Telegram 等与你对话。
+ 多智能体协作 — 支持创建多个独立智能体，每个智能体拥有独立配置、记忆和技能， 还可以通过协作技能互相通信、共同完成复杂任务。
+ 定时执行 — 按你的配置自动运行任务。
+ 能力由 Skills 决定，有无限可能 — 内置定时任务、PDF 与表单、Word/Excel/PPT 文档处理、新闻摘要、文件阅读等，还可在 Skills 中自定义扩展。
+ 支持本地模型 — 支持本地运行大模型，无需 API Key，完全离线工作。
+ 数据全在本地 — 不依赖第三方托管。
+ 多层安全防护 — 内置工具防护、文件访问控制、技能安全扫描等机制，保障运行安全。

## 安装与启动
```bash
# 安装
uv tool install copaw
uv tool list
uv tool dir --bin # 将这个目录加入环境变量
uv tool update-shell

# 初始化配置
copaw init --defaults

# 启动
copaw app  # 访问控制台 http://127.0.0.1:8088/ 
```

## 参考
+ [CoPaw](https://copaw.agentscope.io/)
+ [CoPaw - github](https://github.com/agentscope-ai/CoPaw)
