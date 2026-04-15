---
title: GPU/加速卡
tags: [GPU, 加速卡, NVIDIA, AI硬件]
description: 关于 GPU/加速卡、显存、互联和 NVIDIA 架构的基础知识。
last_update:
  date: 2026-04-15
---

# GPU/加速卡

:::info 适用范围
本文作为 AI 硬件基础速查，重点面向模型训练、推理和部署场景。架构发布时间按 NVIDIA 公开发布节点粗略记录，具体型号和规格以厂商文档为准。
:::

## 1. 基础
### 1.1 基本概念
 + GPU(Graphics Processing Unit *图形处理器*)
## 1.2 分类
 + `iGPU` (Integrated Graphics Processing Unit *集成显卡*)：运作时会借用部分的系统存储器
 + `dGPU` (Discrete Graphics Processing Unit *独立显卡*)：指卡内的RAM只会被该卡专用


## 2. GPU/加速卡
## 2.1 结构单元
GPU 可以分为三个逻辑结构：
+ **计算**: 决定算得快不快
+ **存储**: 决定模型和 KV Cache 能不能放下
+ **通信**: 决定多卡/多机协作效率。

### 2.2 计算部分

计算部分主要看 GPU 对深度学习算子的支持，而不是只看 CUDA Core 数量。  
LLM 训练和推理更依赖矩阵乘法能力、混合精度支持和框架适配。

| 概念 | 说明 | 关注点 |
| --- | --- | --- |
| CUDA Core | 通用并行计算核心，适合图形、向量和通用并行计算。 | 不是 LLM 性能的唯一指标。 |
| Tensor Core | 面向矩阵乘法和深度学习算子的专用核心。 | LLM 更关注 Tensor Core 在 FP16、BF16、FP8、INT8、INT4 等精度下的吞吐。 |
| CUDA | NVIDIA 的通用并行计算平台和编程模型。 | PyTorch、TensorFlow、vLLM、TensorRT-LLM 等生态通常优先支持 CUDA。 |
| Transformer Engine | 面向 Transformer 模型的加速能力。 | Hopper 之后更重要，常和 FP8、混合精度训练/推理相关。 |

### 2.3 存储部分

存储部分主要看显存容量和显存带宽。  
对 LLM 推理来说，显存不只放模型权重，还要放 KV Cache、CUDA workspace 和框架运行时开销。

| 概念 | 说明 | 关注点 |
| --- | --- | --- |
| 显存容量 | GPU 上可用的显存大小。 | 决定能否放下模型权重、KV Cache 和运行时开销。 |
| 显存带宽 | GPU 访问显存的速度。 | 大模型推理通常对显存带宽敏感，尤其是 batch 较小或访存压力大的场景。 |
| HBM | 高带宽显存，常见于数据中心训练/推理卡。 | H100、H200、B200、A100 等常用 HBM。 |
| GDDR | 图形显存，常见于消费级或部分工作站/推理卡。 | RTX 4090、L4、L40S 等常见于开发、视觉和推理场景。 |
| SRAM / Cache | 芯片内部高速缓存。 | 提升数据复用效率，通常不作为用户选型的显式容量指标。 |

### 2.4 通信部分

通信部分主要看 GPU 与 GPU、GPU 与主机、节点与节点之间的数据通道。  
模型越大、并行越多，通信越容易成为瓶颈。

| 概念 | 说明 | 常见场景 |
| --- | --- | --- |
| PCIe | 通用主机与设备互联。 | CPU 与 GPU 数据传输、普通服务器扩展、单机多卡基础互联。 |
| NVLink | NVIDIA GPU 间高速互联。 | 多卡训练、大模型并行、跨 GPU 通信密集任务。 |
| NVSwitch | 多 GPU NVLink 交换结构。 | HGX、DGX、NVL 等高密度 GPU 系统。 |
| RoCE / InfiniBand | 多机 GPU 集群常用网络。 | 跨节点训练、跨节点推理、参数同步和大规模集群通信。 |
| HCCS | 华为昇腾等加速卡间互联技术。 | 昇腾集群训练/推理场景。 |

## 3. 参数

看 GPU 规格时，建议优先关注下面这些参数。  
（不同厂商、不同资料里的命名可能略有差异，但含义基本接近。）

| 参数名称 | 意义 | 单位 | 举例 | 备注 |
| --- | --- | --- | --- | --- |
| 显存容量 | 单卡可用于存放模型权重、KV Cache 和运行时缓存的空间。 | GB / GiB | 24GB、48GB、80GB、141GB | LLM 推理时最先关注；显存不够时模型可能无法加载或并发受限。 |
| 显存带宽 | GPU 读写显存的速度。 | GB/s、TB/s | 1TB/s、3TB/s、4.8TB/s | 对大模型推理很重要，尤其是访存瓶颈明显时。 |
| 显存类型 | GPU 使用的显存技术。 | - | GDDR6、GDDR6X、HBM2e、HBM3、HBM3e | HBM 通常用于数据中心高端卡，带宽更高；GDDR 常见于消费级和部分推理卡。 |
| 算力 | 某种精度下的理论计算能力。 | TFLOPS、TOPS | FP16 TFLOPS、BF16 TFLOPS、FP8 TFLOPS、INT8 TOPS | 必须看对应精度；FP32 高不代表 LLM 推理一定强。 |
| 支持精度 | GPU 支持的数值格式。 | - | FP32、TF32、FP16、BF16、FP8、INT8、INT4 | 训练常看 BF16/FP8；推理常看 FP16/BF16/FP8/INT8/INT4。 |
| TDP / 功耗 | 单卡典型或最大功耗。 | W | 70W、300W、700W | 影响机房供电、散热和整机部署密度。 |
| GPU 间互联 | GPU 与 GPU 之间的高速互联能力。 | GB/s、TB/s | NVLink、NVSwitch | 多卡训练、张量并行和大模型推理更依赖它。 |
| PCIe 规格 | GPU 与主机之间的 PCIe 连接能力。 | 代际 / 通道数 | PCIe 4.0 x16、PCIe 5.0 x16 | 影响 CPU-GPU 数据传输和普通多卡服务器扩展能力。 |
| 单卡形态 | GPU 的硬件封装和部署形态。 | - | PCIe、SXM、OAM | SXM/HGX 类形态通常互联和散热更强；PCIe 更通用。 |
| 驱动与软件栈 | 驱动、CUDA、框架和推理引擎的兼容情况。 | 版本号 | CUDA 12.x、Driver 550.x、vLLM、TensorRT-LLM | 生产部署要确认驱动、框架、模型和量化方式是否兼容。 |


## 4. 架构 
## 4.1 NVIDIA Architecture

| 架构 | 发行时间 | 代表型号 | 备注 |
| --- | --- | --- | --- |
| Blackwell | 2024-03 | B200、GB200 | 面向生成式 AI 和大规模训练/推理，强调 Transformer 性能、NVLink/NVL 系统和能效。 |
| Hopper | 2022-03 | H100、H200、H800、H20 | 数据中心 AI 主力架构，引入 Transformer Engine，常用于 LLM 训练和推理。 |
| Ada Lovelace | 2022-09 | L4、L40、L40S、RTX 6000 Ada、GeForce RTX 40 系列 | 覆盖图形、视频、推理和工作站场景；L4/L40 系列常用于推理和视觉任务。 |
| Ampere | 2020 | A100、A10、A30、A40、GeForce RTX 30 系列 | A100 是上一代数据中心训练/推理常见卡；消费级 RTX 30 常用于开发和小规模推理。 |
| Turing | 2018 | T4、RTX 20 系列、Quadro RTX | T4 曾是云上推理常见选择，适合轻量推理和视频转码。 |
| Volta | 2017 | V100 | 较早的数据中心深度学习主力卡，支持 Tensor Core。 |
| Pascal | 2016 | P100、P40、P4、GeForce GTX 10 系列 | 现在更多见于存量环境，不适合优先采购用于新 LLM 工作负载。 |
| Maxwell 及更早 | 2014 及以前 | M40、M60、K80 等 | 主要是历史架构，现代 AI 框架和算子支持有限。 |

## 4.2 Ascend Architecture

| 架构 / 系列 | 发行时间 | 代表型号 | 备注 |
| --- | --- | --- | --- |
| Ascend 950 / 960 / 970 | 路线图 | Ascend 950PR、Ascend 950DT 等 | 属于后续路线图信息，适合关注生态和规划，不宜当作已普遍可采购型号处理。 |
| Ascend 910C | 2025 左右 | Ascend 910C | 华为公开演讲中提到已随 Atlas 900 A3 SuperPoD 扩大部署，常被视为 910 系列后续增强版本。 |
| Ascend 910B | 2023 左右 | Ascend 910B | 面向训练和推理的主力型号之一，国内大模型训练/推理集群中较常见。 |
| Ascend 310P | 2021 左右 | Ascend 310P | 面向推理场景，常见于 Atlas 推理卡和边缘/中心侧推理部署。 |
| Da Vinci / Ascend 910 | 2019 | Ascend 910 | 面向数据中心训练，公开发布时与 MindSpore 一起作为全栈 AI 方案推出。 |
| Da Vinci / Ascend 310 | 2018 | Ascend 310 | 面向边缘推理和低功耗 AI 场景，是华为 Ascend 系列较早公开发布的推理芯片。 |

Ascend 生态选型时，除了芯片本身，还要关注 CANN、MindSpore、PyTorch 适配、算子覆盖、模型迁移成本和集群互联能力。和 NVIDIA CUDA 生态相比，Ascend 更需要提前验证具体模型、推理框架和算子是否支持。

---

## 5. 选型

| 场景 | 优先关注 |
| --- | --- |
| 单机开发 / 实验 | 显存容量、CUDA 支持、驱动兼容、成本。 |
| LLM 推理 | 显存容量、显存带宽、Tensor Core 精度支持、KV Cache 容量、多并发吞吐。 |
| LLM 训练 / 微调 | 显存容量、GPU 间互联、BF16/FP8 能力、分布式训练框架支持。 |
| 多模态 / 视频 | 编解码能力、显存带宽、推理吞吐、图像/视频预处理链路。 |
| 多机集群 | NVLink/NVSwitch、PCIe、RoCE/InfiniBand、网络拓扑和调度系统。 |

简单判断：

- 计算：看 Tensor Core、数值精度和框架支持。
- 存储：看显存容量和显存带宽，LLM 推理要额外关注 KV Cache。
- 通信：看 PCIe、NVLink、NVSwitch 和多机网络。
- 生产部署：看整机形态、供电、散热、驱动和软件栈，不只看单卡规格。

---

## 6. 常用命令 
```bash
# lspci
sudo yum install pciutils
lspci | grep -i vga

# lshw
sudo lshw -C display

# smi
## nvidia-smi
sudo yum install nvidia-driver
nvidia-smi
## npu-smi
npu-smi info


# lsmod
lsmod | grep nvidia


# pip install nvitop
nvitop
```


## 参考

### GPU
- [WikiPedia - GPU](https://zh.wikipedia.org/wiki/%E5%9C%96%E5%BD%A2%E8%99%95%E7%90%86%E5%99%A8)

### NVIDIA

- [NVIDIA Blackwell Platform](https://investor.nvidia.com/news/press-release-details/2024/NVIDIA-Blackwell-Platform-Arrives-to-Power-a-New-Era-of-Computing/default.aspx)
- [NVIDIA Hopper Architecture](https://nvidianews.nvidia.com/news/nvidia-announces-hopper-architecture-the-next-generation-of-accelerated-computing)
- [NVIDIA Ada Lovelace RTX GPU](https://nvidianews.nvidia.com/news/nvidias-new-ada-lovelace-rtx-gpu-arrives-for-designers-and-creators)
- [NVIDIA Ada Lovelace Architecture](https://www.nvidia.com/en-us/technologies/ada-architecture/)

### Ascend

- [Huawei: Ascend 910 and MindSpore](https://www.huawei.com/en/news/2019/8/ascend-910-mindspore)
- [Huawei: Atlas 900 A3 SuperPoD](https://www.huawei.com/en/news/2025/9/hc-superpod-innovation)
- [Huawei: Xu Zhijun keynote speech at HUAWEI CONNECT 2025](https://www.huawei.com/en/news/2025/9/hc-xu-keynote-speech)
