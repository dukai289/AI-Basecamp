---
title: MiniCPM-o-4.5 Web Demo
tags: [MiniCPM-o-4.5, 全双工, 多模态, web demo]
description: 全模态全双工模型 MiniCPM-o-4.5 的 Web Demo
sidebar_position: 2
---

# MiniCPM-o-4.5 Web Demo

MiniCPM-o-4.5 官方团队已经开源了完整的 Web Demo。  
如果你想在本地快速体验它的 **语音 + 视频 + 文本** 多模态交互，而不是自己从零拼前端和推理服务，这个 Demo 是最直接的入口。

它的特点可以简单理解成：

- 有现成网页界面。
- 支持 turn-based、半双工和全双工模式。
- 前后端已经打通，适合本地快速验证。

这篇不展开讲模型原理，只讲怎么把 Demo 跑起来。

---

## 1. 先看清楚它适合什么机器

官方 Demo 的主路线是：

- **Linux**
- **NVIDIA GPU**
- **显存建议大于 28GB**

另外还要准备：

- Python 3.10
- FFmpeg

如果你只是想做最稳的本地体验，建议直接按官方推荐环境来，不要一开始就在系统、Python 版本或 GPU 类型上做太多变体。

MiniCPM-o-4.5 官方说明里提到，它是一个约 **9B 参数** 的端到端 omni-modal 模型，支持图像、视频、语音、文本联合输入，并支持全双工实时交互。  
但要注意：**模型能支持，不等于 Demo 在任意机器上都能流畅。** Web Demo 更偏“完整体验版”，所以资源要求会比普通离线推理高一些。

---

## 2. 快速部署

### 安装依赖

先装 FFmpeg：

```bash
sudo apt update
sudo apt install ffmpeg
```

然后准备 Python 3.10 环境。官方推荐用 miniconda：

```bash
mkdir -p ./miniconda3_install_tmp
wget https://repo.anaconda.com/miniconda/Miniconda3-py310_25.11.1-1-Linux-x86_64.sh -O ./miniconda3_install_tmp/miniconda.sh
bash ./miniconda3_install_tmp/miniconda.sh -b -u -p ./miniconda3

source ./miniconda3/bin/activate
python --version
```

接着在项目目录里执行官方安装脚本：

```bash
source ./miniconda3/bin/activate
bash ./install.sh
```

这一步会创建 `.venv/base` 并安装依赖。  
如果网络一般，耗时会明显拉长。

### 准备配置

把示例配置复制成正式配置：

```bash
cp config.example.json config.json
```

通常最重要的是两个字段：

- `model_path`
- `gateway_port`

默认情况下，`model_path` 就是：

```text
openbmb/MiniCPM-o-4_5
```

如果你的机器能直接访问 Hugging Face，通常不需要改。  
如果你想提前把模型下载到本地，也可以先下载再把 `model_path` 指向本地目录。

例如：

```bash
pip install -U huggingface_hub
huggingface-cli download openbmb/MiniCPM-o-4_5 --local-dir /path/to/MiniCPM-o-4_5
```

然后把 `config.json` 里的 `model_path` 改成你的本地路径。

### 启动服务

最直接的启动方式是：

```bash
CUDA_VISIBLE_DEVICES=0,1,2,3 bash start_all.sh
```

启动后，浏览器访问：

```text
https://localhost:8006
```

如果浏览器提示是自签名证书，继续访问即可。  
这是官方 Demo 的默认行为，不代表服务出错。

---

## 3. 几个常见问题和实用选项

### 1. 端口怎么改

直接改 `config.json` 里的：

```json
{
  "gateway_port": 8006
}
```

改完重新启动就行。

### 2. 访问不了 Hugging Face 怎么办

官方给了两种常用替代方案：

- 用 `hf-mirror`
- 用 `ModelScope`

例如 `hf-mirror`：

```bash
pip install -U huggingface_hub
export HF_ENDPOINT=https://hf-mirror.com
huggingface-cli download openbmb/MiniCPM-o-4_5 --local-dir /path/to/MiniCPM-o-4_5
```

### 3. 全双工模式卡顿怎么办

官方文档提到，在一些老一代 GPU 上，全双工模式可能接近实时阈值，体验会有卡顿。  
这种情况下可以考虑开启 `torch.compile`。

先在 `config.json` 里打开：

```json
{
  "service": {
    "compile": true
  }
}
```

再做一次预编译：

```bash
CUDA_VISIBLE_DEVICES=0 TORCHINDUCTOR_CACHE_DIR=./torch_compile_cache .venv/base/bin/python precompile.py
```

这一步比较慢，但只需要做一次。之后重启会直接复用缓存。

### 4. 想用 Docker

官方仓库也给了 Docker 和 Docker Compose 方案。  
如果你本地环境不想直接装太多依赖，Docker 会更干净；但第一次体验时，直接跑官方脚本通常更省事。

---

## 参考

- [OpenBMB/MiniCPM-o-Demo](https://github.com/OpenBMB/MiniCPM-o-Demo)
- [OpenBMB/MiniCPM-o](https://github.com/OpenBMB/MiniCPM-o)
