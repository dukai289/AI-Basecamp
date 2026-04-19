# AI-Basecamp

`AI-Basecamp` 是一个基于 `Docusaurus` 的 AI 内容站点，分为 "changelog"、"资讯" 和 "知识库" 三部分。

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
├── docs-private/            # 私人笔记(未脱敏)
├── docs/                    # `知识库`文档
├── blog/                    # `资讯`
├── src/pages/               # 独立页面，例如 `Changelog` 和 `About`
├── info                     # 项目其它信息
│   ├── prompts              # 一些项目开发时使用的prompts
│   ├── Docusaurus知识.md     # Docusaurus的知识与注意事项
│   └── todo.md              # 项目todo事项
├── content-ops/             # 内容生产、发布检查、提示词和工作流
│   ├── templates/           # 写作模板，不参与站点渲染
│   ├── checklists/          # 发布前检查清单，例如脱敏检查
│   ├── prompts/             # 内容生产相关提示词
│   └── workflows/           # 内容生产和发布工作流
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

- `docs-private/`：私人笔记，未脱敏
- `src/pages/changelog.md`：`changelog`，记录站点内容、结构和配置变更，访问路径为 `/changelog`
- `blog/`：`资讯`，记录 AI 行业动态、产品发布、重要论文和产业政策，访问路径为 `/blog`
- `content-ops/templates/ai-news-newsletter.md`：AI 动态 / Newsletter 写作模板，不会被 Docusaurus 渲染为页面
- `content-ops/checklists/desensitization.md`：公开发布前的脱敏检查模板
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
