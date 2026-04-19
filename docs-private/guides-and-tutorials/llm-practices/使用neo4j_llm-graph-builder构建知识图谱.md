# 使用 neo4j/llm-graph-builder 构建知识图谱

使用 neo4j/llm-graph-builder 构建知识图谱有两种方式：
1. 使用 Neo4j 提供的 在线服务 [The LLM Knowledge Graph Builder Application online application](https://llm-graph-builder.neo4jlabs.com/)
2. 本地部署 [neo4j/llm-graph-builder](https://github.com/neo4j-labs/llm-graph-builder)

---

## 1. 在线服务

Instance 连接信息
```text
URI: neo4j+s://0a775642.databases.neo4j.io
Instance: demo
Database: 0a775642
Username: 0a775642 
Password: zWVBp6JDym_Wtdc8hUPZWJo3xz79yzark-p2KBxoMYo
```

### 1.1 参考资料
+ 官方说明文档: [neo4j-labs/llm-graph-builder](https://neo4j.com/labs/genai-ecosystem/llm-graph-builder/)  
+ 官方 blog: [LLM Knowledge Graph Builder: From Zero to GraphRAG in Five Minutes](https://neo4j.com/blog/developer/graphrag-llm-knowledge-graph-builder/)

### 1.2 在线服务免费版的限制 ( *截止到2026.4.19日* )
+ 不支持 BYOM(Bring Your Own Model) ，可用的模型只有: Gemini 2.5-flash, OpenAI gpt-5-mini, Diffbot
+ Token 限量: Daily Tokens 250,000 + Monthly Tokens 1,000,000

### 1.3 使用指南 
1. 创建 Database: 登录 [neo4j-console](https://console.neo4j.io/) 在线创建 Instance 和 AuraDB Free Database，并记录连接信息
2. 登录 graph-builder: [llm-graph-builder](https://llm-graph-builder.neo4jlabs.com/) ，连接刚才创建的 Database
3. 上传文档: 点击左侧 "Upload files" 上传文件
4. 生成知识图谱: 点击右下 "Generate Graph" 生成知识图谱
5. 探索知识图谱: 点击右下侧 "Preview Graph / Explore Graph in Neo4j" 跳转到 [preview](https://workspace-preview.neo4j.io/workspace/query) 探索知识图谱

### 1.4 特点
+ 优点
  + 上手门槛极低
+ 缺点
  + 不支持 BYOM，能使用的模型少，限制了知识图谱效果的上限
  + 日/月 Token 使用量有限制
---

## 2. 本地部署
### 2.1 说明
#### 参考资料
+ [neo4j/llm-graph-builder - Github](https://github.com/neo4j-labs/llm-graph-builder)

### 2.2 使用指南 todo

### 2.3 特点
+ 优点：
  + 支持 BYOM，知识图谱效果的上限高
  + 没有 Token 量使用限制
+ 缺点
  + 上手门槛较高
  + 接入第三方模型可能会有费用

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
+ 支持 Schema 设置
+ 支持 Chunk 切分有关的设置
+ 能处理的文件格式: 
  + 本地文件: MS Office (docx, pptx, xls, xlsx), pdf, Images (jpeg, jpg, png, .svg), Text (.html, .txt , md)
  + Youtube
  + Wikipedia
  + Website
+ 在线服务支持的模型和 Token 量有限制，本地部署则限制较少

---

## 参考 
+ [neo4j-labs/llm-graph-builder](https://neo4j.com/labs/genai-ecosystem/llm-graph-builder/)  
+ [LLM Knowledge Graph Builder: From Zero to GraphRAG in Five Minutes](https://neo4j.com/blog/developer/graphrag-llm-knowledge-graph-builder/)
+ [neo4j/llm-graph-builder - Github](https://github.com/neo4j-labs/llm-graph-builder)
