## Context

本项目是一个全新的游戏资源 AI 生成工具，旨在为独立开发者和中小型游戏工作室提供自动化的游戏资产生产管线。当前状态是从零开始构建，没有现有的代码库需要迁移。

**关键约束：**
- 必须使用 TypeScript 进行全栈 Web 开发
- 直接对接 Google 官方 API，不使用第三方路由
- API Key 和凭证仅本地加密存储，不上传第三方服务器

## Goals / Non-Goals

**Goals:**
- 构建从游戏概念到完整资产包的端到端工作流
- 提供双模式鉴权（Gemini API Key 和 Vertex AI）
- 实现并发资产生成和断点续传功能
- 提供可视化资源树编辑和精细化控制面板
- 支持精灵图生成与动画预览

**Non-Goals:**
- 不实现 Electron 桌面应用（使用纯 Web B/S 架构）
- 不实现在线协作功能
- 不实现云端资产托管

## Decisions

### 1. 技术栈选型
**决策：** 使用 React 18 + TypeScript + Node.js + Express/Fastify 全栈架构
**理由：**
- TypeScript 提供优秀的类型安全和开发体验
- React 生态成熟，适合构建复杂 UI
- Node.js 后端与 Google AI SDK 兼容性好
**替代方案：** Vue.js + Python（舍弃，Python 在图像处理上虽强但 Google AI 的 TS SDK 更成熟）

### 2. 数据库选择
**决策：** 使用 Prisma + SQLite（初期），未来可升级到 PostgreSQL
**理由：**
- SQLite 零配置，适合本地开发和部署
- Prisma 提供极佳的 TypeScript 类型安全
- 易于迁移到 PostgreSQL 应对更大规模
**替代方案：** 纯文件存储（舍弃，无法提供高效查询和事务支持）

### 3. 并发任务队列
**决策：** 使用 BullMQ（基于 Redis）或 p-queue（内存队列）
**理由：**
- BullMQ 提供持久化、优先级、重试等企业级特性
- p-queue 更轻量，适合初期开发
- 两者都支持精确控制并发数，避免 API 限流
**替代方案：** 原生 Promise.all（舍弃，无法处理断点续传）

### 4. 图像处理库
**决策：** 使用 sharp 进行图像处理，配合 @imgly/background-removal-node 进行背景去除
**理由：**
- sharp 是 Node.js 生态中性能最好的图像处理库
- 支持元数据写入和各种图像格式转换
**替代方案：** Jimp（舍弃，性能较差）

### 5. 前端状态管理
**决策：** 使用 Zustand 管理本地状态，TanStack Query 处理服务端状态
**理由：**
- Zustand 轻量且 API 简洁，适合管理资源树等复杂状态
- TanStack Query 提供缓存、重试等强大的 API 请求管理
**替代方案：** Redux Toolkit（舍弃， boilerplate 较多）

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Google API 限流导致生成失败 | 实现可视化并发数控制，内置重试机制和断点续传 |
| 透明背景生成效果不佳 | 使用白底 + 本地抠图方案，提供手动微调选项 |
| 纯 Web 架构无法直接写入用户磁盘 | 使用服务器端 ZIP 打包 + 前端 Blob 下载流 |
| API Key 安全问题 | 使用 AES 加密本地存储，强制 HTTPS 传输 |
