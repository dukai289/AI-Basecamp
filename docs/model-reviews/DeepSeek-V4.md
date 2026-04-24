---
title: DeepSeek-V4 
sidebar_position: -7
tags: [DeepSeek, DeepSeek-V4 , 深度求索]
description: DeepSeek-V4 实测。
draft: true
last_update:
  date: 2026-04-24
---

# DeepSeek-V4 实测

:::tip[内容]
DeepSeek-V4 的介绍与效果实测。
:::

2026 年 4 月 24 日，深度求索官方发布了 DeepSeek-V4 模型预览版，包含 DeepSeek-V4-Pro 和 DeepSeek-V4-Flash 两个模型。

其中 DeepSeek-V4-Pro 的 Agent 能力使用体验优于 Sonnet 4.5，接近 Opus 4.6 非思考版，并且有丰富的世界知识和世界顶级推理能力。

而 DeepSeek-V4-Flash 的世界知识稍逊一筹，推理能力相当并且更加快捷和经济。

---

## 亮点

本次更新有几点值得注意：
首先，DeepSeek-V4 开创了一种全新的注意力机制，在 token 维度进行压缩，结合 DSA 稀疏注意力（DeepSeek Sparse Attention），实现了全球领先的长上下文能力，并且相比于传统方法大幅降低了对计算和显存的需求。从现在开始，1M（一百万）上下文将是 DeepSeek 所有官方服务的标配。

其次，DeepSeek-V4 针对 Claude Code 、OpenClaw、OpenCode、CodeBuddy 等主流的 Agent 产品进行了适配和优化，在代码任务、文档生成任务等方面表现均有提升。

另外，深度求索仍然沿续了模型开源传统，DeepSeek-V4-Pro 参数量和激活参数分别为 1.6T为 49B，而 DeepSeek-V4-Flash 为 284B 和 13B。

## 效果实测
下面我们就通过一些任务来了解一下 GPT-5.5 的模型效果。

<Tabs groupId="platform">
  <TabItem value="UI图" label="UI图" default>
    ```text
    Prompt
    帮我生成一张APP图片，里面是用户餐食打卡和菜品推荐、营养知识等功能
    ```
    ---
    ![UI图](/img/UI图.png)
    
    ---
    ```text
    Prompt 只有简单的一句话
    但在思考模式下，模型补全了功能和交互细节(比如菜品标签、知识分类等)，甚至还有APP的定位、slogon等
    并且中文字符渲染完全没有问题。
    画面精美，可以直接做为APP的宣传海报了。
    ```
  </TabItem>
</Tabs>

## 写在最后

深度求索在 DeepSeek-V4 的发布公告中引用了《荀子·非十二子》中的「**不诱于誉，不恐于诽，率道而行，端然正己**」，并且表明 "**将始终秉持长期主义的原则理念，在尝试与思考中踏实前行，努力向实现 AGI 的目标不断靠近**。"

## 参考
+ [DeepSeek-V4 官方发布公告](https://mp.weixin.qq.com/s/8bxXqS2R8Fx5-1TLDBiEDg)
+ [开源权重 - HuggingFace](https://huggingface.co/collections/deepseek-ai/deepseek-v4)
+ [开源权重 - ModelScope](https://modelscope.cn/collections/deepseek-ai/DeepSeek-V4)
+ [技术报告](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/DeepSeek_V4.pdf)
