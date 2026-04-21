---
title: 使用 neo4j/llm-graph-builder 构建知识图谱
tags: [知识图谱, neo4j, neo4j/llm-graph-builder]
description: 使用 neo4j/llm-graph-builder 构建知识图谱
sidebar_position: 3
last_update:
  date: 2026-04-21
---

# 使用 neo4j/llm-graph-builder 构建知识图谱

:::tip[内容]
1. neo4j/llm-graph-builder 的 2 种使用方式。
2. 各方式的使用指南与特点。
3. 工作原理、边界与特点、使用建议、最佳实践。
:::

使用 `neo4j/llm-graph-builder` 构建知识图谱，通常有两种方式：

1. 在线服务 - [The LLM Knowledge Graph Builder Application online application](https://llm-graph-builder.neo4jlabs.com/)
2. 本地部署 - [neo4j/llm-graph-builder - GitHub](https://github.com/neo4j-labs/llm-graph-builder)

---

## 1. 在线服务

### 1.1 参考资料

+ 官方说明文档: [neo4j-labs/llm-graph-builder](https://neo4j.com/labs/genai-ecosystem/llm-graph-builder/)
+ 官方 Blog: [LLM Knowledge Graph Builder: From Zero to GraphRAG in Five Minutes](https://neo4j.com/blog/developer/graphrag-llm-knowledge-graph-builder/)

### 1.2 在线服务免费版的限制

以 2026-04-19 的界面信息为例：

+ 不支持 BYOM（Bring Your Own Model），可用模型较少
+ Token 配额有限

这类限制会变动，实际以官方界面和文档为准。

### 1.3 使用指南

1. 创建数据库：登录 [neo4j console](https://console.neo4j.io/) 创建 Instance 和 AuraDB Free Database，并下载 credentials file。
2. 登录 graph-builder：打开 [llm-graph-builder](https://llm-graph-builder.neo4jlabs.com/)，连接刚才创建的数据库。
3. 上传文档：点击左侧 `Upload files` 上传文件。
4. 生成知识图谱：点击右下 `Generate Graph`。
5. 探索知识图谱：点击右下 `Preview Graph / Explore Graph in Neo4j` 跳转到 Neo4j 工作台查看图谱。

### 1.4 特点

+ 优点
  + 上手门槛低
+ 缺点
  + 不支持 BYOM，可用模型较少
  + 免费版 Token 配额有限

---

## 2. 本地部署

### 2.1 参考资料

+ [neo4j/llm-graph-builder - GitHub](https://github.com/neo4j-labs/llm-graph-builder)

### 2.2 使用指南

整体流程是：克隆项目 -> 安装依赖 -> 配置环境变量 -> 启动前后端。

```bash
# clone
git clone https://github.com/neo4j-labs/llm-graph-builder.git
cd llm-graph-builder

# start backend
cd ./backend
cp example.env .env
uv init
uv venv
uv pip install -r requirements.txt -c constraints.txt
uv run uvicorn score:app --reload

# start frontend
cd ./frontend
cp example.env .env
yarn
yarn run dev
```

### 2.3 特点

+ 优点
  + 支持 BYOM，图谱效果上限更高
  + 没有在线免费版那样严格的 Token 配额限制
+ 缺点
  + 上手门槛较高
  + 接入第三方模型通常会产生额外费用

### 2.4 注意事项

- Neo4j credentials file 中可能写的是 `NEO4J_URI=neo4j+s`。如果本地连接时报 TLS/证书校验问题，可以在测试环境临时使用 `neo4j+ssc`；生产环境优先修复证书链并使用 `neo4j+s`。
- 如果不配置 token tracker DB，可以在 `./backend/.env` 中将 `TRACK_USER_USAGE="false"`。
- 使用 OpenAI-compatible base URL models 时：
  - `./frontend/.env` 中配置前端模型名，例如：`VITE_LLM_MODELS="diffbot,openai_gpt_5_mini,gemini_2.5_flash,custom_model"`
  - `./backend/.env` 中配置：`LLM_MODEL_CONFIG_CUSTOM_MODEL="model_name,<base-url>,<api-key>"`
  - 后端变量名规则：`LLM_MODEL_CONFIG_` + 前端模型名大写 + `.` 替换为 `_`
  - 自定义模型名不要包含 `openai`，否则会走官方 OpenAI 分支
  - 如需兼容某些 OpenAI-compatible 模型，可考虑让它们跳过 structured output，走普通解析路径
- 如果默认 embedding 报 `all-MiniLM-L6-v2 is not a valid model identifier`，可改为完整 HuggingFace ID：`sentence-transformers/all-MiniLM-L6-v2`，或在 `.env` 中直接配置完整 embedding model。
- 如果并发过高导致模型请求达到上限，可以尝试：
  - `UPDATE_GRAPH_CHUNKS_PROCESSED="1"`
  - `VITE_CHUNK_TO_COMBINE=5`
- 如果应用提示 `Large files may be partially processed up to 10K characters due to resource limit`，表示大文件可能只处理部分内容；可以通过设置 `MAX_TOKEN_CHUNK_SIZE` 调整，但调大后会增加 token、耗时和失败概率。
- `/extract` 失败后，本地文件可能会从 `backend/merged_files/` 删除。修复配置后如果继续失败为 `File xxx does not exist`，通常需要重新上传文件或恢复该文件。
- 修改 `backend/.env` 后需要重启后端；修改 `frontend/.env` 后需要重启前端并刷新浏览器。

---

## 3. 工作原理

+ 上传的源文件以节点 `Document` 的形式存储在图中。
+ 每个文档都使用 LangChain 加载器加载。
+ 内容被分割成 chunks。
+ chunks 存储在图中，并与文档以及彼此之间连接，以支持高级 RAG 模式。
+ 高度相似的块通过 `SIMILAR` 关系连接，形成 kNN 图。
+ 计算 Embeddings 并将其存储在 chunks 和向量索引中。
+ 使用 `llm-graph-transformer` 或 `diffbot-graph-transformer`，从文本中提取实体和关系。
+ 实体和关系存储在图中，并与原始 chunks 连接。


---

## 4. 特点与边界

+ 属于 Neo4j 生态，与 Neo4j 适配较好：生成的图谱直接存入 Neo4j 图数据库
+ 图谱的 Schema 支持人工设置
+ 支持 Chunk 切分相关设置
+ 能处理的数据源和文件格式较多：
  + 本地文件：MS Office（`docx`、`pptx`、`xls`、`xlsx`）、PDF、图片（`jpeg`、`jpg`、`png`、`svg`）、文本（`html`、`txt`、`md`）
  + YouTube
  + Wikipedia
  + Website
+ 在线服务支持的模型和 Token 配额有限；本地部署限制较少

---

## 5. 使用建议

+ 使用 **在线服务** 免费来体验 UI 与工作流程。
+ **本地部署服务** 配合接入第三方模型体验生成效率与效果。
+ 生产上使用 **本地部署服务 + 本地部署小模型** 降低使用成本。

---

## 6. 最佳实践

**本地部署 llm-graph-builder 服务 + 本地部署小模型**
+ 按 "### 2.2 使用指南" 中的内容部署llm-graph-builder 服务
+ 接入模型: 在 `./frontend/.env` 和 `./backend/.env` 中配置自定义模型的 `<name>,<base_url>,<api_key>`
+ 将 `UPDATE_GRAPH_CHUNKS_PROCESSED` 和 `VITE_CHUNK_TO_COMBINE` 中的值设置大一些
+ 上传文档并生成图谱

---

## 参考

#### 构建知识图谱
+ [neo4j-labs/llm-graph-builder](https://neo4j.com/labs/genai-ecosystem/llm-graph-builder/)  
+ [LLM Knowledge Graph Builder: From Zero to GraphRAG in Five Minutes](https://neo4j.com/blog/developer/graphrag-llm-knowledge-graph-builder/)
+ [neo4j/llm-graph-builder - Github](https://github.com/neo4j-labs/llm-graph-builder)
#### RAG 中使用neo4j
+ [user_guide_rag - neo4j](https://neo4j.com/docs/neo4j-graphrag-python/current/user_guide_rag.html)
+ [ToolsRetriever - neo4j](https://neo4j.com/docs/neo4j-graphrag-python/current/api.html)
