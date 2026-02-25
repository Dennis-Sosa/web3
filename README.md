# Web3 初学者问答 MVP（RAG）

一个面向 Web3 小白的学习型问答 Web App：

- 输入问题（钱包 / Gas / DeFi / NFT / 授权 approve / L2 等）
- 先从本地可信资料库检索相关片段
- 再生成通俗、结构化回答，并附参考来源链接
- **仅教育用途，不构成投资/交易建议**

## 1) 本地启动（最快）

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

> 未配置 `OPENAI_API_KEY` 时，会自动降级为“检索摘要模式”，仍然可用来验证检索与来源展示是否正常。

## 2) 开启大模型生成（推荐）

在**仓库根目录**创建 `.env.local`（可参考 `.env.example`）：

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

### 课程 PPT / 本地笔记（自动纳入检索）

除了 `data/sources.json`，本项目还会**自动把本地资料库笔记**纳入 RAG 检索：

- 放置路径：`mvp/library/notes/**/*.md`
- 打开资料库入口页：`/library`
- 资料笔记页：`/library/notes/<path>.md`

这样你每次把新上传资料整理成 Markdown 笔记放进 `library/notes/`，就会自动进入“可检索资料库”，不需要手动拷贝进 `data/sources.json`。

### 自动 QA 更新（推荐问题）

首页的“推荐问题（来自你上传的资料库笔记）”来自接口：

- `GET /api/qa`

抽取规则（最简单、最稳健）：

- 如果笔记里包含 `## 复习自测` / `## 自测` / `## Quiz` 小节，会从该小节的编号列表中抽取问题作为 QA（因此**你每次新增笔记/更新笔记，自然会有新的 QA**）。

## 4) Debug：查看本次命中的检索片段

UI 里有一个 **“查看检索片段（debug）”** 开关：

- 关闭：只展示回答与参考来源
- 开启：会额外展示本次检索命中的资料库片段（含 score/摘录），便于你验证 RAG 是否“真的用到了资料库”

## 4) API

- `POST /api/ask`
  - body: `{ "question": "..." }`
  - 返回：`answerMarkdown` + `sources`
- `GET /api/health`

## 5) 常见问题

### 端口/监听问题

如果你在某些受限环境里启动 dev server 报监听地址权限问题，可以改为只监听本机：

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

### 额度/计费问题（429 quota）

如果你配置了 Key 但返回 `429 You exceeded your current quota`，这是 OpenAI 侧额度/计费问题；本项目会自动降级为“检索摘要模式”，你仍然可以先验证检索与来源展示。

## 6) 部署（Vercel）

最省事：直接用 Vercel 部署 Next.js，并在环境变量里配置 `OPENAI_API_KEY`（可选 `OPENAI_MODEL`）。

### 环境变量（推荐）

- **LLM（完整体验）**
  - `OPENAI_API_KEY`（必填）
  - `OPENAI_MODEL`（可选，默认 `gpt-4o-mini`）
- **公开 demo 建议开启：访问口令/邀请码**
  - `DEMO_PASS`：设置后，`POST /api/ask` 必须携带口令，否则返回 401
    - 方式 1：header `x-demo-pass: <pass>`
    - 方式 2：JSON body `{"demoPass":"<pass>"}`
  - 首页 UI 已提供“邀请码（可选）”输入框，会把口令存到浏览器本地并自动带上请求
- **基础限流（防止被刷）**
  - `RATE_LIMIT_MAX`：窗口期内最大请求数（默认 20）
  - `RATE_LIMIT_WINDOW_MS`：窗口期毫秒数（默认 60000）

> 安全提示：不要把 `.env.local` 分享/上传；如果你曾经泄露过 Key，请立刻在 OpenAI 控制台撤销并重新生成。

