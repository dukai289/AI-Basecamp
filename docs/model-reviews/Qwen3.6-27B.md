---
title: Qwen3.6-27B
sidebar_position: -5
tags: [Qwen, Qwen3.6, Qwen3.6-27B]
description: Qwen3.6-27B 实测。
draft: true
last_update:
  date: 2026-04-22
---

# Qwen3.6-27B 实测

:::tip[内容]
Qwen3.6-27B 的介绍与效果实测。
:::


## 效果实测
下面我们就通过一些任务来了解一下 Qwen3.6-27B 的模型效果。

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

# 参考
+ [Qwen3.6-27B 开源：小小身材，超级码力](https://mp.weixin.qq.com/s/qLG4WWORyIKUvnewmBlqzA)
