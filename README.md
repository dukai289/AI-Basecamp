# AI-Basecamp

`AI-Basecamp` 是一个基于 `Docusaurus` 的 AI 内容站点，分为 `动态`、`资讯` 和 `知识库` 三部分。

## 本地开发

安装依赖：

```bash
npm install
```

启动本地站点（源码启动）：

```bash
npm run start -- --host 0.0.0.0 --port 3000
```

构建与预览：

```bash
npm run build
npm run serve
```


## 目录结构

```text
AI-Basecamp/
├── docs/                    # 动态和知识库文档
├── blog/                    # 资讯
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

- `blog/`：资讯，记录 AI 行业动态、产品发布、重要论文和产业政策，访问路径为 `/blog`
- `docs/site-updates/index.md`：动态，记录站点内容、结构和配置变更
- `docs/knowledge-base/index.md`：知识库默认页
- `docs/knowledge/`：知识体系
- `docs/guides-and-tutorials/`：教程与指南
- `docs/model-reviews/`：模型评测
- `docs/tools-and-frameworks/`：工具与框架
- `docs/methods/`：方法论
- `docs/resources/`：资源

## Admonitions

Docusaurus 默认支持 Admonitions，不需要额外安装依赖。它本质上是 Markdown 里的提示框，适合标记结论、注意事项、风险和 TODO。

写法示例：

```md
:::tip 结论
KV Cache 在长上下文和高并发下会快速增长。
:::

:::warning 注意
只看模型权重显存是不够的，推理时还要估算 KV Cache 和运行时开销。
:::
```

渲染效果会是页面里的提示块，比普通段落更醒目。
