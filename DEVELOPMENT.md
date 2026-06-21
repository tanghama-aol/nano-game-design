# 开发说明

这份文档面向第一次进入项目的开发者。目标不是覆盖每一行代码，而是帮助你快速把项目跑起来、知道代码在哪里改、改完后如何验证。

## 项目是什么

Nano Game Asset Generator 是一个本地游戏美术资产设计工作台。用户输入游戏概念后，可以生成资源树、批量生成提示词、按节点生成图片资产、预览精灵图，并导出带提示词和种子信息的 ZIP 包。

项目采用 monorepo 结构：

- `apps/web`: 前端应用，React + Vite + Tailwind CSS。
- `apps/api`: 后端服务，Express + Socket.IO，负责设置、AI 调用、任务队列和导出。
- `packages/database`: Prisma + SQLite，本地持久化设置、项目和种子。
- `packages/types`: 前后端共享 TypeScript 类型。
- `packages/config-typescript`: 共享 TypeScript 配置。
- `openspec`: 产品能力规格和历史变更说明。

## 环境准备

建议使用：

- Node.js 20 或更高版本。
- pnpm，由 Corepack 管理。
- Git。

第一次进入仓库后，先安装依赖：

```bash
corepack enable
corepack pnpm install
```

如果你在 Windows PowerShell 中开发，也可以直接使用同样的命令。

## 第一次启动

按下面顺序执行：

```bash
corepack pnpm build
corepack pnpm db:push
corepack pnpm dev
```

启动后访问：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001`
- 健康检查：`http://localhost:3001/api/health`

`corepack pnpm dev` 会并行启动所有带 `dev` 脚本的工作区包。当前主要是：

- `@nano-game/web`: Vite 开发服务器。
- `@nano-game/api`: `tsx watch src/index.ts`，后端文件变更后自动重启。

## 本地配置

后端读取 `apps/api/.env`。该文件不要提交到 Git。

最小推荐配置：

```env
ENCRYPTION_KEY=your_32_byte_hex_string_here
```

AI 供应商可以在页面的 API Settings 面板里配置，也可以用环境变量配置。常见 OpenAI 或 OpenAI-compatible 配置：

```env
TEXT_PROVIDER=OPENAI
IMAGE_PROVIDER=OPENAI
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_key_or_token
OPENAI_TEXT_MODEL=gpt-5.5
OPENAI_IMAGE_MODEL=image2
```

也可以把文本和图片模型拆开：

```env
TEXT_BASE_URL=https://your-text-provider.example/v1
TEXT_API_KEY=your_text_token
TEXT_MODEL=gpt-5.5
IMAGE_BASE_URL=https://your-image-provider.example/v1
IMAGE_API_KEY=your_image_token
IMAGE_MODEL=image2
```

支持的 provider 值在 `packages/types/src/index.ts` 中定义：

- `GEMINI`
- `VERTEX`
- `OPENAI`
- `OPENAI_COMPATIBLE`
- `SIMULATED`

注意：图片生成失败时，后端队列会回退到 `placehold.co` 占位图，方便你继续调试导出和前端流程。文本树生成需要真实可用的文本模型，`SIMULATED` 文本 provider 会直接报错。

## 常用命令

在仓库根目录执行：

```bash
corepack pnpm dev
corepack pnpm build
corepack pnpm db:push
corepack pnpm db:studio
```

只构建某个包：

```bash
corepack pnpm --filter @nano-game/web build
corepack pnpm --filter @nano-game/api build
corepack pnpm --filter @nano-game/database build
corepack pnpm --filter @nano-game/types build
```

前端 lint：

```bash
corepack pnpm --filter @nano-game/web lint
```

当前根目录的 `test` 脚本还没有接入自动化测试，所以日常验证以构建、lint 和手动流程为主。

## 代码阅读路线

新手建议按这个顺序读：

1. `packages/types/src/index.ts`

   先看共享类型。这里定义了资源节点、项目、设置、AI provider、生成请求和 Socket.IO 进度事件的数据结构。

2. `apps/web/src/App.tsx`

   了解页面总布局。左侧是概念输入、换皮、提示词、种子和设置，中间是生成与资源树，右侧是编辑面板。

3. `apps/web/src/store/treeStore.ts`

   了解前端资源树状态如何增删改查。大部分 UI 组件通过 Zustand store 读写资源节点。

4. `apps/api/src/index.ts`

   了解后端入口、端口、路由挂载和 Socket.IO 初始化。

5. `apps/api/src/routes/*.ts`

   了解每个 API 的职责：

   - `settings.ts`: 保存和读取 AI 设置。
   - `generate-tree.ts`: 根据游戏概念生成资源树。
   - `generate-prompts.ts`: 批量生成资源提示词。
   - `reskin-game.ts`: 根据已有游戏名生成版权安全的改造资源树。
   - `projects.ts`: 保存、读取、生成和导出项目。

6. `apps/api/src/services/ai-provider.ts`

   了解不同 AI provider 如何解析配置、调用文本接口和图片接口。

7. `apps/api/src/services/queue.ts`

   了解图片生成任务如何排队、如何通过 Socket.IO 向前端广播进度。

8. `packages/database/prisma/schema.prisma`

   了解本地 SQLite 数据结构。

## 前后端数据流

一次典型工作流如下：

1. 用户在前端输入游戏概念。
2. `ConceptInput` 调用 `POST /api/generate-tree`。
3. 后端用文本模型生成 `IResourceNode[]` 资源树。
4. 前端把资源树写入 `useTreeStore`。
5. 用户编辑节点、提示词、风格、尺寸、帧数、透明背景和种子。
6. `GenerationPanel` 调用 `POST /api/projects/save` 保存当前树。
7. 用户点击生成，前端调用 `POST /api/projects/generate`。
8. 后端把待生成节点加入 `PQueue`。
9. 队列调用图片模型或占位图回退，并通过 Socket.IO 广播 `task:progress:{projectId}`。
10. 前端收到进度后更新节点状态和图片 URL。
11. 用户点击导出，浏览器打开 `GET /api/projects/export/:projectId` 下载 ZIP。

## 常见开发任务

### 修改页面布局或样式

优先看：

- `apps/web/src/App.tsx`
- `apps/web/src/index.css`
- `apps/web/src/App.css`
- `apps/web/src/components/*.tsx`

如果只是改某个面板，从 `App.tsx` 找到组件名，再进入对应组件。

### 新增或修改资源节点字段

通常需要同时改：

- `packages/types/src/index.ts` 中的 `IResourceNode`。
- 前端编辑组件，例如 `apps/web/src/components/EditorPanel.tsx`。
- 需要保存或导出的后端逻辑，例如 `apps/api/src/routes/projects.ts`。
- 如果字段需要数据库独立存储，再改 `packages/database/prisma/schema.prisma` 并运行 `corepack pnpm db:push`。

资源树当前是以 JSON 字符串保存在 `Project.treeData` 中，所以仅添加节点内部字段时，不一定需要改 Prisma schema。

### 新增 API 路由

建议步骤：

1. 在 `packages/types/src/index.ts` 添加请求和响应类型。
2. 在 `apps/api/src/routes/` 新建路由文件。
3. 在 `apps/api/src/index.ts` 挂载路由。
4. 在前端组件中用 `axios` 调用。
5. 执行 `corepack pnpm --filter @nano-game/api build` 验证类型。

### 修改 AI provider

优先看 `apps/api/src/services/ai-provider.ts`：

- `resolveProvider`: 决定 provider、baseUrl、apiKey、model 来自哪里。
- `generateText`: 文本模型调用入口。
- `generateImage`: 图片模型调用入口。
- `postOpenAiCompatibleText`: OpenAI-compatible 文本接口。
- `postOpenAiCompatibleImage`: OpenAI-compatible 图片接口。

改 provider 时要同时考虑 UI 设置面板、环境变量和 `.codex/config.toml` 的读取逻辑。

### 修改任务生成进度

优先看：

- 后端：`apps/api/src/services/queue.ts`
- 前端：`apps/web/src/components/GenerationPanel.tsx`
- 类型：`packages/types/src/index.ts` 的 `ITaskProgress`

Socket 事件名是：

```ts
task:progress:${projectId}
```

### 修改数据库

Prisma schema 位于：

```text
packages/database/prisma/schema.prisma
```

修改后运行：

```bash
corepack pnpm db:push
corepack pnpm --filter @nano-game/database build
```

本地 SQLite 文件位于 `packages/database/prisma/dev.db`。如果只是本地调试数据坏了，可以先备份再重新推送 schema。

## 开发约定

- 类型优先放在 `packages/types`，避免前后端各写一套结构。
- 前端跨组件共享的资源树状态放在 `treeStore`，不要在多个组件中复制状态。
- 后端路由只处理 HTTP 输入输出，AI 调用放在 `services/ai-provider.ts`，队列逻辑放在 `services/queue.ts`。
- 不要把 API key、`.env`、本地数据库备份和生成的大文件提交到 Git。
- 做跨包改动后，在根目录跑 `corepack pnpm build`。
- 做前端 UI 改动后，至少跑 `corepack pnpm --filter @nano-game/web lint` 和前端 build。

## 提交前检查

提交前建议执行：

```bash
corepack pnpm --filter @nano-game/web lint
corepack pnpm build
```

然后手动验证一条核心流程：

1. 打开 `http://localhost:5173`。
2. 配置 AI provider，或确认图片生成可以使用占位图回退。
3. 输入一个简单游戏概念并生成资源树。
4. 编辑一个节点。
5. 保存项目。
6. 生成资源。
7. 导出 ZIP。

## 常见问题

### 前端提示后端不可用

确认后端是否启动：

```bash
curl http://localhost:3001/api/health
```

如果端口被占用，可以在启动后端前设置：

```bash
$env:PORT=3002
corepack pnpm --filter @nano-game/api dev
```

注意：当前前端代码中 API 地址写死为 `http://localhost:3001`，如果改后端端口，也需要同步改前端调用地址。

### 数据库或 Prisma Client 报错

重新推送 schema 并构建数据库包：

```bash
corepack pnpm db:push
corepack pnpm --filter @nano-game/database build
```

### API key 保存后仍然不可用

检查：

- `apps/api/.env` 是否存在。
- `ENCRYPTION_KEY` 是否稳定，不要每次启动都变。
- provider 是否选对。
- base URL 是否包含 `/v1`。
- 文本模型和图片模型是否是供应商支持的模型名。

### 文本生成失败但图片生成有占位图

这是当前设计差异：文本树生成需要真实文本模型，图片队列在真实生成失败后会回退到占位图，便于开发导出和队列流程。

## 适合新手的第一个改动

可以从这些任务开始：

- 修改某个面板的文案或布局。
- 给资源节点增加一个仅前端展示的小字段。
- 给 `SettingsPanel` 增加一个输入项。
- 给 `projects.ts` 的导出信息文件增加更多元数据。
- 给 README 或 OpenSpec 补充已经确认的功能说明。

不建议一开始就改：

- AI provider 解析逻辑。
- 队列并发和 Socket.IO 事件协议。
- Prisma schema 中已有字段含义。
- 资源树递归更新逻辑。

