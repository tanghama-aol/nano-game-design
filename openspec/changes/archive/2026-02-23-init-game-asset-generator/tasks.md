## 1. 项目初始化

- [x] 1.1 初始化 Monorepo 项目结构（pnpm + Turborepo/Nx）
- [x] 1.2 配置 TypeScript 环境
- [x] 1.3 初始化前端项目（React 18 + Vite）
- [x] 1.4 初始化后端项目（Node.js + Express/Fastify）
- [x] 1.5 配置 Prisma + SQLite 数据库
- [x] 1.6 配置前后端共享类型定义

## 2. API 鉴权模块

- [x] 2.1 实现 Gemini API Key 模式鉴权
- [x] 2.2 实现 Vertex AI Service Account 模式鉴权
- [x] 2.3 实现凭证 AES 加密存储
- [x] 2.4 实现模型选择器（文本模型和图像模型）
- [x] 2.5 实现并发数控制配置

## 3. 资源树管理

- [x] 3.1 实现概念输入界面
- [x] 3.2 实现调用 LLM 生成资源树 JSON
- [x] 3.3 实现资源树可视化渲染
- [x] 3.4 实现节点增删改功能
- [x] 3.5 实现节点拖拽排序
- [x] 3.6 实现节点状态指示灯

## 4. 提示词生成

- [x] 4.1 实现全局风格选择器
- [x] 4.2 实现批量提示词生成（调用 LLM）
- [x] 4.3 实现提示词公式应用
- [x] 4.4 实现内置负面提示词库
- [x] 4.5 实现版权词汇自动规避

## 5. 并发资产生成

- [x] 5.1 实现任务队列（BullMQ/p-queue）
- [x] 5.2 实现并发数控制
- [x] 5.3 实现实时状态保存
- [x] 5.4 实现断点续传功能
- [x] 5.5 实现单个节点重新生成
- [x] 5.6 实现 WebSocket 实时进度推送

## 6. 资源编辑器面板

- [x] 6.1 实现 Easy/Manual 模式切换
- [x] 6.2 实现资产类型选择（Character/Texture/Scene/VFX）
- [x] 6.3 实现输出尺寸选择
- [x] 6.4 实现动画时长设置
- [x] 6.5 实现样式选项开关（Centered/2D Style/Isometric）
- [x] 6.6 实现透明背景（白底抠图）

## 7. 风格库

- [x] 7.1 实现像素风风格预设（8-bit/16-bit/Isometric）
- [x] 7.2 实现卡通风风格预设（Anime/American/Watercolor）
- [x] 7.3 实现写实风风格预设（PBR/Next-gen/Photo-realistic）
- [x] 7.4 实现全局与节点级风格切换

## 8. 精灵图工作流

- [x] 8.1 实现精灵图生成约束条件
- [x] 8.2 实现快速纠错对齐按钮
- [x] 8.3 实现精灵图自动切割
- [x] 8.4 实现帧动画预览播放器

## 9. 种子与一致性

- [x] 9.1 实现黄金种子提取
- [x] 9.2 实现黄金种子库管理
- [x] 9.3 实现基础种子设置
- [x] 9.4 实现批量一致性生成

## 10. 资源导出

- [x] 10.1 实现元数据写入（生成参数、提示词、版权）
- [x] 10.2 实现按资源树结构打包
- [x] 10.3 实现 ZIP 文件生成
- [x] 10.4 实现前端 Blob 下载流

## 11. 前端 UI 与状态

- [x] 11.1 配置 TailwindCSS + Ant Design/MUI
- [x] 11.2 实现三栏布局（左资源树、中编辑器、右预览）
- [x] 11.3 实现 Zustand 本地状态管理
- [x] 11.4 实现 TanStack Query 服务端状态管理
- [x] 11.5 实现 react-complex-tree/dnd-kit 拖拽

## 12. 后端服务

- [x] 12.1 实现 RESTful API 路由
- [x] 12.2 集成 Google AI SDK（@google/genai/@google-cloud/vertexai）
- [x] 12.3 实现 sharp 图像处理与元数据写入
- [x] 12.4 实现背景去除（@imgly/background-removal-node）
- [x] 12.5 实现 archiver ZIP 打包
- [x] 12.6 配置 CORS 和 HTTPS
