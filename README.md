# Web3 初学者问答 MVP（RAG）

一个面向 Web3 小白的学习型问答 Web App：

- 输入问题（钱包 / Gas / DeFi / NFT / 授权 approve / L2 等）
- 先从本地可信资料库检索相关片段
- 再生成通俗、结构化回答，并附参考来源链接
- **仅教育用途，不构成投资/交易建议**

## 1) 本地启动（最快）

```bash
cd mvp
npm run dev
```

打开 `http://localhost:3000`。

> 未配置 `OPENAI_API_KEY` 时，会自动降级为“检索摘要模式”，仍然可用来验证检索与来源展示是否正常。

## 2) 开启大模型生成（推荐）

在 `mvp/` 下创建 `.env.local`（可参考 `.env.example`）：

```bash
OPENAI_API_KEY=你的key
OPENAI_MODEL=gpt-4o-mini
```

然后重启 `npm run dev`。

## 3) 资料库（你后续最常改的地方）

资料库在 `data/sources.json`，格式如下：

- `title`: 来源名称
- `url`: 官方/教程链接
- `content`: 你整理的“适合新手”的笔记内容（建议短段落、可检索）

你可以继续往里加条目，或把内容扩展为更多主题（桥、MEV、签名消息、冷钱包等）。

## 4) API

- `POST /api/ask`
  - body: `{ "question": "..." }`
  - 返回：`answerMarkdown` + `sources`
- `GET /api/health`

## 5) 部署（Vercel）

最省事：直接用 Vercel 部署 Next.js，并在环境变量里配置 `OPENAI_API_KEY`（可选 `OPENAI_MODEL`）。

