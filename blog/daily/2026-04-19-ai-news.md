---
title: 2026-04-19 AI 动态
# authors: [ai-basecamp]
tags: [Claude Opus 4.7, Claude Design, Codex, GR00T N1.7, Grok STT, Cerebras, AI Mode]
description: 2026-04-19 AI 动态，覆盖 Claude Opus 4.7、Claude Design、Codex、GR00T N1.7、Grok 语音 API、OpenAI 与 Cerebras 算力合作等信息。
hide_table_of_contents: true
---

# 2026-04-19 AI 动态

:::info **本期焦点**  
1. Anthropic 发布 Claude Opus 4.7，并用它驱动 Claude Design。  
2. OpenAI Codex 升级为更完整的桌面工作流 Agent。  
3. NVIDIA 在 Hugging Face 发布 Isaac GR00T N1.7 机器人 VLA 模型。  
4. xAI 推出 Grok Speech to Text / Text to Speech API。  
5. OpenAI 与 Cerebras 被曝扩大至超 200 亿美元算力合作。  
:::

<!-- truncate -->

---

## 📰 头条要闻

### Anthropic 双线更新：Claude Opus 4.7 与 Claude Design

Anthropic 4 月 16 日发布 Claude Opus 4.7，称其在高级软件工程、长周期任务、视觉理解、文档和演示稿生成等方面较 Opus 4.6 有明显提升。该模型已在 Claude 产品、Anthropic API、Amazon Bedrock、Google Cloud Vertex AI 和 Microsoft Foundry 上提供，开发者可使用 `claude-opus-4-7`，定价维持每百万输入 token 5 美元、每百万输出 token 25 美元。

4 月 17 日，Anthropic 又推出 Claude Design。它是 Anthropic Labs 的研究预览产品，面向设计稿、原型、幻灯片、one-pager 和营销物料等视觉产出场景。用户可以用自然语言描述需求，再通过对话、行内评论、直接编辑或 Claude 生成的调节控件继续修改；企业团队还可以让 Claude 读取代码库和设计文件，生成并套用团队设计系统。

这两条更新合在一起看，Anthropic 正在把 Claude 从“对话 / 写代码模型”推向更完整的工作产物交付：代码、文档、幻灯片、原型和设计系统开始在同一套模型能力里汇合。

[citation:Anthropic Claude Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7) · [citation:Anthropic Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs) · [citation:新浪 AI 热点小时报](https://k.sina.com.cn/article_7857201856_1d45362c001904fv1c.html?from=tech)

---

### OpenAI Codex 变成“几乎什么都能做”的开发桌面 Agent

OpenAI 4 月 16 日发布 Codex 重大更新，称 Codex 已有超过 300 万周活跃开发者。新版 Codex 可以操作用户电脑上的应用，使用自己的光标看屏幕、点击、输入；也可以生成图像、记住偏好、学习历史操作，并处理持续性和可重复工作。

这次更新把 Codex 从“写代码工具”进一步推向“软件开发生命周期工作台”：它增强了 PR review、多文件和多终端查看、SSH 连接远程 devbox、内置浏览器、前端和游戏迭代等能力。OpenAI 对外表达的方向很明确：开发者不只是让模型补全代码，而是在监督多个 Agent 跨工具、跨应用、跨天执行任务。

对开发工具生态来说，Codex 与 Claude Code / Claude Design 的竞争会继续拉高“Agent 工具”的产品标准：本地上下文、屏幕操作、长任务、记忆、插件、沙箱和权限控制都变成关键能力。

[citation:OpenAI](https://openai.com/index/codex-for-almost-everything/) · [citation:The Verge](https://www.theverge.com/ai-artificial-intelligence/913034/openai-codex-updates-use-macos)

---

## 🚀 模型与产品更新

### Claude Opus 4.7

| 指标 | 数据 |
| --- | --- |
| 发布时间 | 2026-04-16 |
| 模型名称 | `claude-opus-4-7` |
| 重点能力 | 高级软件工程、长周期 Agent 任务、高分辨率视觉、文档 / 幻灯片 / 界面生成 |
| 上下文窗口 | Anthropic Claude Opus 页面标注 1M context window |
| 访问方式 | Claude 产品、Anthropic API、Amazon Bedrock、Google Cloud Vertex AI、Microsoft Foundry |
| API 价格 | 输入 5 美元 / 百万 token，输出 25 美元 / 百万 token |
| 安全策略 | 加入高风险网络安全用途检测与拦截；安全专业人员可申请 Cyber Verification Program |

需要注意的是，Anthropic 同时承认 Opus 4.7 仍弱于受限发布的 Claude Mythos Preview。中文媒体也跟进了用户对 token 消耗、风格变化和模型体验的讨论，因此这次发布既是能力升级，也是一次真实用户反馈压力测试。

[citation:Anthropic](https://www.anthropic.com/news/claude-opus-4-7) · [citation:Business Insider](https://www.businessinsider.com/anthropic-claude-opus-4-7-backlash-tokens-2026-4) · [citation:钛媒体](https://www.tmtpost.com/7958003.html)

---

### Claude Design

| 指标 | 数据 |
| --- | --- |
| 发布时间 | 2026-04-17 |
| 产品状态 | Research preview |
| 驱动模型 | Claude Opus 4.7 |
| 面向用户 | Claude Pro、Max、Team、Enterprise 用户 |
| 典型输出 | 原型、设计稿、幻灯片、one-pager、营销物料、HTML |
| 导出方式 | 组织内 URL、文件夹、Canva、PDF、PPTX、独立 HTML |
| 工作流衔接 | 可把设计交接给 Claude Code |

Claude Design 的重点不是单纯生成图片，而是把“想法 -> 可编辑视觉稿 -> 可交付文件 / 代码交接”串成工作流。它对 Canva、Figma、Adobe 这类设计工具的影响，可能不在于立刻替代专业工具，而在于抢占需求最早期的草稿和原型环节。

[citation:Anthropic](https://www.anthropic.com/news/claude-design-anthropic-labs) · [citation:TechCrunch](https://techcrunch.com/2026/04/17/anthropic-launches-claude-design-a-new-product-for-creating-quick-visuals/)

---

### NVIDIA Isaac GR00T N1.7

NVIDIA 4 月 17 日在 Hugging Face 发布 Isaac GR00T N1.7 Early Access。它是面向人形机器人的开放、可商用 Vision-Language-Action 模型，参数量 3B，输入包括 RGB 图像、自然语言指令和机器人本体状态，输出连续动作向量。

GR00T N1.7 使用 Action Cascade 架构：上层 Vision-Language Model 做任务理解和多步推理，下层 Diffusion Transformer 把高层动作 token 和机器人状态转成实时运动控制。NVIDIA 表示，模型基于 20,000+ 小时人类第一视角视频预训练，并支持 LeRobot 数据格式微调。

| 指标 | 数据 |
| --- | --- |
| 发布时间 | 2026-04-17 |
| 模型 | NVIDIA Isaac GR00T N1.7 |
| 参数量 | 3B |
| 类型 | Vision-Language-Action / Physical AI / Robotics |
| 许可 | Hugging Face 文章称 open, commercially licensed |
| 训练信号 | 20,000+ 小时人类第一视角视频 |
| 部署生态 | Hugging Face、GitHub、NVIDIA Isaac GR00T |

它代表“模型发布”正在从纯文本、代码和图像，扩展到机器人动作策略和具身智能基础模型。

[citation:Hugging Face](https://huggingface.co/blog/nvidia/gr00t-n1-7)

---

### xAI Grok Speech to Text / Text to Speech APIs

xAI 4 月 17 日发布独立 Grok Speech to Text 和 Text to Speech API。官方称这些端点基于同一套支撑 Grok Voice、Tesla 车辆和 Starlink 客服的技术栈，面向语音 Agent、实时转写、无障碍、播客和交互式音频体验。

| 指标 | 数据 |
| --- | --- |
| 发布时间 | 2026-04-17 |
| 产品 | Grok STT / Grok TTS API |
| STT 模式 | REST 批处理、WebSocket 实时转写 |
| STT 价格 | REST 0.10 美元 / 小时，Streaming 0.20 美元 / 小时 |
| TTS 能力 | 多语种、自然表达、5 种声音、语音标签 |
| 典型场景 | Voice Agent、会议转写、客服、播客、辅助功能 |

语音 API 的竞争正在从“识别准确率”扩展到价格、流式延迟、说话人分离、声音表现力、合规和开发者集成。xAI 这次定价较激进，会给 Whisper、Deepgram、ElevenLabs、Google Cloud Speech 和 Azure Speech 带来新的价格参照。

[citation:xAI](https://x.ai/news/grok-stt-and-tts-apis) · [citation:xAI Docs](https://docs.x.ai/developers/models/speech-to-text)

---

### Google AI Mode：旅行规划、本地库存和 Chrome 侧边浏览

Google 4 月 17 日发布夏季旅行相关更新，AI Mode in Search 可以用 Canvas 帮用户生成旅行计划，并整合航班、酒店、景点和地图信息。TechCrunch 同日报道称，Google 还在 AI Mode 中加入本地库存查询能力，用户可以描述需求，让 Google 代为联系附近商店确认是否有货；Google Search 也新增单个酒店价格追踪。

Chrome 侧边浏览也是同一轮 AI Mode 体验升级的一部分。用户在 AI Mode 中点击来源链接时，网页可在侧边打开，AI 对话保持可见，方便继续提问、比较和使用网页内容作为上下文。

这说明搜索入口正在变成“AI + 浏览器 + 代理操作”的混合界面。它对内容网站、搜索广告、本地商家和旅行平台都会产生后续影响。

[citation:Google](https://blog.google/products-and-platforms/products/search/summer-travel-tips-google-search-ai/) · [citation:TechCrunch](https://techcrunch.com/2026/04/17/googles-ai-mode-can-now-help-you-find-products-in-stock-nearby/) · [citation:The Verge](https://www.theverge.com/tech/913109/google-ai-mode-tabs-sources)

---

## 💰 融资与交易

### OpenAI 与 Cerebras 被曝扩大至超 200 亿美元算力合作

Reuters 援引 The Information 报道称，OpenAI 同意在未来三年向 Cerebras 支付超过 200 亿美元，用于使用基于 Cerebras 芯片的服务器，并可能通过认股权证获得 Cerebras 少数股权。报道称，这一规模相当于把 1 月已披露的 750MW、超过 100 亿美元合作扩大约一倍；Reuters 同时说明未能独立核实该报道，OpenAI 和 Cerebras 未给出正式确认。

如果属实，这笔交易的产业含义非常直接：头部模型公司继续用长期算力合同锁定非 NVIDIA 方案，尤其是面向低延迟推理的专用硬件。它也说明 2026 年 AI 基础设施竞争的重点不只是训练集群，还包括高吞吐、低延迟、可规模化的推理容量。

| 日期 | 参与方 | 金额 | 内容 |
| --- | --- | --- | --- |
| 2026-04-16 / 17 报道 | OpenAI / Cerebras | 报道称超过 200 亿美元 | 三年期芯片服务器和算力合作，可能附带 Cerebras 股权认股权证 |

[citation:Reuters via WSAU](https://wsau.com/2026/04/16/openai-to-spend-more-than-20-billion-on-cerebras-chips-receive-equity-stake-the-information-reports/) · [citation:钛媒体](https://www.tmtpost.com/7958003.html)

---

## 🌍 全球产业动态

### Anthropic 与美国政府围绕 Mythos 网络安全能力继续接触

Washington Post 报道称，Anthropic CEO Dario Amodei 4 月到访白宫，与美国政府讨论 Mythos 等高能力网络安全模型的风险与合作。报道提到，Mythos 可用于发现软件系统中的大量漏洞，但也可能带来被滥用的攻击风险；Anthropic 此前已通过 Project Glasswing 与多家科技和安全公司合作测试风险缓解。

这条动态与 Claude Opus 4.7 的安全策略相互呼应：Anthropic 先在相对低风险的公开模型上测试网络安全拦截和验证机制，再决定更强模型如何开放。对企业客户来说，模型能力、政府合作、红队测试和用途管控会越来越绑定在一起。

[citation:Washington Post](https://www.washingtonpost.com/technology/2026/04/17/anthropic-ai-trump-security/) · [citation:新浪 AI 热点小时报](https://k.sina.com.cn/article_7857201856_1d45362c001904g5ge.html?from=tech)

---

### Agent 协作研究：CoopEval 关注 LLM Agent 的合作机制

arXiv 4 月 16 日提交的 CoopEval 研究关注 LLM Agent 在社会困境中的合作问题。论文测试了重复博弈、声誉系统、第三方调解者和合约机制等方法，研究哪些机制能让理性 Agent 在混合动机场景中维持合作。

这类研究的工程意义在于：多 Agent 系统不能只看单个 Agent 的推理能力。随着企业把多个 Agent 放进同一流程，协作、冲突、激励、监督和责任分配会成为系统可靠性的关键问题。

[citation:arXiv / CoopEval](https://papers.cool/arxiv/2604.15267)

---

## 📊 关键数据一览

| 指标 | 数据 |
| --- | --- |
| Claude Opus 4.7 发布时间 | 2026-04-16 |
| Claude Opus 4.7 API 价格 | 输入 5 美元 / 百万 token，输出 25 美元 / 百万 token |
| Claude Opus 4.7 上下文窗口 | Anthropic Claude Opus 页面标注 1M |
| Claude Design 发布时间 | 2026-04-17 |
| OpenAI Codex 周活跃开发者 | OpenAI 称超过 300 万 |
| NVIDIA GR00T N1.7 参数量 | 3B |
| GR00T N1.7 训练信号 | Hugging Face 文章称 20,000+ 小时人类第一视角视频 |
| xAI STT REST 价格 | 0.10 美元 / 小时 |
| xAI STT Streaming 价格 | 0.20 美元 / 小时 |
| OpenAI / Cerebras 合作规模 | 报道称超过 200 亿美元，Reuters 未独立核实 |

---

## 📎 Sources

- [Anthropic — Introducing Claude Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7) — Claude Opus 4.7 的发布时间、能力、价格、访问方式和网络安全策略。
- [Anthropic — Introducing Claude Design by Anthropic Labs](https://www.anthropic.com/news/claude-design-anthropic-labs) — Claude Design 的产品形态、适用场景、导出方式和企业设计系统能力。
- [新浪 AI 热点小时报](https://k.sina.com.cn/article_7857201856_1d45362c001904fv1c.html?from=tech) — 中文来源对 Claude Design、Claude Opus 4.7 和用户反馈的整理。
- [钛媒体 — Edge AI Daily 早报（4月18日）](https://www.tmtpost.com/7958003.html) — 中文来源对 Claude Opus 4.7、OpenAI / Cerebras 和 AI 基础设施动态的整理。
- [OpenAI — Codex for (almost) everything](https://openai.com/index/codex-for-almost-everything/) — Codex 重大更新、周活跃开发者规模、电脑操作、记忆、图像生成和开发工作流能力。
- [The Verge — OpenAI's big Codex update](https://www.theverge.com/ai-artificial-intelligence/913034/openai-codex-updates-use-macos) — Codex 更新的第三方报道和竞争背景。
- [Hugging Face — NVIDIA Isaac GR00T N1.7](https://huggingface.co/blog/nvidia/gr00t-n1-7) — GR00T N1.7 模型、架构、训练数据、部署和微调信息。
- [xAI — Grok Speech to Text and Text to Speech APIs](https://x.ai/news/grok-stt-and-tts-apis) — xAI 语音 API 官方发布。
- [xAI Docs — Speech to Text](https://docs.x.ai/developers/models/speech-to-text) — xAI STT 价格、模式、限额和区域信息。
- [Google — 7 ways to travel smarter this summer](https://blog.google/products-and-platforms/products/search/summer-travel-tips-google-search-ai/) — Google AI Mode 旅行规划、Canvas 和 Search 旅行功能。
- [TechCrunch — Google AI Mode can now help find products in stock nearby](https://techcrunch.com/2026/04/17/googles-ai-mode-can-now-help-you-find-products-in-stock-nearby/) — Google AI Mode 本地库存查询和酒店价格追踪报道。
- [Reuters via WSAU — OpenAI to spend more than $20 billion on Cerebras chips](https://wsau.com/2026/04/16/openai-to-spend-more-than-20-billion-on-cerebras-chips-receive-equity-stake-the-information-reports/) — OpenAI / Cerebras 报道及未独立核实说明。
- [Washington Post — Anthropic CEO visits White House amid hacking fears](https://www.washingtonpost.com/technology/2026/04/17/anthropic-ai-trump-security/) — Anthropic、美国政府和 Mythos 网络安全风险讨论。
- [arXiv / Papers Cool — CoopEval](https://papers.cool/arxiv/2604.15267) — LLM Agent 合作机制研究。

---

*本 Newsletter 由 AI 行业公开信息整理，数据截至 2026 年 4 月 19 日。所有信息均来自公开来源，不构成投资建议。*
