# vLLM


## `vllm serve` 常用参数
[官方文档 docs.vllm.ai/cli/serve](https://docs.vllm.ai/en/latest/cli/serve/)
### 网络与鉴权
+ `--host`: 默认 `127.0.0.1` / `0.0.0.0`
+ `--port`: 默认 `8000`
+ `--api-key`:为 OpenAI 兼容接口增加鉴权。
+ `--allowed-origins`: CORS 允许的来源。常见场景：浏览器前端单独部署时限制来源域名。
+ `--ssl-keyfile` & `--ssl-certfile`: 启用 HTTPS 所需的私钥和证书文件。
### 日志
+ `--enable-log-requests`: 同时开启`VLLM_LOGGING_LEVEL=DEBUG`后prompt在日志中的`details: prompt`
+ `--enable-log-outputs`: 同时开启`VLLM_LOGGING_LEVEL=DEBUG`后output在日志中的`(streaming complete): output`
### 模型
+ `--model`: 模型名称或本地模型路径（Hugging Face 仓库名、本地目录）。
+ `--served-model-name`: 对外提供的模型名称
+ `--download-dir`: 模型下载和加载缓存目录。
+ `--trust-remote-code`: 允许执行 Hugging Face 仓库中的自定义代码。注意：只对可信模型开启。
+ `--dtype`: 模型权重和激活的数据类型，常见写法：`auto`、`half`、`float16`、`bfloat16`、`float`、'float32'。
+ `--kv-cache-dtype`: 
+ `--quantization` / `-q`: 
+ `--load-format`: 指定权重加载格式，如 `auto`、`safetensors`、`pt`、`gguf`。
+ `--max-model-len`: 模型最大上下文长度，包含输入和输出。常见写法：`4096`、`8192`、`32768`、`32K`。
+ `--tokenizer`: 单独指定 tokenizer；不指定时通常跟随 `--model`。
+ `--chat-template`: 把 OpenAI 风格的 messages，翻译成具体模型 prompt 格式的规则文件。示例`/path/to/template.jinja`
+ `--default-chat-template-kwargs`: JSON格式设置默认`chat-template`参数
### 工具、推理、多模态
+ `--enable-auto-tool-choice`: 允许模型自动决定是否调用工具。
+ `--tool-call-parser`: 指定工具调用结果的解析器。常见写法：与具体模型匹配，例如 `qwen3_coder`。
+ `--reasoning-parser`: OpenAI API格式下reasoning内容解析器。常见写法：按模型选择，比如 `qwen3`。
+ `--default-chat-template-kwargs`:  如 `'{"thinking": true}'`
+ `--language-model-only`: 对多模态模型关闭图像、视频等输入，只保留语言模型能力。
+ `--limit-mm-per-prompt`: 限制每个请求中每种模态可输入的数量。如`'{"image": 1, "video": 1}'`
### 性能相关
+ `--enforce-eager`: 强制使用 eager 模式，禁用 CUDA graph。 常见场景：排查兼容性问题时使用。
+ `--gpu-memory-utilization`: 当前vLLM实例最多使用GPU显存的比例。常见写法：`0.8`、`0.85`、`0.9`。
+ `--max-num-seqs`: 单次迭代允许同时处理的最大序列数。常见写法：`8`、`16`、`32`。
+ `--max-num-batched-tokens`: 单次迭代最多处理多少 token。
+ `--pipeline-parallel-size` / `-pp`: 流水线并行规模。常见场景：超大模型或跨节点部署。
+ `--data-parallel-size` / `-dp`: 数据并行副本数。常见场景：提高吞吐。
+ `--tensor-parallel-size` / `-tp`: 张量并行规模。常见场景：单机多卡部署大模型。
+ `--enable-expert-parallel` / `-ep`: 在MoE层使用EP代替tp。
+ `--cpu-offload-gb`: 每张 GPU 可卸载到 CPU 的权重大小（GiB）。常见场景：显存不足但 CPU 内存充足。
+ `--kv-cache-dtype`: KV Cache 的数据类型。常见写法：`auto`、`bfloat16`、`fp8`。
+ `--distributed-executor-backend`: 分布式执行后端，常见为 `mp` 或 `ray`。
### 其它
+ `--seed`: 随机种子，用于复现。
+ `--master-addr` & `--master-port` & `--nnodes` & `--node-rank`: 多机部署时的主节点地址、端口、节点总数和当前节点编号。
+ `--speculative-config`: Speculative decoding configuration. [SpeculativeConfig](https://docs.vllm.ai/en/latest/api/vllm/config/#vllm.config.SpeculativeConfig)。示例用法：`'{"method":"qwen3_next_mtp","num_speculative_tokens":2}'`

---

## Parallel
+ Data parallel: 有几个数据副本
+ Tensor parallel: 几张卡支持1个模型。
+ Expert parallel
+ Pipeline parallel

---

## dtype
`--dtype`
Possible choices: auto, bfloat16, float, float16, float32, half
Data type for model weights and activations:
+ "auto" will use FP16 precision for FP32 and FP16 models, and BF16 precision for BF16 models.
+ "half" for FP16. Recommended for AWQ quantization.
+ "float16" is the same as "half".
+ "bfloat16" for a balance between precision and range.
+ "float" is shorthand for FP32 precision.
+ "float32" for FP32 precision.
Default: auto

---

## 多模态
图片下载、转成PIL Image再通过Vision Encoder转为tensor/embedding等步骤都是vllm来完成的

---
