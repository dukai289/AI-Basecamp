---
title: 2026-04 AI 月报
tags: [AI月报, Agent, DeepSeek-V4, GPT-5.5, Claude Opus 4.7, 具身智能, AI治理, AI基础设施]
description: 2026 年 4 月 AI 月报，复盘模型、Agent、具身智能、基础设施、资本交易和治理趋势。
hide_table_of_contents: true
---

# 2026-04 AI 月报

:::info **本月判断**
1. Agent 从单点工具进入生产系统，可靠性、记忆和权限成为核心问题。  
2. 长上下文与低成本推理并行推进，模型竞争开始转向工程成本。  
3. 具身智能从演示走向数据、评测、供应链和真实场景验证。  
4. 多模态模型继续扩展到图像、语音、视频、3D 世界和医疗视频。  
5. AI 治理从内容审核扩展到训练数据、开源模型、网络安全和应用备案。  
:::

<!-- truncate -->

---

## 月度趋势

### 趋势一：Agent 从“助手”变成“工作单元”

4 月最清晰的主线是 Agent 产品形态的变化。月初到月末，OpenAI Agents SDK、Codex、GitHub Copilot、Google Gemini Enterprise Agent Platform、飞书项目 MCP、JiuwenClaw Team Skills、Stripe Agentic Commerce、QoderWake 等事件连在一起，说明 Agent 不再只是聊天窗口里的增强功能，而是正在被塞进 IDE、项目管理、企业数据云、支付钱包、浏览器自动化、办公表格和岗位流程里。

这个阶段的关键词不是“更会说”，而是“能不能长期可靠地做事”。Claude Code 质量波动 postmortem、QoderWake 的 Anti-Rot Governance、Hugging Face 对 Agent 评测成本的分析，都指向同一个问题：Agent 的质量由模型、提示、缓存、工具、权限、记忆、验证、成本和失败恢复共同决定。企业需要的是可审计、可回滚、可授权、可复盘的工作单元。

[citation:OpenAI Agents SDK](https://openai.com/index/new-tools-for-building-agents/) · [citation:Google Cloud Next](https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/google-cloud-next-26-recap/) · [citation:Anthropic Engineering](https://www.anthropic.com/engineering/april-23-postmortem) · [citation:量子位](https://www.qbitai.com/2026/04/411955.html)

---

### 趋势二：模型能力继续上探，但成本结构开始主导采用

DeepSeek-V4、GPT-5.5、Claude Opus 4.7、Kimi K2.6、GLM-5.1、Granite 4.1 等模型更新，让 4 月的能力上限继续抬高。DeepSeek-V4 把 1M tokens 上下文放进官方服务，并在月底通过输入缓存命中降价把长上下文成本压低；GPT-5.5 则把 agentic coding、电脑使用、知识工作和早期科研作为主战场；Granite 4.1 代表另一条路线：小到中等规模、许可清晰、训练过程透明、最长 512K 上下文。

本月更值得关注的是“成本结构”开始影响模型叙事。百万上下文如果没有缓存与低价输入，很难进入高频 Agent 工作流；推理 GPU 公司曦望把目标说成“百万 Token 一分钱”；天翼云披露中国日均 AI Token 调用量在 2026 年 3 月突破 140 万亿；Hugging Face 则提醒 Agent 评测本身已经可能花掉数万到数十万美元。模型竞争正在从 benchmark 表格转向 token、缓存、推理芯片、评测成本和真实工作流吞吐。

[citation:DeepSeek API Docs](https://api-docs.deepseek.com/zh-cn/quick_start/pricing) · [citation:OpenAI GPT-5.5](https://openai.com/index/introducing-gpt-5-5/) · [citation:Hugging Face / IBM Granite](https://huggingface.co/blog/ibm-granite/granite-4-1) · [citation:Hugging Face EvalEval](https://huggingface.co/blog/evaleval/eval-costs-bottleneck)

---

### 趋势三：具身智能从“机器人很酷”走向“数据和闭环很硬”

4 月的具身智能不再只是发布机器人视频。灵初智能发布 Psi-R2 / Psi-W0 和近 10 万小时人类操作数据，Google DeepMind 推出 Gemini Robotics-ER 1.6，Physical Intelligence 发布 π0.7，苏度科技推出 Sudo R1，元戎启行用 40B VLA 做自动驾驶研发闭环，蚂蚁灵波把 LingBot-World-Fast 开源并推向移动端交互世界模型。

资本侧也在加码：它石智航完成 4.55 亿美元 Pre-A，智象未来完成超 5 亿元融资，地瓜机器人 B 轮累计融资 2.7 亿美元，无界动力完成数千万元天使+轮。更关键的是，行业讨论从“本体能动起来”转向“数据怎么来、评测怎么做、闭环怎么跑、供应链怎么量产”。具身智能的护城河正在从单个 demo，迁移到真实数据、仿真环境、VLA 模型、机器人本体、供应链和场景交付。

[citation:Google DeepMind Robotics](https://deepmind.google/discover/blog/gemini-robotics-er-16/) · [citation:量子位 - 它石智航](https://www.qbitai.com/2026/04/402274.html) · [citation:量子位 - LingBot](https://www.qbitai.com/2026/04/407972.html) · [citation:36氪 - 无界动力](https://www.36kr.com/p/3275633061472261)

---

### 趋势四：多模态从“生成内容”走向“交付场景”

图像、语音、视频、3D 和医疗视频在 4 月集中推进。百度 ERNIE-Image、ChatGPT Images 2.0、UniWorld-V2.5、腾讯混元 Hy3 preview、NVIDIA Nemotron 3 Nano Omni、Google Gemini 3.1 Flash TTS、xAI Grok STT / TTS、联影智能 uAI Nexus MedVLM、DeepSeek Vision 灰度测试，覆盖了从创意素材到端侧语音、从 3D 世界到医疗视频理解的不同层面。

多模态的竞争点正在变得更具体：能否生成中文密集文字和信息图，能否把网页截图复原为 HTML，能否在端侧实时理解语音，能否把单图变成可交互 3D 世界，能否用标准测试集衡量医疗视频理解。也就是说，多模态不再只是“看起来像”，而是要能进工作流、进设备、进临床研究和进生产工具链。

[citation:量子位 - UniWorld-V2.5](https://www.qbitai.com/2026/04/406994.html) · [citation:NVIDIA Nemotron Nano Omni](https://developer.nvidia.com/blog/deploy-omnilingual-asr-and-audio-reasoning-capable-of-tasking-on-devices-with-nvidia-nemotron-nano-omni/) · [citation:量子位 - uAI Nexus MedVLM](https://www.qbitai.com/2026/04/407486.html) · [citation:IT之家 - Hy3 preview](https://www.ithome.com/0/944/875.htm)

---

### 趋势五：治理进入训练链路、模型开放和行业部署

本月治理不只是内容审核。中国侧，拟人化互动服务管理办法、哩布哩布 AI 内容安全整改、“清朗 · 整治 AI 应用乱象”专项行动，把生成标识、训练语料安全、AI 数据投毒、开源模型安全、未成年人保护和 AI 托管网络水军都纳入治理范围。产业侧，“模数共振”行动把 AI 与工业数据融合放入制造业 20 个重点行业，AI 治理和 AI 产业化开始同时下沉到行业场景。

海外侧，OpenAI 推出 Trusted Access for Cyber，并在 4 月继续推进 GPT-5.4-Cyber / GPT-5.5-Cyber 这类受限访问网络安全模型；Google 与五角大楼 AI 协议引发员工反对；Meta Llama 版权案继续暴露训练数据来源争议；OpenAI 还复盘了奖励信号导致模型语言风格漂移的问题。这些事件说明，模型越强，治理越不可能只放在输出端，训练数据、奖励函数、访问权限、采购合同和开源生态都会成为治理对象。

[citation:OpenAI Trusted Access for Cyber](https://openai.com/index/trusted-access-for-cyber/) · [citation:IT之家 - 清朗专项行动](https://www.ithome.com/0/945/635.htm) · [citation:The Verge - Google Pentagon AI](https://www.theverge.com/ai-artificial-intelligence/919494/google-pentagon-classified-ai-deal) · [citation:OpenAI - Reward Drift](https://openai.com/index/where-the-goblins-came-from/)

---

## 月度时间线

| 日期 | 事件 | 分类 | 影响 |
| --- | --- | --- | --- |
| 04-11 | 灵初智能发布 Psi-R2 / Psi-W0 与近 10 万小时操作数据 | 具身智能 | 机器人基础模型竞争转向数据资产 |
| 04-14 | 千问上线表格 Agent | Agent / 办公 | AI 助手开始交付可编辑工作产物 |
| 04-15 | 百度开源 ERNIE-Image | 多模态 | 国产文生图模型继续降低部署门槛 |
| 04-16 | OpenAI Agents SDK 升级 | Agent 工程 | Agent 开发进入沙箱、长任务和受控执行阶段 |
| 04-16 | 它石智航完成 4.55 亿美元 Pre-A | 融资 / 具身 | 中国具身智能资本热度继续上升 |
| 04-17 | Claude Opus 4.7 发布 | 模型 | 长程编码、高分辨率视觉和安全分层合并推进 |
| 04-18 | Gemini Robotics-ER 1.6 与 π0.7 成为焦点 | 机器人模型 | 具身推理和跨本体泛化成为机器人模型关键词 |
| 04-20 | Kimi ABot 发布 | AI 科研 | AutoML 与自动科研进入多 Agent 阶段 |
| 04-21 | Anthropic × Amazon 合作升级至 5GW | 算力 / 云 | 模型公司与云、芯片、采购承诺进一步绑定 |
| 04-22 | Kimi K2.6 开源 | 模型 / Coding Agent | 长程编码与 Agent 集群成为国产模型竞争点 |
| 04-23 | Google Cloud Next 推出企业 Agent 平台与 TPU 8 | 企业 AI / 基础设施 | 企业 Agent、数据云、安全和芯片组成完整产品栈 |
| 04-24 | DeepSeek-V4 预览版上线 | 模型 / 开源 | 1M 上下文成为中文模型生态核心事件 |
| 04-24 | GPT-5.5 发布并进入 API / Copilot 链路 | 模型 / 开发者工具 | Coding Agent 迎来新一轮模型切换 |
| 04-25 | UniWorld-V2.5 发布 | 图像生成 | 中文密集文字、GUI 和信息图生成成为新考场 |
| 04-26 | Cohere 接管 Aleph Alpha | 资本 / 主权 AI | 模型、云和数据主权被打包进跨国整合 |
| 04-27 | LingBot-World-Fast 开源 | 世界模型 | 世界模型进入移动端交互和本地部署语境 |
| 04-28 | OpenAI 获 FedRAMP Moderate | 政府 AI | GPT-5.5 与 Codex Cloud 进入美国联邦采购路径 |
| 04-29 | 腾讯混元 Hy3 preview 首秀 | 3D 生成 | 从单物体生成转向完整 3D 世界生成 |
| 04-29 | Meta 签下太阳能与地热能源协议 | AI 基础设施 | AI 数据中心竞争延伸到电力和并网 |
| 04-30 | QoderWake 发布 | 生产级 Agent | 数字员工形态开始强调记忆、治理和岗位流程 |
| 04-30 | Qwen-Scope 开源 | 可解释性 | 稀疏自编码器进入模型分析、控制和评测优化 |

---

## 模型与产品

| 方向 | 代表事件 | 月度观察 |
| --- | --- | --- |
| 基础模型 | DeepSeek-V4、GPT-5.5、Claude Opus 4.7、Kimi K2.6、Granite 4.1 | 上下文、编码、工具调用和许可透明度成为核心卖点 |
| Agent 产品 | Codex、Gemini Enterprise Agent Platform、QoderWake、飞书 MCP、Stripe Agentic Commerce | 从个人助手走向企业工作单元和交易基础设施 |
| 图像 / 视觉 | ERNIE-Image、ChatGPT Images 2.0、UniWorld-V2.5、DeepSeek Vision | 重点从好看转向文字、布局、OCR、网页和工作流交付 |
| 语音 | VoxCPM2、Gemini Flash TTS、Grok STT/TTS、Nemotron Nano Omni | 多语种、低延迟和端侧推理成为语音模型重点 |
| 3D / 世界模型 | LingBot-World-Fast、Hy3 preview、WALL-B、ABot-PhysWorld | 3D 场景、交互世界和机器人仿真开始汇合 |
| 医疗与科学 | uAI Nexus MedVLM、Novo Nordisk × OpenAI、10x Science | AI 从文献和办公提效进入视频理解、药物研发和科研基础设施 |

---

## 资本与交易

4 月资本动作集中在三类资产：算力、具身智能、垂直 Agent。算力侧，CoreWeave、Anthropic、Amazon、Google、Broadcom、Cerebras、Meta 能源协议、Qualcomm 数据中心定制芯片等事件，说明 AI 基础设施竞争继续从 GPU 扩展到 TPU、Trainium、定制芯片、电力、云采购和长期能源协议。

具身智能侧，它石智航、智象未来、地瓜机器人、无界动力、曦望等融资或融资信号显示，中国资本仍在押注机器人本体、世界模型、推理芯片和数据闭环。垂直 Agent 侧，Microsoft 收购 Fintool、Nextie 连续融资、NeoCognition 种子轮、Stripe 的 Agentic Commerce Suite，则表明资金正在寻找“模型之上的工作流层”。

---

## 治理与风险

4 月治理风险可以分成四层：

1. 数据层：Meta Llama 版权案、训练数据来源争议、AI 数据投毒进入监管重点。
2. 模型层：OpenAI 奖励信号跑偏、Qwen-Scope 可解释性、Claude Code 产品层质量波动。
3. 应用层：哩布哩布 AI 整改、清朗专项行动、生成内容标识、未成年人保护。
4. 访问层：GPT-5.5-Cyber、Claude Mythos、Google 国防 AI 协议、FedRAMP 授权。

这说明“AI 安全”不再是一个单独栏目，而是贯穿训练、部署、开放、采购、运营和内容分发的系统工程。

---

## 下月观察

1. DeepSeek-V4 的 1M 上下文和降价后，Agent 框架是否会改变上下文管理策略。
2. GPT-5.5 在 Codex、Copilot 和企业 API 中的真实迁移速度。
3. QoderWake、飞书 MCP、Stripe Agentic Commerce 这类生产级 Agent 是否能跑出可量化案例。
4. 具身智能融资之后，哪些团队能交付稳定数据闭环，而不只是演示视频。
5. 中国“清朗”专项行动和“模数共振”行动对 AI 应用平台、开源模型托管和工业场景的实际影响。
6. AI 数据中心能源、推理芯片和评测成本是否会成为 5 月更强的基础设施主线。

---

## Sources

- [OpenAI - New tools for building agents](https://openai.com/index/new-tools-for-building-agents/) - OpenAI Agents SDK、受控执行环境和 Agent 开发工具。
- [OpenAI - Introducing GPT-5.5](https://openai.com/index/introducing-gpt-5-5/) - GPT-5.5 能力定位、API、价格和安全口径。
- [DeepSeek API Docs - 模型与价格](https://api-docs.deepseek.com/zh-cn/quick_start/pricing) - DeepSeek-V4 上下文、输出长度、价格和缓存命中降价。
- [Anthropic Engineering - Claude Code quality reports](https://www.anthropic.com/engineering/april-23-postmortem) - Claude Code 质量波动、reasoning effort、缓存和系统提示问题。
- [Google Blog - Cloud Next 2026 recap](https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/google-cloud-next-26-recap/) - Gemini Enterprise Agent Platform、TPU 8、Agentic Data Cloud 和安全 Agent。
- [Hugging Face / IBM Granite - Granite 4.1 LLMs](https://huggingface.co/blog/ibm-granite/granite-4-1) - Granite 4.1 模型规模、训练流程、512K 上下文和开源许可。
- [Hugging Face Blog - AI evals are becoming the new compute bottleneck](https://huggingface.co/blog/evaleval/eval-costs-bottleneck) - Agent 评测成本、HAL、GAIA 和可靠性成本。
- [量子位 - QoderWake](https://www.qbitai.com/2026/04/411955.html) - QoderWake 数字员工、Harness-First、Anti-Rot Governance 和提效案例。
- [量子位 - LingBot-World-Fast](https://www.qbitai.com/2026/04/407972.html) - LingBot-World-Fast 世界模型、实时性能和开源信息。
- [量子位 - uAI Nexus MedVLM](https://www.qbitai.com/2026/04/407486.html) - 医疗视频理解模型、MedVidBench、数据规模和任务覆盖。
- [NVIDIA - Nemotron Nano Omni](https://developer.nvidia.com/blog/deploy-omnilingual-asr-and-audio-reasoning-capable-of-tasking-on-devices-with-nvidia-nemotron-nano-omni/) - 端侧多语种语音模型、任务和性能信息。
- [Stripe - Sessions 2026](https://stripe.com/nl/newsroom/news/sessions-2026) - Agentic Commerce、Agent 钱包、Google 合作和 288 项更新。
- [Meta - Powering AI and strengthening the grid](https://about.fb.com/news/2026/04/powering-ai-strengthening-the-grid-space-solar-energy-and-long-duration-storage/) - AI 数据中心能源、太阳能和地热项目。
- [IT之家 - 清朗专项行动](https://www.ithome.com/0/945/635.htm) - 中央网信办整治 AI 应用乱象专项行动。
- [OpenAI - Where the goblins came from](https://openai.com/index/where-the-goblins-came-from/) - 奖励信号跑偏、模型风格漂移和训练治理复盘。

---

*本月报基于 2026 年 4 月 AI 行业公开信息与本站 4 月日报整理，重点覆盖 2026 年 4 月 11 日至 2026 年 4 月 30 日期间已收录的公开动态；所有信息均来自公开来源，不构成投资建议。*
