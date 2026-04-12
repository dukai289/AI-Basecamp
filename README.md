# AI-Basecamp

`AI-Basecamp` 是一个基于 `Docusaurus` 的 AI 内容站点，分为 `AI 动态` 和 `AI 知识库` 两部分。

## 本地开发

安装依赖：

```bash
npm install
```

启动本地站点（源码启动）：

```bash
npm.cmd run start -- --host 0.0.0.0 --port 3000 --no-open
```

构建与预览：

```bash
npm.cmd run build
npm.cmd run serve
```


## 目录结构

```text
AI-Basecamp/
├── docs/                    # AI 动态和 AI 知识库文档
├── static/                  # Docusaurus 静态资源
│   └── img/                 # 图片等
├── src/css/custom.css       # 站点样式覆盖
├── docusaurus.config.js     # Docusaurus 配置
├── sidebars.js              # 侧边栏配置
├── package.json             # 前端依赖和脚本
└── README.md
```

## 内容维护

主要内容放在 `docs/` 下：

- `docs/news/`：AI 动态
- `docs/knowledge/`：知识体系
- `docs/guides-and-tutorials/`：教程与指南
- `docs/model-reviews/`：模型评测
- `docs/tools-and-frameworks/`：工具与框架
- `docs/methods/`：方法论
- `docs/resources/`：资源

新增文档时直接在对应目录下创建 Markdown 文件即可。
