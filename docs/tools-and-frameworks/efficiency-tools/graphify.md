---
title: Agent Skill/graphify
tags: [graphify, 知识图谱]
description: 任何输入 → 知识图谱 → 聚类社区 → HTML + JSON + 审计报告
sidebar_position: 2
---

# graphify

## 1. 介绍
**一个面向 AI 编码助手的 Skill。**    

在 Claude Code、Codex、OpenCode 等 Agent中输入 `/graphify`，它会读取你的文件构建知识图谱，把原本不明显的结构关系交给你。让你更快理解代码库，找到架构决策背后的"为什么"。

支持多模态: 代码、PDF、Markdown、截图、流程图、白板照片等 — graphify 会用 Claude vision 从这些内容中提取概念和关系，并把它们连接到同一张图里。

Andrej Karpathy 会维护一个 `/raw` 文件夹，把论文、推文、截图和笔记都丢进去。  
graphify 就是在解决这类问题 —— 相比直接读取原始文件，每次查询的 token 消耗可降低 **71.5 倍**，结果还能跨会话持久保存，并且会明确区分哪些内容是实际发现的，哪些只是合理推断。

只需要简单的命令
```bash
/graphify .                        # 可用于任意目录：代码库、笔记、论文都可以
```

即可生成
```text
graphify-out/
├── graph.html       可交互图谱：可点节点、搜索、按社区过滤
├── GRAPH_REPORT.md  God nodes、意外连接、建议提问
├── graph.json       持久化图谱：数周后仍可查询，无需重新读原始文件
└── cache/           SHA256 缓存：重复运行时只处理变更过的文件
```
---

## 2. 工作原理
graphify 分两轮执行:   
第一轮是确定性的 AST 提取，对代码文件做结构分析（类、函数、导入、调用图、docstring、解释性注释），这一轮不需要 LLM。  
第二轮会并行调用 Claude 子代理处理文档、论文和图片，从中提取概念、关系和设计动机。  
最后把两边结果合并到一个 NetworkX 图里，用 Leiden 社区发现算法做聚类，并导出成可交互 HTML、可查询 JSON，以及一份人类可读的审计报告。

聚类是基于图拓扑完成的，不依赖 embeddings。 Leiden 按边密度发现社区。Claude 抽取出的语义相似边（semantically_similar_to，标记为 INFERRED）本来就存在于图中，所以会直接影响社区划分。图结构本身就是相似性信号，不需要额外的 embedding 步骤，也不需要向量数据库。

每条关系都会被标记为 EXTRACTED（直接在源材料中找到）、INFERRED（合理推断，并附带置信度分数）或 AMBIGUOUS（有歧义，需要复核）。  
所以你始终知道哪些是实际发现的，哪些是模型猜出来的。

---
## 3. 安装与使用
### 3.1 安装
```bash
uv tool install graphifyy
```
### 3.2 配置
为不同的 Agent 配置这个 skill
```bash
graphify install # claude code
graphify install --platform codex #  codex
graphify install --platform opencode # opencode
```

### 3.3 使用

为当前项目构建图
```bash
/graphify                          # 对当前目录运行
# /graphify ./raw --neo4j            # 生成给 Neo4j 用的 cypher.txt
```

在图构建完成后，使用下面的命令可以让 graphify 开启常驻模型 (常驻 hook 会优先暴露 GRAPH_REPORT.md, 让 Agent 总是使用图)
```bash
graphify claude install # claude code
graphify codex install #  codex
graphify opencode install # opencode
```

---

## 4. 实用指南
### 4.1 常见命令

graphify 有两类入口：一种是在 Agent 里输入的 `/graphify`，另一种是在终端里执行的 `graphify` CLI。两者不要混用。

| 场景 | 命令 | 说明 |
| --- | --- | --- |
| 在 Agent 中完整构建图谱 | `/graphify .` | 让 AI 助手按 skill 工作流处理当前目录 |
| 更新当前项目图谱 | `graphify update .` | 重新提取代码文件并更新 `graphify-out/graph.json`，不需要 LLM |
| 持续监听代码变化 | `graphify watch .` | 监听目录，代码变化后自动重建图谱 |
| 查询图谱 | `graphify query "问题"` | 从 `graphify-out/graph.json` 中按问题遍历相关节点 |
| 深度追踪某个问题 | `graphify query "问题" --dfs` | 使用 DFS，更适合追一条依赖链或因果链 |
| 控制查询输出长度 | `graphify query "问题" --budget 1500` | 限制回答上下文大小，避免输出过长 |
| 查看两个概念之间的路径 | `graphify path "A" "B"` | 查找两个节点之间的最短路径 |
| 解释某个节点 | `graphify explain "节点名"` | 输出节点及其相邻关系的说明 |
| 重新聚类已有图谱 | `graphify cluster-only graphify-out` | 不重新抽取文件，只基于已有图谱重新生成社区和报告 |
| 安装 Codex 集成 | `graphify codex install` | 向 `AGENTS.md` 写入 graphify 说明，让 Codex 优先参考图谱 |
| 查看帮助 | `graphify --help` | 查看当前 CLI 支持的真实命令 |

### 4.2 常见输出

| 文件 | 用途 |
| --- | --- |
| `graphify-out/graph.json` | 持久化图谱数据，供 query/path/explain 使用 |
| `graphify-out/GRAPH_REPORT.md` | 图谱报告，包含关键节点、社区和建议问题 |
| `graphify-out/graph.html` | 可交互图谱页面 |

### 4.3 使用技巧

- `/graphify .` 是 Agent 指令，不是 PowerShell / Bash 命令；终端里应使用 `graphify update .`、`graphify query` 等 CLI 命令。
- 日常代码或配置改动后，优先用 `graphify update .`，速度快，也不会触发完整语义抽取。
- 想理解项目结构时，先看 `graphify-out/GRAPH_REPORT.md`，再用 `graphify query` 追问。
- 查询两个概念的关系时，用 `graphify path "A" "B"` 比直接全文搜索更适合。

---

## 参考
+ [graphify.net](https://graphify.net/)
+ [safishamsi/graphify - Github](https://github.com/safishamsi/graphify)
