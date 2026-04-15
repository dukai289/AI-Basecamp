---
title: LLM Fine-tuning / LLM 微调
tags: [LLM微调, 大模型微调，Fine-tuning]
description: 关于 大模型微调 的基础知识。
last_update:
  date: 2026-04-15
---

# LLM Fine-tuning / LLM 微调

## 1. 基础知识

### 1.1 微调是什么，为什么需要微调?
对语言模型进行微调可以定制其行为、增强领域知识并优化其在特定任务中的性能。  
微调是通过一种称为反向传播的过程来更新语言模型“大脑”的过程。

**作用**   
通过在特定数据集上微调预训练模型（例如 Llama-3.1-8B），您可以：
+ **更新知识**：引入新的领域特定信息。
+ **自定义行为**：调整模型的语气、个性或响应风格。
+ **针对特定任务进行优化**：提高模型在特定用例中的准确性和相关性。

**应用示例**
+ 训练 LLM 模型预测新闻标题对公司的影响是正面还是负面。
+ 利用历史客户互动数据，提供更准确、更具个性化的回复。
+ 针对法律文本优化 LLM 模型，用于合同分析、案例法研究和合规性检查。

你可以把微调后的模型想象成一个专门设计的 Agent，它能够更高效地完成特定任务。  
**微调可以复制 RAG 的所有功能**，但反之则不然。

### 1.2 分类
+ 全量微调
+ 高效微调
  + LoRA(Low-Rank Adaptation)

### 1.3 方法
+ `LoRA`: 在不更新所有模型权重的情况下，只训练少量低秩矩阵，适合大多数指令微调和领域适配。
+ `QLoRA`: 结合 LoRA 和量化技术，显著降低显存占用，适合单卡或资源有限场景。
+ `reasoning(GRPO)`: 面向推理能力优化，常用于数学、代码、复杂问答等需要过程奖励的任务。
+ `vision`: 对多模态模型进行图文理解或视觉问答微调，需要准备图片和文本配对数据。
+ `reward modeling(DPO, ORPO, KTO)`: 用偏好数据对齐模型输出风格，常用于让回答更符合人类偏好。
+ `continued pretraining`: 在领域语料上继续预训练，用于补充行业知识或适配特定语言风格。

## 2. 微调的相关基本参数
+ `Learning Rate` / `学习率`:  定义了模型权重在每个训练步骤中的调整幅度。
  + 学习率越高: 训练速度越快，同时存在过拟合的风险。
  + 学习率越低: : 训练越稳定，同时可能需要更多训练轮数。
  + 典型范围：1e-4 (0.0001) 到 5e-5 (0.00005)。
+ `Epochs` / `训练轮数`：模型访问完整训练数据集的次数。
  + 推荐: 1-3 个训练轮数（通常来说，超过 3 个训练轮数并非最佳选择，除非您希望模型减少幻觉，但也降低其创造力）。
  + Epochs越多: 学习效果更好，同时过拟合的风险更高。
  + Epochs越少: 可能导致模型欠训练。
+ `per_device_train_batch_size`: 每张 GPU 每次前向/反向传播处理的样本数。
  + 值越大：吞吐更高，训练可能更快，但显存占用更高，过大容易 OOM。
  + 值越小：显存压力小，但训练更慢，梯度波动可能更明显。
+ `gradient_accumulation_steps`: 梯度累积步数，先累计多次小 batch 的梯度，再更新一次参数。
  + 值越大：等效 batch size 更大，训练更稳定，也能在小显存上模拟大 batch，但一次参数更新更慢。
  + 值越小：参数更新更频繁，训练反馈更快，但稳定性可能差一些。
+ `max_steps`: 最大训练步数，达到该步数后停止训练，通常会覆盖 `num_train_epochs`。
  + 值越大：训练更充分，但耗时更长，也更容易过拟合。
  + 值越小：训练更快，适合快速验证，但可能欠拟合、效果不够。
+ `evaluation_steps`: 每隔多少训练步执行一次评估。
  + 值越大：评估次数少，训练更快，但不容易及时发现过拟合或效果下降。
  + 值越小：监控更频繁，但评估会占用训练时间。
+ `random_state` / `seed` / `随机种子`: 固定随机性，便于复现实验。

## 3. LoRA 微调
### 3.1 LoRA 微调相关参数

| 参数 | 常见命名 | 功能 | 影响 | 推荐设置 |
|---|---|---|---|---|
| Rank of decomposition / 分解秩 | `r` | 控制 LoRA 低秩矩阵的维度，决定可训练参数量。 | 越大：表达能力更强，复杂任务效果可能更好，但显存、训练时间和过拟合风险更高。越小：更省显存、训练更快，但可能欠拟合。 | 常用 `8`、`16`、`32`、`64`；一般从 `16` 或 `32` 开始。 |
| Scaling factor / 缩放因子 | `lora_alpha` | 控制 LoRA 更新量的缩放强度，影响模型学习新任务的力度。 | 越大：学习更激进，收敛可能更快，但更容易过拟合或破坏原模型能力。越小：更新更保守，泛化更稳，但学习可能不足。 | 通常设为 `r` 的 1-2 倍，例如 `r=16` 时设 `16` 或 `32`。 |
| LoRA Dropout / LoRA 随机失活率 | `lora_dropout` | 训练时随机丢弃部分 LoRA 路径，用于正则化。 | 越大：抗过拟合更强，但训练变慢，可能欠拟合。越小：学习更充分、速度更快，但过拟合风险更高。 | 常用 `0.05`-`0.1`；小数据集可适当提高到 `0.1`-`0.2`。 |
| Target modules / 目标模块 | `target_modules` | 指定哪些模型层注入 LoRA，例如注意力层和 MLP 层。 | 模块越多：可调能力更强，效果可能更好，但显存和训练时间增加。模块越少：更轻量，但可能学不到复杂能力。 | 常见设置：`q_proj`、`k_proj`、`v_proj`、`o_proj`、`gate_proj`、`up_proj`、`down_proj`。 |
| Bias / 偏置项 | `bias` | 控制是否训练偏置参数。 | 训练更多 bias：可调参数略增，可能带来细微提升。训练更少：更快、更稳定，也更符合 LoRA 轻量化目标。 | 通常设为 `none`。 |
| Gradient checkpointing / 梯度检查点 | `use_gradient_checkpointing` | 通过重算部分中间结果来节省显存。 | 开启：显存占用更低，可训练更大模型或更长上下文，但训练更慢。关闭：训练更快，但显存压力更大。 | 显存紧张时开启；Unsloth 中可设为 `"unsloth"`。 |
| Rank-Stabilized LoRA / 秩稳定 LoRA | `use_rslora` | 使用更稳定的 LoRA 缩放方式，尤其适合较大的 rank。 | 开启：高 rank 下更稳定，可能提升效果。关闭：使用普通 LoRA，行为更简单。 | rank 较大或训练不稳定时可设为 `True`。 |
| LoftQ config / LoftQ 初始化配置 | `loftq_config` | 结合量化场景对 LoRA 权重做更好的初始化。 | 启用：量化微调效果可能更好，但配置更复杂，可能增加资源消耗。关闭：更简单，适合常规 LoRA/QLoRA。 | 不确定时设为 `None`；量化精度要求高时再尝试配置。 |

---

## 4. 工具 / 框架
+ `Llama-Factory`: 覆盖模型多、配置友好，支持 LoRA/QLoRA/DPO 等常见流程，适合快速上手和多卡训练。
+ `MS-SWIFT`: 阿里系微调框架，对 Qwen 系列支持较好，也适合做 SFT、DPO 和推理部署。
+ `Unsloth`: 重点优化单卡训练速度和显存占用，适合消费级 GPU 上做 LoRA/QLoRA。
+ `ColossalAI`: 面向大规模训练和工业场景，支持分布式、并行训练和更复杂的工程化需求。
+ `Xtuner`: OpenMMLab 生态下的微调工具，配置灵活，适合中文模型和多模态模型实验。



## 参考
### 知识
+ [Parameters for finetuning](https://docs.unsloth.ai/basics/tutorial-how-to-finetune-llama-3-and-use-in-ollama#id-5.-parameters-for-finetuning)
+ [LoRA Parameters Encyclopedia](https://docs.unsloth.ai/get-started/beginner-start-here/lora-parameters-encyclopedia)
### 实战
+ [QwQ-32B 4bit动态量化微调](https://www.bilibili.com/video/BV1wRQgYBEQb/?spm_id_from=333.1365.list.card_archive.click&vd_source=b411d1c97274b9c651c6443318813a61)
