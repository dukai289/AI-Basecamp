---
title: 使用 vllm 部署 Qwen3.5
tags: [Qwen3.5, vLLM, 模型部署]
description: 使用 vllm 部署 Qwen3.5 系列模型
sidebar_position: 1
---

# 使用 vllm 部署 Qwen3.5 系列模型

这篇只讲一件事：**用 vLLM 把 Qwen3.5 系列模型跑成 OpenAI 兼容接口**。  
如果你只是想先把服务启动起来，直接看“快速部署”这一节就够了。

Qwen 官方模型卡已经给出了 Qwen3.5 与 vLLM 的推荐启动方式，vLLM 官方 recipes 也补充了长上下文、工具调用和高吞吐场景下的建议。对大多数本地部署场景来说，常用路线其实很简单：

- 安装较新的 vLLM。
- 选择合适的 Qwen3.5 模型。
- 用 `vllm serve` 暴露 OpenAI 兼容接口。
- 视情况打开工具调用、长上下文或 `--language-model-only`。

---

## 1. 先选模型，再决定怎么部署

Qwen3.5 系列已经兼容 Hugging Face Transformers、vLLM、SGLang 等推理框架。  
如果你是第一次部署，建议先从 27B 或 35B-A3B 开始。

| 模型 | 特点 | 适合场景 |
| --- | --- | --- |
| `Qwen/Qwen3.5-27B` | Dense 版本，部署逻辑相对直接 | 通用推理、代码、Agent、长期稳定服务 |
| `Qwen/Qwen3.5-35B-A3B` | MoE 版本，35B 总参数、3B 激活参数 | 更看重吞吐和成本效率的场景 |

需要先知道两点：

- Qwen3.5 默认上下文长度是 **262,144 tokens**。
- Qwen3.5 默认是 **thinking mode**，通常会先输出 `<think>...</think>`，再给正式答案。

如果你机器资源有限，不要一上来就照着 262K 上下文去跑。  
实际部署里，`--max-model-len` 往往是第一个要收缩的参数。

---

## 2. 快速部署

### 环境准备

官方示例推荐使用较新的 vLLM 版本。一个最简单的安装方式是：

```bash
uv venv
source .venv/bin/activate
uv pip install vllm --torch-backend auto --extra-index-url https://wheels.vllm.ai/nightly
```

如果你已经有 Python 环境，也可以直接安装到现有虚拟环境里。

### 最小可用启动命令

以 `Qwen/Qwen3.5-27B` 为例：

```bash
vllm serve Qwen/Qwen3.5-27B \
  --port 8000 \
  --tensor-parallel-size 8 \
  --max-model-len 262144 \
  --reasoning-parser qwen3
```

如果你想部署 `Qwen/Qwen3.5-35B-A3B`，只需要把模型名替换掉：

```bash
vllm serve Qwen/Qwen3.5-35B-A3B \
  --port 8000 \
  --tensor-parallel-size 8 \
  --max-model-len 262144 \
  --reasoning-parser qwen3
```

启动后，服务默认在：

```text
http://localhost:8000/v1
```

这就是 OpenAI 兼容接口地址。

### 快速验证

可以直接用 `curl` 测一下：

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen3.5-27B",
    "messages": [
      {"role": "user", "content": "用一句话解释什么是 vLLM"}
    ]
  }'
```

如果你不想看到思考内容，可以在请求侧显式关闭 thinking：

```json
{
  "extra_body": {
    "enable_thinking": false
  }
}
```

---

## 3. 部署时最常用的几个选项

### 1. 文本优先场景

Qwen3.5 是带视觉编码器的模型。如果你的服务主要跑纯文本对话、代码或 Agent，可以打开：

```bash
--language-model-only
```

例如：

```bash
vllm serve Qwen/Qwen3.5-35B-A3B \
  --port 8000 \
  --tensor-parallel-size 8 \
  --max-model-len 262144 \
  --reasoning-parser qwen3 \
  --language-model-only
```

这个选项的作用很直接：**不加载视觉部分，释放更多显存给 KV Cache 和并发请求。**

### 2. 工具调用场景

如果你要给 Qwen3.5 开工具调用，可以加上：

```bash
--enable-auto-tool-choice --tool-call-parser qwen3_coder
```

完整示例：

```bash
vllm serve Qwen/Qwen3.5-27B \
  --port 8000 \
  --tensor-parallel-size 8 \
  --max-model-len 262144 \
  --reasoning-parser qwen3 \
  --enable-auto-tool-choice \
  --tool-call-parser qwen3_coder
```

### 3. 更长上下文

Qwen 官方建议：如果要超过原生 262K 上下文，可以用 YaRN 这类 RoPE scaling 方式扩展。  
vLLM 里通常会配合 `VLLM_ALLOW_LONG_MAX_MODEL_LEN=1` 和 `--hf-overrides` 一起使用。

一个常见示例是：

```bash
export VLLM_ALLOW_LONG_MAX_MODEL_LEN=1

VLLM_ALLOW_LONG_MAX_MODEL_LEN=1 vllm serve Qwen/Qwen3.5-27B \
  --tensor-parallel-size 8 \
  --max-model-len 1010000 \
  --reasoning-parser qwen3 \
  --hf-overrides '{"text_config": {"rope_parameters": {"mrope_interleaved": true, "mrope_section": [11, 11, 10], "rope_type": "yarn", "rope_theta": 10000000, "partial_rotary_factor": 0.25, "factor": 4.0, "original_max_position_embeddings": 262144}}}'
```

但要注意：**长上下文不只是能不能开的问题，更是显存、吞吐和稳定性的问题。**  
如果你是第一次部署，建议先把服务跑稳，再考虑拉长上下文。

### 4. 一个简单的实战建议

如果你现在只是想先把服务上线，可以按下面的顺序：

1. 先用 `Qwen/Qwen3.5-27B` 起服务。
2. 把 `--max-model-len` 调小到你机器能稳定跑的值。
3. 确认接口、日志、显存占用都正常。
4. 再决定要不要开工具调用、长上下文或换到 `35B-A3B`。

这比一开始就把所有功能一起打开更稳。

---

## 参考

- [Qwen/Qwen3.5-27B](https://huggingface.co/Qwen/Qwen3.5-27B)
- [Qwen/Qwen3.5-35B-A3B](https://huggingface.co/Qwen/Qwen3.5-35B-A3B)
- [Qwen3.5 Usage Guide - vLLM Recipes](https://docs.vllm.ai/projects/recipes/en/latest/Qwen/Qwen3.5.html)
