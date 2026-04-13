---
title: HiClaw
tags: [Agent, 龙虾]
description: 类龙虾Agent HiClaw。
last_update:
  date: 2026-04-13
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# HiClaw
HiClaw 是一个开源的协作式多智能体运行平台。让多个 Agent 在一个受控、可审计的房间中协作，人类全程可见、随时可介入。   
采用 Manager-Workers 架构，Manager 统一调度多个 Workers，专注于企业内的人和 Agent、Agents 之间的协作场景。  
HiClaw 并不和其他 xxClaw 对标，自己不实现 Agent 逻辑，而是编排和管理多个 Agent 容器（Manager 和众多 Workers）。  
加速实现 OPOC（一人一公司）和企业数字员工。

##  为什么选 HiClaw
+ 企业级安全：Worker 永远不持有真实的 API Key 或 GitHub PAT，只有一个消费者令牌（类似"工牌"）。即使 Worker 被攻击，攻击者也拿不到任何真实凭证。
+ 多 Agent 群聊网络：Manager Agent 智能分解任务，协调多个 Worker Agent 并行执行，大幅提升复杂任务处理能力。
+ Matrix 协议驱动：基于开放的 Matrix IM 协议，所有 Agent 通信透明可审计，天然支持分布式部署和联邦通信。
+ 人工全程监督：人类可随时进入任意 Matrix 房间观察 Agent 对话，实时干预或修正 Agent 行为，确保安全可控。
+ 真正开箱即用的 IM：内置 Matrix 服务器，不需要申请飞书/钉钉机器人，不需要等待审批。浏览器打开 Element Web 就能对话，或者用手机上的 Matrix 客户端（Element、FluffyChat）随时指挥，iOS、Android、Web 全平台支持。
+ Manager-Worker 架构：清晰的 Manager-Worker 两层架构，职责分明，易于扩展自定义 Worker Agent 以适应不同场景，支持纳管 Copaw、NanoClaw、ZeroClaw 或是企业自建的 Agent
+ 一条命令启动：一个 curl | bash 搞定所有组件 — Higress AI 网关、Matrix 服务器、文件存储、Web 客户端和 Manager Agent 本身。
+ 技能生态：Worker 可以按需从 skills.sh 获取技能（社区已有 80,000+ 个）。因为 Worker 本身就拿不到真实凭证，所以可以放心使用公开技能库。

## 安装与启动
前置条件: Docker Desktop（Windows/macOS）或 Docker Engine（Linux）。

<Tabs>
<TabItem value="linux" label="MacOS/ Linux">

```bash
bash <(curl -sSL https://higress.ai/hiclaw/install.sh)
```

</TabItem>

<TabItem value="windows" label="Windows PowerShell 7+">

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://higress.ai/hiclaw/install.ps1'))
```

</TabItem>
</Tabs>



## 参考
+ [HiClaw - github](https://github.com/agentscope-ai/HiClaw/)
+ [hiclaw.io](https://hiclaw.io/)
