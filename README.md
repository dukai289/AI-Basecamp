# AI-Basecamp

`AI-Basecamp` 是一个基于 `Docusaurus` 的 AI 内容站点，分为 "动态"、"资讯" 和 "知识库" 三部分。

## 1. 开发

### 1.1 安装依赖

```bash
npm install
```

### 1.2 启动本地站点（源码启动）：

```bash
npm run start -- --host 0.0.0.0 --port 3001
```

### 1.3 构建与预览

```bash
npm run build
npm run serve
```

---

## 2. 目录结构

```text
AI-Basecamp/
├── docs-private/            # 私人笔记(未脱敏的)
├── docs/                    # `知识库`文档
├── blog/                    # `资讯`
├── src/pages/               # 独立页面，例如`动态`
├── info                     # 项目其它信息: 存放如 prompt 记录、todo文件等
│   ├── prompts              # 一些项目开发时使用的prompts
│   ├── Docusaurus知识.md     # Docusaurus的知识与注意事项
│   └── todo.md              # 项目todo事项
├── templates/               # 写作模板，不参与站点渲染
├── static/                  # Docusaurus 静态资源
│   └── img/                 # 图片等
├── src/css/custom.css       # 站点样式覆盖
├── docusaurus.config.js     # Docusaurus 配置
├── sidebars.js              # 侧边栏配置
├── package.json             # 前端依赖和脚本
└── README.md
```

---

## 3. 内容维护

主要内容放在 `docs/`、`blog/` 和 `src/pages/` 下：

- `src/pages/site-updates.md`：`动态`，记录站点内容、结构和配置变更，访问路径为 `/site-updates`
- `blog/`：`资讯`，记录 AI 行业动态、产品发布、重要论文和产业政策，访问路径为 `/blog`
- `templates/ai-news-newsletter.md`：AI 动态 / Newsletter 写作模板，不会被 Docusaurus 渲染为页面
- `docs/intro.md`：全站默认页
- `docs/knowledge-base.md`：`知识库`默认页
  - `docs/knowledge/`：知识体系
  - `docs/guides-and-tutorials/`：教程与指南
  - `docs/model-reviews/`：模型评测
  - `docs/tools-and-frameworks/`：工具与框架
  - `docs/methods/`：方法论
  - `docs/resources/`：资源

---

## 4. 运维相关
+ nginx: `ops\nginx` -> `ai-basecamp.sparkhub.space`
+ CICD: `ops\cron` -> `git pull & npm run build + goaccess` 定时自动化
+ 网站统计 `goaccess` + `apache2-utils` + `ops\cron` -> `build\admin\report_goaccess.html` 定时生成报告 + 访问认证

---
