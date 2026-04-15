## 1. Front Matter

Markdown 文件开头的 `---` 区域叫 Front Matter，用来配置标题、描述、侧边栏顺序、更新时间等页面元信息。

### 1.1 常用字段说明

- `title`：页面标题，通常必写。
- `description`：页面摘要，适合搜索结果和 SEO 展示。
- `slug`：自定义访问路径；不需要特殊路径时可以不写。
- `sidebar_label`：侧边栏里的显示名称；不写时默认使用 `title`。
- `sidebar_position`：控制同一目录下的侧边栏排序，数字越小越靠前。
- `tags`：文档标签，适合后续检索和主题聚合。
- `keywords`：搜索引擎关键词，按需填写。
- `last_update`：手动指定最后更新时间；不写时 Docusaurus 会尝试根据 Git 历史计算。
- `hide_title`：是否隐藏页面顶部标题。
- `hide_table_of_contents`：是否隐藏右侧目录。
- `pagination_prev` / `pagination_next`：控制底部上一篇 / 下一篇；写 `null` 表示关闭。

### 1.2 示例
```md
---
title: vLLM 部署指南
description: 记录 vLLM 的定位、常用启动参数、chat template 配置和部署注意事项。
slug: /tools-and-frameworks/deployment/vllm
sidebar_label: vLLM
sidebar_position: 1
tags: [vLLM, 推理框架, 模型部署, LLM]
keywords: [vLLM, LLM inference, chat template, 模型部署]
last_update:
  date: 2026-04-13
  author: dukai
hide_title: false
hide_table_of_contents: false
pagination_prev: null
pagination_next: null
---
```

---

## 2. Admonitions

Docusaurus 默认支持 Admonitions，不需要额外安装依赖。它本质上是 Markdown 里的提示框，适合标记结论、注意事项、风险和 TODO。  
渲染效果会是页面里的提示块，比普通段落更醒目。

### 2.1 语法
```md
:::type[title]
content
:::

```

### 2.2 写法示例

```md
:::tip 结论
KV Cache 在长上下文和高并发下会快速增长。
:::

:::warning 注意
只看模型权重显存是不够的，推理时还要估算 KV Cache 和运行时开销。
:::
```

### 2.3 类型

| 类型 | 含义 | 适合场景 | 你的 AI 日报里是否常用 |
|---|---|---|---|
| note | 说明、备注 | 普通补充说明、附加信息 | 常用 |
| info | 信息、导读 | 背景说明、栏目导语、焦点摘要 | 很常用 |
| tip | 提示、技巧 | 最佳实践、使用建议、小技巧 | 偶尔 |
| hint | 提示 | 和 tip 接近，更轻 | 偶尔 |
| important | 重要提醒 | 需要特别注意但不算风险警告 | 常用 |
| warning | 警告 | 有风险、有限制、容易踩坑 | 视内容而定 |
| caution | 谨慎提醒 | 比 warning 稍柔和，提醒谨慎 | 偶尔 |
| danger | 危险 | 高风险、不可逆、严重后果 | 很少 |
| error | 错误 | 报错说明、失败场景、异常状态 | 技术文档常见，日报少用 |
| success | 成功 | 操作完成、结果确认、正向状态 | 很少 |
| failure | 失败 | 失败结果、未通过、未完成 | 少见 |
| question | 问题 | FAQ、待确认问题、讨论点 | 少见 |
| abstract | 摘要 | 概览、概要、内容总结 | 可用于日报顶部 |
| summary | 总结 | 章节结论、段落收束 | 可用但不算主流 |
| quote | 引述 | 引用原话、编辑摘录 | 偶尔 |
| example | 示例 | 样例说明、案例展示 | 技术稿常用 |
