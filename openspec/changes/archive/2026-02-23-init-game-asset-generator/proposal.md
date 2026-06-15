## Why

独立开发者和中小型游戏工作室缺乏高效、自动化的游戏资产生产工具。现有方案要么依赖第三方路由，要么无法提供端到端的从概念到资产的工作流，且缺少本地化的状态管理、断点续传及商用级版权元数据支持。

## What Changes

- 新增基于 Nano Banana Pro (Gemini 3 Pro Image) 的游戏资源 AI 生成工具
- 实现双模式鉴权（Gemini API Key 模式和 Vertex AI 模式）
- 构建从游戏概念到完整资产包的端到端批处理工作流
- 提供可视化的资源树编辑器和精细化控制面板
- 支持并发资产生成、断点续传和单一节点重新生成
- 实现精灵图（Sprite Sheet）生成与动画预览
- 提供黄金种子库和批量一致性生成功能
- 支持带元数据的资源导出与引擎就绪功能

## Capabilities

### New Capabilities
- `api-auth`: 双模式鉴权（Gemini API Key 和 Vertex AI Service Account）及模型选择
- `concept-to-tree`: 从游戏概念文本生成资源树 JSON 结构
- `resource-tree-editor`: 可视化资源树编辑与管理
- `batch-prompt-generator`: 批量为资源树节点生成绘画提示词
- `concurrent-asset-gen`: 并发游戏资产生成与状态管理（断点续传）
- `asset-editor-panel`: 精细化资源编辑器（尺寸、视角、样式等配置）
- `style-library`: 全局或节点级风格预设管理
- `sprite-sheet-workflow`: 精灵图生成、对齐与动画预览
- `seed-consistency`: 黄金种子库与批量一致性生成
- `asset-export`: 带元数据的资源打包导出

### Modified Capabilities

## Impact

- 新增 TypeScript 全栈 Web 应用（React 前端 + Node.js 后端）
- 引入 Google AI SDK（@google/genai, @google-cloud/vertexai）
- 使用 Prisma + SQLite 进行数据持久化
- 引入 BullMQ/p-queue 进行并发任务队列管理
- 使用 sharp 进行图像处理与元数据写入
- 使用 archiver 进行资源打包导出
