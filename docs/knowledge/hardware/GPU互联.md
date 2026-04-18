---
title: GPU 互联
sidebar_position: 6
tags: [GPU互联, PCIe, NVLink, NVSwitch, 带宽]
description: 多 GPU 部署中的 PCIe、NVLink、NVSwitch 和通信瓶颈。
last_update:
  date: 2026-04-18
---

# GPU 互联

GPU 互联指 GPU 与 GPU、GPU 与 CPU、GPU 与网卡之间的数据通道。  
单卡场景主要看显存容量、显存带宽和算力；多卡和多机场景还要看互联，因为模型并行、参数同步、KV Cache 调度和 MoE expert dispatch 都会产生跨设备通信。

:::info 核心判断
互联不是越贵越好，而是要和并行策略匹配。  
如果业务主要是单卡推理，PCIe 通常够用；如果需要张量并行、流水线并行、MoE expert parallel 或多机训练，就要重点看 NVLink、NVSwitch、RoCE / InfiniBand 和实际拓扑。
:::

## 1. 为什么 GPU 互联重要

LLM 的多卡部署通常不是把请求平均分给多张卡这么简单。  
当一个模型大到单卡放不下，或者单卡吞吐不够时，就需要把权重、激活、梯度或 KV Cache 分布到多张 GPU 上。每一次跨卡取数据、同步结果或搬运 token 都会经过互联链路。

常见影响：

| 场景 | 通信内容 | 互联影响 |
| --- | --- | --- |
| 张量并行 | attention、MLP 中间结果同步。 | 通信频繁，低带宽或高延迟会直接拖慢每层计算。 |
| 数据并行训练 | 梯度 all-reduce。 | batch 越大、参数越多，同步压力越明显。 |
| MoE expert parallel | token dispatch / combine，常见 all-to-all。 | expert 分布越散，跨卡通信越重。 |
| 多卡推理 | 权重分片、KV Cache、跨卡聚合。 | 影响 TTFT、吞吐和并发稳定性。 |
| 多机训练 | GPU 与网卡、节点间网络通信。 | 节点数越多，网络拓扑和拥塞控制越关键。 |

简单说：计算决定单卡能跑多快，显存决定能不能放下，互联决定多卡能不能像一台机器一样高效协作。

## 2. 常见互联方式

### 2.1 PCIe

PCIe 是最通用的服务器设备互联方式，GPU、网卡、NVMe SSD 通常都挂在 PCIe 总线上。  
PCIe 的优点是通用、成本低、生态成熟；限制是 GPU-GPU 直接通信能力和带宽通常不如 NVLink / NVSwitch 系统。

适合：

- 单卡推理、开发机、轻量多卡推理。
- 数据主要在 CPU 与 GPU 之间搬运的传统任务。
- 对跨 GPU 通信不敏感的多卡任务，例如按请求切分的多实例推理。

需要注意：

- 不同插槽可能挂在不同 CPU socket 或不同 PCIe switch 后面。
- `x16`、`x8`、PCIe 代际都会影响实际带宽。
- 多卡 PCIe 服务器不等于多卡之间都有高效直连。

### 2.2 NVLink

NVLink 是 NVIDIA 的 GPU 高速互联技术，主要用于 GPU-GPU 通信。  
和 PCIe 相比，NVLink 更适合频繁跨卡同步的工作负载，例如张量并行训练和大模型多卡推理。

适合：

- 单机多卡训练。
- 单机多卡推理，尤其是 tensor parallel。
- 跨 GPU 通信密集的模型并行。

需要注意：

- 不是所有 NVIDIA GPU 都支持 NVLink。
- 同样支持 NVLink 的 GPU，不同代际和不同服务器形态的链路数量、带宽和拓扑也可能不同。
- PCIe 形态 GPU 和 SXM / HGX 形态 GPU 的互联能力通常差异很大。

### 2.3 NVSwitch

NVSwitch 可以理解为面向多 GPU 的 NVLink 交换结构。  
在 HGX、DGX、NVL 等高密度系统中，多张 GPU 可以通过 NVSwitch 获得更接近全互联的通信能力，减少 GPU 拓扑不均衡带来的性能差异。

适合：

- 8 卡及以上的单机高密度训练/推理。
- 大模型 tensor parallel、pipeline parallel、expert parallel 混合部署。
- 需要稳定跨卡通信性能的生产集群。

需要注意：

- NVSwitch 通常绑定整机平台形态，不是普通 PCIe 服务器上临时加一块卡就能获得。
- 应用仍然需要正确使用 NCCL、并行策略和拓扑感知调度，硬件本身不会自动消除所有通信开销。

### 2.4 GPU Direct RDMA

GPU Direct RDMA 允许网卡和 GPU 显存之间更直接地传输数据，减少 CPU 内存中转。  
在多机训练或跨节点推理中，它常和 InfiniBand、RoCE、NCCL 一起出现。

适合：

- 多机多卡训练。
- 跨节点参数同步。
- GPU 节点之间的大规模集合通信。

需要注意：

- 需要 GPU、网卡、驱动、CUDA、NCCL、交换机和网络配置共同支持。
- RoCE 环境还要关注 PFC、ECN、MTU、拥塞控制和交换机配置。
- 能跑通不代表性能好，最终要用 NCCL tests 或真实训练任务压测。

## 3. 通信模式

多 GPU 程序通常不是直接手写网卡收发，而是通过 NCCL、MPI、PyTorch Distributed、Megatron、DeepSpeed、vLLM、TensorRT-LLM 等框架间接使用集合通信。

| 通信模式 | 含义 | 常见场景 |
| --- | --- | --- |
| all-reduce | 每张卡都有一份输入，聚合后每张卡拿到相同结果。 | 数据并行训练中的梯度同步。 |
| all-gather | 每张卡提供一部分数据，最终每张卡拿到完整数据。 | 张量并行中拼接分片结果。 |
| reduce-scatter | 聚合后按分片分发到不同 GPU。 | ZeRO、FSDP、分布式优化器。 |
| all-to-all | 每张卡都向其他卡发送不同数据。 | MoE token dispatch、expert parallel。 |
| point-to-point | 指定两张卡之间发送和接收。 | pipeline parallel 相邻 stage 传递激活。 |

不同通信模式对互联的要求不同：

- all-reduce 更关注总体带宽和拓扑对称性。
- all-to-all 更容易暴露跨交换机、跨节点和拥塞问题。
- point-to-point 更依赖相邻 stage 是否被放在通信距离近的 GPU 上。

## 4. 拓扑对并行策略的影响

### 4.1 Tensor Parallel

Tensor parallel 会把同一层的矩阵计算拆到多张 GPU 上。  
每一层都可能发生同步，所以它对延迟和带宽都敏感。TP 规模越大，通信占比通常越高。

实践建议：

- 优先把同一个 TP group 放在 NVLink / NVSwitch 连通性最好的 GPU 内。
- 跨节点 TP 要谨慎，除非网络能力足够强并且框架明确支持。
- 如果 PCIe 服务器上 TP 性能不理想，可以尝试降低 TP，改用 pipeline parallel 或多副本推理。

### 4.2 Pipeline Parallel

Pipeline parallel 会按层切分模型，不同 stage 放在不同 GPU 上。  
它的通信通常发生在相邻 stage 之间，频率比 TP 低，但会引入流水线气泡。

实践建议：

- 把相邻 stage 放在拓扑距离近的 GPU 上。
- stage 之间计算量要尽量均衡，否则慢 stage 会拖住整条流水线。
- 推理场景中要结合 batch、并发和首 token 延迟评估收益。

### 4.3 Data Parallel

Data parallel 中每张 GPU 保存一份模型副本，处理不同 batch，训练时同步梯度。  
推理服务中也常用多副本方式提升吞吐，此时跨卡通信少，主要依赖调度和负载均衡。

实践建议：

- 训练时关注 all-reduce 性能。
- 推理时如果模型单卡能放下，多副本通常比强行 TP 更简单。
- 多副本推理的瓶颈更可能在显存、KV Cache、CPU 调度或前端队列，而不是 GPU 互联。

### 4.4 MoE Expert Parallel

MoE 模型会把 token 路由到不同 expert。  
如果 expert 分布在不同 GPU 或不同节点上，token dispatch 和 combine 会产生 all-to-all 通信。

实践建议：

- MoE 不只看激活参数量，也要看路由、负载均衡和 all-to-all 成本。
- expert parallel 尽量放在高速互联范围内。
- 低并发、小 batch 或互联较弱时，MoE 的通信开销可能抵消稀疏计算收益。

## 5. 单机多卡拓扑

同样是 8 张 GPU，拓扑可能完全不同：

| 形态 | 典型特征 | 适合场景 |
| --- | --- | --- |
| PCIe 多卡服务器 | GPU 通过 PCIe root complex 或 PCIe switch 连接。 | 单卡/多副本推理、轻量训练、开发测试。 |
| NVLink 成对或局部互联 | 部分 GPU 之间有高速直连。 | 小规模 TP、局部模型并行。 |
| HGX / SXM / NVSwitch | 多 GPU 通过 NVSwitch 获得更强互联。 | 大模型训练、多卡推理、混合并行。 |
| GB200 / NVL 类系统 | GPU 与 CPU、GPU 与 GPU 以整机或机柜级形态协同。 | 超大模型训练和高密度推理。 |

选型时不要只问“几张卡”，还要问：

- 每张 GPU 是 PCIe 还是 SXM / OAM / 其他形态？
- GPU 之间是否有 NVLink？
- 是否有 NVSwitch？
- GPU 到网卡是否支持 GPUDirect RDMA？
- GPU 和网卡是否在同一个 NUMA 域或同一个 PCIe switch 附近？
- 目标框架是否能利用这些拓扑？

## 6. 多机互联

跨节点以后，瓶颈从单机 GPU 拓扑扩展到网络系统。  
常见组合是 GPU + PCIe / NVLink / NVSwitch + 网卡 + RoCE / InfiniBand + 交换机 + NCCL。

关注点：

| 层次 | 关注内容 |
| --- | --- |
| 网卡 | 带宽、端口数、是否支持 RDMA、是否靠近 GPU。 |
| 交换机 | 无阻塞能力、缓存、PFC / ECN 支持、拥塞行为。 |
| 网络协议 | InfiniBand、RoCEv2、TCP 等。 |
| NCCL | 版本、拓扑识别、算法选择、环境变量配置。 |
| 调度 | 同一个任务是否被调度到网络距离近的节点。 |

多机场景中，单个部件规格好不代表整体好。  
例如 GPU 很强，但网卡挂在远端 NUMA，或者 RoCE 交换机没有正确配置无损网络，训练吞吐仍然可能明显下降。

## 7. 如何查看 GPU 拓扑

### 7.1 nvidia-smi topo

```bash
nvidia-smi topo -m
```

常见输出标记：

| 标记 | 大致含义 |
| --- | --- |
| `NV#` | 两张 GPU 之间有 NVLink，`#` 通常表示链路数量或级别。 |
| `PIX` | 经过同一个 PCIe switch。 |
| `PXB` | 经过多个 PCIe bridge / switch。 |
| `PHB` | 经过 PCIe host bridge，通常跨 CPU root complex。 |
| `SYS` | 跨 NUMA 或跨 CPU socket，距离更远。 |
| `NODE` | 同一 NUMA node 内的连接关系。 |

判断原则：

- `NV#` 通常优于 PCIe 路径。
- `PIX` 通常比 `PHB`、`SYS` 更近。
- TP group、pipeline 相邻 stage、网卡亲和的 GPU 应尽量选择拓扑距离近的组合。

### 7.2 查看 GPU 和网卡亲和关系

```bash
nvidia-smi topo -m
nvidia-smi topo -p2p r
lspci -tv
numactl --hardware
```

如果是多机训练，还可以用 NCCL tests 压测：

```bash
all_reduce_perf -b 8 -e 8G -f 2 -g 8
alltoall_perf -b 8 -e 8G -f 2 -g 8
```

压测时建议同时记录：

- GPU 型号和数量。
- 驱动、CUDA、NCCL 版本。
- 单机还是多机。
- 网卡型号、端口速率和网络协议。
- `nvidia-smi topo -m` 输出。
- 实测带宽、延迟和错误日志。

## 8. 选型建议

| 需求 | 建议 |
| --- | --- |
| 单卡能放下模型，只做推理 | 优先显存容量、显存带宽、成本和稳定性，PCIe 通常够用。 |
| 多副本推理 | 多张 PCIe GPU 就可以起步，重点看调度、KV Cache 和批处理策略。 |
| 单机 tensor parallel | 优先 NVLink / NVSwitch，避免把 TP group 放在拓扑距离远的 GPU 上。 |
| MoE 推理或训练 | 重点评估 all-to-all，优先高速互联和拓扑对称的系统。 |
| 多机训练 | 重点看 RDMA、网卡-GPU 亲和、交换机配置和 NCCL 实测。 |
| 自建集群 | 不只买 GPU，还要一起设计机箱、供电、散热、网络、存储和调度。 |

采购或租用 GPU 资源前，可以用下面的问题快速排查：

1. 模型单卡能否放下？如果不能，需要什么并行策略？
2. 并行策略主要产生 all-reduce、all-gather 还是 all-to-all？
3. 通信发生在单机内还是跨节点？
4. 单机内 GPU 之间是 PCIe、NVLink 还是 NVSwitch？
5. 跨节点是否支持 RDMA？网卡与 GPU 的拓扑是否合理？
6. 目标框架是否对该硬件组合有成熟支持？
7. 是否用真实模型或 NCCL tests 做过压测？

## 9. 常见误区

- **只看 GPU 数量**：8 张 PCIe GPU 和 8 张 NVSwitch GPU 的跨卡通信能力差异很大。
- **只看理论带宽**：实际性能还受拓扑、NCCL 算法、NUMA、网络拥塞和框架实现影响。
- **把 TP 跨到弱互联上**：TP 每层都通信，弱互联可能让多卡比少卡更慢。
- **认为 MoE 一定更快**：MoE 有 token 路由和 all-to-all 成本，互联不足时收益会下降。
- **忽略网卡位置**：多机训练中，GPU 到网卡的 PCIe / NUMA 路径会影响 RDMA 性能。

## 10. 参考

- [NVIDIA GPUDirect](https://developer.nvidia.com/gpudirect)
- [NVIDIA NVLink and NVSwitch](https://www.nvidia.com/en-us/data-center/nvlink/)
- [NVIDIA NCCL Documentation](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/)
- [PyTorch Distributed Overview](https://pytorch.org/tutorials/beginner/dist_overview.html)
