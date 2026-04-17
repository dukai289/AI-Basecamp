---
title: GPU 互联
sidebar_position: 6
tags: [GPU互联, PCIe, NVLink, NVSwitch, 带宽]
description: 多 GPU 部署中的 PCIe、NVLink、NVSwitch 和通信瓶颈。
last_update:
  date: 2026-04-17
---

# GPU 互联

本文用于整理多 GPU 场景下的互联方式和通信影响。

待展开内容：

- PCIe
- NVLink
- NVSwitch
- GPU Direct RDMA
- 拓扑对 tensor parallel 的影响
- MoE expert parallel 中的通信
- all-reduce、all-to-all
- 单机多卡互联选型
- 如何查看 GPU 拓扑
