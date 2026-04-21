# 使用 neo4j/llm-graph-builder 构建知识图谱

使用 neo4j/llm-graph-builder 构建知识图谱有两种方式：
1. 在线服务 [The LLM Knowledge Graph Builder Application online application](https://llm-graph-builder.neo4jlabs.com/)
2. 本地部署 [neo4j/llm-graph-builder](https://github.com/neo4j-labs/llm-graph-builder)

---

## 1. 在线服务

credentials file
```text
NEO4J_URI=neo4j+s://0a775642.databases.neo4j.io
NEO4J_USERNAME=0a775642
NEO4J_PASSWORD=zWVBp6JDym_Wtdc8hUPZWJo3xz79yzark-p2KBxoMYo
NEO4J_DATABASE=0a775642
AURA_INSTANCEID=0a775642
AURA_INSTANCENAME=demo
```

### 1.1 参考资料
+ 官方说明文档: [neo4j-labs/llm-graph-builder](https://neo4j.com/labs/genai-ecosystem/llm-graph-builder/)  
+ 官方 blog: [LLM Knowledge Graph Builder: From Zero to GraphRAG in Five Minutes](https://neo4j.com/blog/developer/graphrag-llm-knowledge-graph-builder/)

### 1.2 在线服务免费版的限制 ( *截止到2026.4.19日* )
+ 不支持 BYOM(Bring Your Own Model) ，可用的模型只有: Gemini 2.5-flash, OpenAI gpt-5-mini, Diffbot
+ Token 限量: Daily Tokens 250,000 + Monthly Tokens 1,000,000

### 1.3 使用指南 
1. 创建 Database: 登录 [neo4j-console](https://console.neo4j.io/) 在线创建 Instance 和 AuraDB Free Database，并下载 credentials file
2. 登录 graph-builder: [llm-graph-builder](https://llm-graph-builder.neo4jlabs.com/) ，连接刚才创建的 Database
3. 上传文档: 点击左侧 "Upload files" 上传文件
4. 生成知识图谱: 点击右下 "Generate Graph" 生成知识图谱
5. 探索知识图谱: 点击右下侧 "Preview Graph / Explore Graph in Neo4j" 跳转到工作台 [preview](https://workspace-preview.neo4j.io/workspace/query) 探索知识图谱

### 1.4 特点
+ 优点
  + 上手门槛极低
+ 缺点
  + 不支持 BYOM(Bring Your Own Model)，能使用的模型少，限制了知识图谱效果的上限
  + 日/月 Token 使用量有限制，限制了知识图谱生成的效率
---

## 2. 本地部署
### 2.1 参考资料
+ [neo4j/llm-graph-builder - Github](https://github.com/neo4j-labs/llm-graph-builder)

### 2.2 使用指南
clone 项目 -> 安装依赖 & 配置环境变量等 -> 启动前后端
```bash
# clone
git clone https://github.com/neo4j-labs/llm-graph-builder.git
cd llm-graph-builder

# start backend
cd ./backend
cp example.env .env # 配置 .env 文件
uv init
uv venv
uv pip install -r requirements.txt -c constraints.txt
uv run uvicorn score:app --reload # http://127.0.0.1:8000/docs

# start frontend
cd ./frontend
cp example.env .env # 配置 .env 文件
yarn
yarn run dev # http://localhost:5173/
```

### 2.3 特点
+ 优点：
  + 支持 BYOM(Bring Your Own Model)，知识图谱效果的上限高
  + 没有 Token 量使用限制(这里可以设置)
+ 缺点
  + 上手门槛较高
  + 接入第三方模型可能会产生费用

### 2.4 注意事项
- Neo4j credentials file 中可能写的是 `NEO4J_URI=neo4j+s`。如果本地连接时报 TLS/证书校验问题，可以在网页上临时使用 `neo4j+ssc`；生产环境优先修证书链并使用 `neo4j+s`。
- 如果不配置 token tracker DB，请设置 `./backend/.env` 中 `TRACK_USER_USAGE="false"`。
- 使用 OpenAI-compatible base URL models:
  - `./frontend/.env` 中配置前端模型名，例如：`VITE_LLM_MODELS="diffbot,openai_gpt_5.2,openai_gpt_5_mini,gemini_2.5_flash,glm_4.7"`
  - `./backend/.env` 中配置： `LLM_MODEL_CONFIG_GLM_4_7="glm-4.7,base_url,api_key"`
  - 后端变量名规则：`LLM_MODEL_CONFIG_` + 前端模型名大写 + `.` 替换为 `_`。
  - 自定义模型名不要包含 `openai`，否则会走官方 OpenAI 分支。
  - 建议修改 `llm.py`，让 OpenAI-compatible base URL models 跳过 structured output，走 `LLMGraphTransformer` 普通解析路径。
- 如果默认 embedding 报 `all-MiniLM-L6-v2 is not a valid model identifier`，需要修改 `common_fn.py` 补全 HuggingFace ID：`sentence-transformers/all-MiniLM-L6-v2`，或直接在 `.env` 中配置完整 embedding model。
- 如果并发太高导致模型请求达到上限，可以配置：
  - `UPDATE_GRAPH_CHUNKS_PROCESSED="1"`
  - `VITE_CHUNK_TO_COMBINE=5`
- 应用中提示 `Large files may be partially processed up to 10K characters due to resource limit`，表示大文件可能只处理部分内容；可以通过设置 `MAX_TOKEN_CHUNK_SIZE` 调整，但调大后会增加 token、耗时和失败概率。
- `/extract` 失败后，本地文件可能会从 `backend/merged_files/` 删除。修复配置后如果继续失败为 `File xxx does not exist`，需要重新上传文件或恢复该文件。
- 修改 `backend/.env` 后重启后端；修改 `frontend/.env` 后重启前端并刷新浏览器。

---

## 3. 工作原理
+ Uploaded Sources are stored as Document nodes in the graph
+ Each document (type) is loaded with the LangChain Loaders
+ The content is split into Chunks
+ Chunks are stored in the graph and connected to the Document and to each other for advanced RAG patterns
+ Highly similar Chunks are connected with a SIMILAR relationship to form a kNN Graph
+ Embeddings are computed and stored in the Chunks and Vector index
+ Using the llm-graph-transformer or diffbot-graph-transformer entities and relationships are extracted from the text
+ Entities and relationships are stored in the graph and connected to the originating Chunks

---

## 4, 特点与边界
+ 属于 Neo4j 生态，与 Neo4j 适配极好: 生成的图谱直接放入 Neo4j 图数据库中，方便使用
+ 图谱的 Schema 支持人工设置
+ 支持 Chunk 切分有关的设置
+ 能处理的数据源和文件格式很多: 
  + 本地文件: MS Office (docx, pptx, xls, xlsx), pdf, Images (jpeg, jpg, png, .svg), Text (.html, .txt , md)
  + Youtube
  + Wikipedia
  + Website
+ 在线服务支持的模型和 Token 量有限；本地部署则限制较少(支持BYOM等)

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


```text
Qwen3.5-27B,http://36.129.25.244:8000,sia.2026-03-23 --SSH转发--> Qwen3.5-27B,http://47.105.98.183:8000,sia.2026-03-23
```

cypher 查询
```cypher
# 可以先设置一下 :style 为不同的 node 设置不同的颜色
MATCH (n:Nutrient)-[r]-(m)
WHERE
  NOT n:Chunk
  AND NOT m:Chunk
  AND any(label IN labels(m) WHERE label IN [
    "Food", "Animal", "Effect", "Material",
    "Ingredient", "Disease", "Benefit", "Function"
  ])
RETURN n, r, m
LIMIT 30;
```

---

## 参考 
#### 构建知识图谱
+ [neo4j-labs/llm-graph-builder](https://neo4j.com/labs/genai-ecosystem/llm-graph-builder/)  
+ [LLM Knowledge Graph Builder: From Zero to GraphRAG in Five Minutes](https://neo4j.com/blog/developer/graphrag-llm-knowledge-graph-builder/)
+ [neo4j/llm-graph-builder - Github](https://github.com/neo4j-labs/llm-graph-builder)
#### RAG 中使用neo4j
+ [user_guide_rag - neo4j](https://neo4j.com/docs/neo4j-graphrag-python/current/user_guide_rag.html)
+ [ToolsRetriever - neo4j](https://neo4j.com/docs/neo4j-graphrag-python/current/api.html)
#### 数据源
+ [动物营养学报](https://www.chinajan.com/CN/home)
+ [营养学报](https://manu37.magtech.com.cn/yyxb/CN/top_download)
