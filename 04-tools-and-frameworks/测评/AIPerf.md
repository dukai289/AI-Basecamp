# AIPerf

项目地址：https://github.com/ai-dynamo/aiperf

## 定位

AIPerf 是一个面向生成式 AI 服务的性能压测和 Profiling 工具。它不是用来评估模型回答质量的，而是用来评估推理服务在不同负载下的性能表现。

更具体地说，它适合回答这些问题：

- 某个模型服务的吞吐是多少。
- 并发升高后，请求延迟和首 token 延迟怎么变化。
- streaming 场景下，TTFT 和 ITL 是否满足要求。
- 不同推理框架、部署参数、模型版本之间的性能差异。
- 使用固定请求速率、固定并发或 trace replay 时，服务是否稳定。

可以把它理解成 LLM/VLM 推理服务的压测工具，类似 Web 服务里的 `wrk` / `hey`，但它理解大模型请求里的 token、streaming、输入长度、输出长度、数据集和多模态输入。

## 关注指标

AIPerf 会输出一组面向 LLM 服务的性能指标，常见包括：

| 指标 | 含义 | 关注点 |
| --- | --- | --- |
| TTFT | Time To First Token，首 token 延迟 | 用户第一次看到输出要等多久 |
| ITL | Inter Token Latency，token 间延迟 | streaming 过程中每个 token 的生成间隔 |
| Request Latency | 完整请求延迟 | 从请求发出到响应结束的总耗时 |
| Output Token Throughput | 输出 token 吞吐 | 服务整体生成速度 |
| Request Throughput | 请求吞吐 | 每秒能处理多少请求 |
| ISL | Input Sequence Length | 输入长度 |
| OSL | Output Sequence Length | 输出长度 |

其中：

- 看交互体验，优先关注 TTFT 和 ITL。
- 看服务容量，优先关注 token throughput 和 request throughput。
- 看高并发稳定性，关注 p50 / p90 / p99 latency，以及失败请求。

## 安装

官方 README 使用 PyPI 安装：

```bash
python3 -m venv venv
source venv/bin/activate
pip install aiperf
```

Windows PowerShell 可以对应写成：

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install aiperf
```

## 基础命令结构

核心命令是：

```bash
aiperf profile \
  --model <model-name> \
  --url <server-url> \
  --endpoint-type chat \
  --streaming
```

常用参数：

| 参数 | 作用 |
| --- | --- |
| `--model` | 要压测的模型名，需要和服务端暴露的模型名一致 |
| `--url` | 推理服务 base URL，例如 `localhost:8000` |
| `--endpoint-type` | 接口类型，Chat Completions 一般用 `chat` |
| `--endpoint` | 自定义 endpoint path，例如 `/v1/chat/completions` |
| `--api-key` | 访问需要鉴权的服务 |
| `--streaming` | 启用流式响应，用于测 TTFT / ITL |
| `--concurrency` | 并发数量 |
| `--request-rate` | 请求速率 |
| `--request-count` | 总请求数 |
| `--benchmark-duration` | 按时间运行压测 |
| `--isl` | 合成输入 token 长度均值 |
| `--osl` | 期望输出 token 长度均值 |
| `--public-dataset` | 使用内置公共数据集，例如 `sharegpt` |
| `--input-file` | 使用自定义数据集或 trace |
| `--extra-inputs` | 给请求 payload 增加额外参数，例如 temperature |

## 示例 1：压测 vLLM OpenAI-compatible 服务

先启动一个 vLLM 服务：

```bash
docker pull vllm/vllm-openai:latest

docker run --gpus all -p 8000:8000 vllm/vllm-openai:latest \
  --model Qwen/Qwen3-0.6B \
  --reasoning-parser qwen3 \
  --host 0.0.0.0 \
  --port 8000
```

检查服务是否可用：

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen3-0.6B",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 1
  }'
```

用 AIPerf 压测：

```bash
aiperf profile \
  --model Qwen/Qwen3-0.6B \
  --endpoint-type chat \
  --endpoint /v1/chat/completions \
  --streaming \
  --request-rate 32 \
  --request-count 64 \
  --url localhost:8000
```

这个例子表示：

- 请求目标是本机 `localhost:8000`。
- 使用 Chat Completions 接口 `/v1/chat/completions`。
- 开启 streaming，因此可以测 TTFT / ITL。
- 按 `32 req/s` 的请求速率发起请求。
- 总共发 `64` 个请求。

适合用来快速判断某个 vLLM 服务在指定请求速率下是否扛得住。

## 示例 2：固定并发压测

如果想看固定并发下的表现，可以用 `--concurrency`：

```bash
aiperf profile \
  --model Qwen/Qwen3-0.6B \
  --url localhost:8000 \
  --endpoint-type chat \
  --endpoint /v1/chat/completions \
  --streaming \
  --concurrency 10 \
  --request-count 100
```

这个例子表示：

- 保持 10 个并发请求。
- 总共完成 100 个请求。
- 观察 p50 / p90 / p99 延迟、TTFT、ITL 和吞吐。

适合回答“这个服务在 10 并发下表现如何”。

## 示例 3：按请求速率压测

如果想模拟线上流量入口，可以用 `--request-rate`：

```bash
aiperf profile \
  --model Qwen/Qwen3-0.6B \
  --url localhost:8000 \
  --endpoint-type chat \
  --endpoint /v1/chat/completions \
  --streaming \
  --request-rate 5.0 \
  --benchmark-duration 60
```

这个例子表示：

- 以约 `5 req/s` 的请求速率发起请求。
- 持续运行 60 秒。
- 更适合模拟稳定流量，而不是固定并发。

## 示例 4：控制输入和输出 token 长度

AIPerf 可以生成合成请求，并控制输入长度和输出长度。

```bash
aiperf profile \
  --model Qwen/Qwen3-0.6B \
  --url localhost:8000 \
  --endpoint-type chat \
  --endpoint /v1/chat/completions \
  --streaming \
  --concurrency 4 \
  --request-count 50 \
  --isl 1024 \
  --osl 256
```

这个例子适合测试较长输入、固定输出长度下的性能。

注意：

- `--isl` 是合成输入 token 长度均值。
- `--osl` 是期望输出 token 长度均值。
- 长输入会增加 prefill 压力。
- 长输出会增加 decode 压力。

## 示例 5：使用公共数据集

AIPerf 支持一些内置公共数据集，例如 `sharegpt`。

```bash
aiperf profile \
  --model Qwen/Qwen3-0.6B \
  --url localhost:8000 \
  --endpoint-type chat \
  --endpoint /v1/chat/completions \
  --streaming \
  --public-dataset sharegpt \
  --num-sessions 50
```

这个例子更接近真实对话分布，适合做模型服务的实际体验型压测。

## 示例 6：压测 Ollama 服务

官方 README 里也给了 Ollama 的快速示例。先启动 Ollama 并拉取模型：

```bash
docker run -d \
  --name ollama \
  -p 11434:11434 \
  -v ollama-data:/root/.ollama \
  ollama/ollama:latest

docker exec -it ollama ollama pull granite4:350m
```

然后运行 AIPerf：

```bash
aiperf profile \
  --model "granite4:350m" \
  --streaming \
  --endpoint-type chat \
  --tokenizer ibm-granite/granite-4.0-micro \
  --url http://localhost:11434
```

这里显式指定 `--tokenizer`，是为了让 AIPerf 能计算输入/输出 token 相关指标。

## 结果怎么看

AIPerf 运行后会在终端输出指标表，并保存结果文件，常见包括：

- `profile_export_aiperf.csv`
- `profile_export_aiperf.json`
- `logs/aiperf.log`

读结果时建议按这个顺序看：

1. 先看失败请求或错误日志，确认压测有效。
2. 再看 Request Throughput 和 Output Token Throughput，判断整体吞吐。
3. 再看 TTFT，判断用户开始看到输出的等待时间。
4. 再看 ITL，判断流式输出是否顺滑。
5. 最后看 p90 / p99 latency，判断尾延迟是否恶化。

## 适合放进评测流程的方式

可以把 AIPerf 用在这些场景：

- 新模型上线前，跑一组固定并发基准。
- 调整 vLLM 参数后，对比 TTFT、ITL 和吞吐。
- 对比不同量化版本的服务性能。
- 对比不同显卡、不同实例规格下的服务容量。
- 用固定 request rate 找到服务开始排队或超时的临界点。
- 用 ShareGPT 或自定义 trace 做更接近真实流量的压测。

## 注意事项

- 模型名必须和服务端暴露的模型名一致，否则请求会失败。
- `--url` 是 base URL，`--endpoint-type chat` 默认会使用 OpenAI-compatible 的 chat completions 路径；如果服务路径不标准，再用 `--endpoint` 显式指定。
- 开启 `--streaming` 才能更好地测 TTFT 和 ITL。
- 如果服务端不返回 usage token 数，可以考虑使用 tokenizer 或 `--use-server-token-count` 相关策略，但要确认服务端是否支持 usage 字段。
- 压测时要区分固定并发和固定请求速率：前者看并发承载，后者更像线上流量到达模式。
- 结果不要只看平均值，p90 / p99 更容易暴露排队、抖动和尾延迟问题。
- 使用公共数据集或自定义 trace 时，要确认数据分布和真实业务相似，否则压测结果只能作为参考。

## 参考资料

- AIPerf GitHub：https://github.com/ai-dynamo/aiperf
- AIPerf tutorial：https://github.com/ai-dynamo/aiperf/blob/main/docs/tutorial.md
- AIPerf CLI options：https://github.com/ai-dynamo/aiperf/blob/main/docs/cli-options.md
