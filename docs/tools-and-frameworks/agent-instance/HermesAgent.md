---
title: Hermes Agent
tags: [Hermes Agent, Agent开发]
description: Hermes Agent的安装、配置、使用技巧等。
last_update:
  date: 2026-04-16
---

# Hermes Agent

## 1. 安装、配置与启动
在 Linux / MacOS / WSL 中安装:
```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
source ~/.bashrc
```

配置
```bash
# set up
hermes model       # 配置模型
hermes tools       # 配置开启的工具
hermes setup       # 进行所有配置
```

启动
```bash
# 启动 CLI
hermes 

# 启动 Web Dashboard
hermes dashboard --host 0.0.0.0 --port 8080 
```

---

## 2. 使用技巧



## 参考
+ [Hermes Agent 官方网站](https://hermes-agent.nousresearch.com/docs/)
+ [NousResearch/hermes-agent - Github](https://github.com/NousResearch/hermes-agent)
