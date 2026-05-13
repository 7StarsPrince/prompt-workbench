# 🖖 Prompt Workbench

语音驱动的提示词工程工作台 — 支持多LLM路由、智能话题管理、提示词模板系统。

## 功能特性

| 模块 | 功能 |
|------|------|
| **语音输入** | 浏览器原生 SpeechRecognition，支持中文连续语音识别 |
| **语音输出** | 文本自动转语音播报，可开关控制 |
| **多模型路由** | Claude / Claude Code / OpenClaw 一键切换 |
| **智能话题分组** | 基于向量嵌入的语义相似度自动归类 |
| **话题导出** | 同一话题历史记录导出为 Excel |
| **提示词模板** | Vibe Coding、AIGC分镜、数据分析等预设模板，支持自定义 |

## 技术栈

- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + better-sqlite3
- **AI**: Anthropic Claude API / OpenAI Embeddings / OpenClaw
- **Deploy**: Docker Compose

## 快速开始

### 1. 环境变量

```bash
cp backend/.env.example backend/.env
# 编辑 .env，填入以下 key：
# ANTHROPIC_API_KEY=your_key
# OPENAI_API_KEY=your_key   # 可选，用于话题语义分组
# OPENCLAW_API_KEY=your_key # 可选
```

### 2. 本地开发

```bash
# 启动后端
cd backend
npm install
npm run dev

# 启动前端（新终端）
cd frontend
npm install
npm start
```

访问 http://localhost:3000

### 3. Docker 部署

```bash
docker-compose up --build
```

## 项目结构

```
prompt-workbench/
├── backend/           # Express API
│   ├── routes/        # API路由 (llm, topics, templates)
│   ├── services/      # LLM服务封装
│   └── db/            # SQLite 数据库初始化
├── frontend/          # React SPA
│   ├── src/components/# UI组件
│   ├── src/hooks/     # 自定义Hooks
│   └── src/templates/ # 提示词模板定义
└── docker-compose.yml # 一键部署
```

## 默认提示词模板

1. **Vibe Coding** — 自然语言生成代码
2. **AIGC分镜提示词** — 剧本→AI视频分镜
3. **数据分析助手** — 数据洞察与可视化建议

支持用户自定义创建新模板。

---

*Built with 🖖 by Prompt Engineering Workbench*
