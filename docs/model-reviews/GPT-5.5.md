---
title: GPT-5.5
sidebar_position: -6
tags: [GPT-5.5, chatGPT, GPT]
description: GPT-5.5 实测。
last_update:
  date: 2026-04-25
---

# GPT-5.5 测评

:::tip[内容]
GPT-5.5 的介绍、亮点与效果实测。
:::

## 1. 模型介绍

OpenAI 在 2026年 4 月 23 日正式发布新一代模型 **GPT-5.5**。

OpenAI 将其称为最智能、最直观易用的模型，也是在计算机上完成工作的新方式的下一步。

当天，GPT-5.5 正式向 ChatGPT 和 Codex 中的 Plus、Pro、Business 和 Enterprise 用户推出，GPT-5.5 Pro 也正式向 ChatGPT 中的 Pro、Business 和 Enterprise 用户推出。API 也会很快推出。

---

## 2. 模型亮点

OpenAI 在官方发布内容中提到 GPT-5.5 在下面几方面的能力提升：
+ 在智能体编码、计算机应用、知识工作和早期科学研究等领域的提升尤为显著
+ 实际应用中的 token 延迟与 GPT-5.4 相当，同时智能水平却更高
+ 它完成相同的 Codex 任务所需的 token 数量也显著减少
+ 配备了迄今为止最强大的安全保障措施

总体来说，GPT-5.5 在知识性工作、科学研究方面提升突出，推理效率也更高（特别是在与 Codex 的配合中），并且有最强大的网络安全防护措施。

---

## 3. 效果实测
下面我们就通过一些任务来测试一下 GPT-5.5 的模型效果。

<Tabs groupId="platform">
  <TabItem value="3D游戏" label="3D游戏" default>

    ```
    在 codex + GPT-5.5(中等思考) 上使用中文提示词复现 OpenAI 官方在博文中的 "3D游戏" 任务实现。
    ```
    ```text
    使用 three.js 创建一个 3D 游戏。游戏内容应为 UFO 射击，玩家需要控制坦克击落头顶飞过的 UFO。
    
    - 逐步思考，深呼吸。回答前，请复述一遍问题。
    - 想象一下，你正在为一位即将开始构建游戏的初级开发者编写操作指南。你能否写出非常清晰明确的指南，包括他们需要查看哪些文件进行修改以及需要修复哪些文件？
    - 然后编写所有代码。游戏采用低多边形设计，但要美观。
    - 记住，你是一个 Agent ：请持续处理用户的问题，直到问题完全解决后再结束你的回合并将选择权交还给用户。将用户的查询分解为所有必要的子请求，并确认每个子请求都已完成。不要只完成部分请求就停止。只有当你确信问题已解决时，才能结束你的回合。你必须做好回答多个查询的准备，并且只有在用户确认问题已解决后才能结束通话。
    - 在进行后续函数调用之前，必须按照工作流程步骤进行充分的计划，并充分思考每次函数调用的结果，确保用户的查询和相关的子请求得到完全解决。
    ```
    ![3D游戏](/img/gpt-5.5-review-3dgame.png)
  </TabItem>
  <TabItem value="数据分析" label="数据分析" default>
    ```text
    在 codex + GPT-5.5(中等思考) 上：
    1. 整理一下这个 Excel 中的数据，生成几个新的sheet存入数据，要与关系型数据库适配
    2. 对数据进行分析，将汇总的数据和结论放到新的 Excel 文件中。
    ```
    ```text
    GPT-5.5 将这个数据整理与分析任务拆成了 5 个子任务：
    1.复制源 Exeel 到工作区副本
    2.识别原始表结构和字段含义
    3.新增关系型数据库适配sheet
    4.新增数据质量与统计分析sheet
    5.校验输出工作簿
    ```

    ```text
    已处理好：我复制了原文件，并新增了数据库适配与分析 sheet。
    
    新增内容包括：
    - db_asset_line：线路主表，59 条
    - db_line_area_metric：区域长度明细，113 条
    - db_operation_window：运行/暂停约束，16 条
    - db_spare_inventory：备件库存匹配，172 条
    - analysis_deep_dive：KPI、长度分布、库存 Top、规格分析
    - data_quality_report：数据质量问题，22 条
    校验结果：文件可正常打开，敏感词扫描为 0；质量报告里保留了异常点，比如区域长度不闭合、设计负载疑似录入错误、部分关键字段缺失等。
    ```
  

  </TabItem>
  <TabItem value="浏览器自动化" label="浏览器自动化" default>
    ```text
    在 codex + GPT-5.5(中等思考) 上，并且安装了 chrome-devtools-mcp：
    找一个在线数独页面，根据盘面填写答案。
    要求：一步步填写，不能直接根据网页截图一步写出所有答案。
    ```
    ![使用浏览器玩数独](/img/GPT-5.5-review-browser-use.png)
  </TabItem>
  <TabItem value="结合Images-2" label="结合Images-2" default>
    ```text
    在 codex + GPT-5.5(中等思考) 上：
    参考 ai-basecamp.sparkhub.space 中 "Transformer架构" 的内容，使用 [$imagegen](...) 作成一张知识卡片
    ```
    ![结合Images-2](/img/GPT-5.5-review-Image2.png)
  </TabItem>
  <TabItem value="GPT-5.5介绍视频" label="GPT-5.5介绍视频" default>
    ```text
    在 codex + GPT-5.5(中等思考) 上，并且安装了 remotion-best-practices skill：
    参考 https://openai.com/index/introducing-gpt-5-5/ 的内容，
    使用 [$remotion-best-practices](...) 制作 1 分钟的视频 
    ```
    <video src="/video/transformer-architecture.mp4" controls width="100%"></video>
  </TabItem>
</Tabs>

可以看到，GPT-5.5 能力非常全面，在各个任务上的表现都堪称优秀，配合上 Codex 则能作为 Agent 释放出更大威力。

---

## 参考
+ [Introducing GPT‑5.5 - OpenAI](https://openai.com/index/introducing-gpt-5-5/)
