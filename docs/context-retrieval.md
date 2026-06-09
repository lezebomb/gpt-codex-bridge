# Context Retrieval

Bridge 的上下文系统以 `retrieve_context` 为默认入口，避免网页端 GPT 吃大量无关 token。

## Context budget

- `small`: 默认，小文件数、小 snippet。
- `medium`: 更适合中等任务。
- `large`: 只在确实需要更宽上下文时使用。

默认 `includeFullFiles=false`。`create_context_pack` 会优先包含 rules summary、matched skills、project summary、retrieve_context results、relevant snippets、suggestedNextReads，再按需加入文件摘录。

## Symbol extraction

当前使用轻量 regex extractor，不引入 LangChain/LlamaIndex/tree-sitter 重依赖。支持 JS、TS、TSX、JSX、Python 的常见：

- `exportedSymbols`
- `detectedComponents`
- `functions`
- `classes`
- `imports`
- `routes`
- `testFiles`
- `relatedFiles`

