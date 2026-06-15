# 游戏资源 AI 生成工具需求说明书 (PRD)

## 一、 产品概述

本应用旨在为独立开发者和中小型游戏工作室提供一个以 **Nano Banana Pro (Gemini 3 Pro Image) 为核心底座**的自动化游戏资产生产管线。应用支持从“一句话游戏概念”直接推导并生成完整的游戏资源树，并通过可视化的编辑器进行精细化控制（如尺寸、视角、动画切片等）。工具直接对接 Google 官方底层 API，提供本地化的状态管理、断点续传及商用级版权元数据支持。

## 二、 系统架构与配置需求

### 2.1 API 通信与鉴权模块

为保障数据隐私与定制化控制，系统直接对接 Google 官方底层，不使用第三方路由（如 APIYI）。

* **双模式鉴权**：  
* **Gemini API Key 模式**：供个人开发者直接填入 Google AI Studio 获取的 API Key。  
* **Vertex AI 模式**：供企业用户上传或粘贴 Google Cloud Vertex AI 项目的 Service Account JSON。  
* **模型选择器**：  
* **文本模型 (LLM)**：用于理解游戏概念、生成资源树 JSON 和批量编写 Prompt。可下拉选择 Gemini 1.5 Pro、Gemini 2.0 Flash 等。  
* **图像模型 (Image Model)**：用于实际资源渲染。可下拉选择 gemini-2.0-flash-imagen 或 gemini-3-pro-image (Nano Banana Pro)。  
* **并发控制 (Concurrency)**：提供可视化并发数设置（如 1\~10），以适配用户当前 API 级别的速率限制（RPM），避免触发 429 错误。

## 三、 全自动化游戏资源管线 (核心业务流)

系统提供从“概念”到“完整资产包”的端到端批处理工作流，具备状态机管理，支持在任意步骤修改并断点续传。

* **Step 1: 概念输入 (Concept Input)**  
* 提供多行文本框输入游戏整体描述（例：“一款赛博朋克风格2D横版过关游戏，主角是机械武士...”）。  
* **Step 2: AI 生成资源树 (Tree Generation)**  
* 调用文本大模型，输出标准 JSON 格式的整个游戏资源设计结构（按角色、环境、道具、UI分类）。  
* **Step 3: 树状图编辑与确认 (User Review)**  
* 将 JSON 渲染为左侧的“项目资源管理树”。用户可右键增、删、改节点名称及属性。  
* **Step 4: 批量提示词生成 (Prompt Generation)**  
* LLM 结合用户选择的“全局游戏风格”，为树中所有节点自动生成精准的英文绘画提示词（Prompt）与负面提示词。  
* **Step 5: 并发资产生成 (Batch Generation)**  
* 根据设定的并发数，批量调用 Nano Banana Pro 模型渲染整树资源，自动将生成的图片、精灵图挂载至左侧对应节点。  
* **进度保存与断点续传**：  
* 系统实时保存节点状态（草稿、等待中、生成中、已完成、失败）。  
* 若生成中断或断网，再次启动时系统扫描资源树，**仅从失败或未生成的节点继续并发生成**。  
* 支持对单一不满意节点单独修改 Prompt 并重新生成。

## 四、 核心功能模块需求

### 4.1 项目管理模块

* **多项目隔离**：支持创建多个独立项目，不同项目之间的资源树、设定的全局 API Key、提示词模板、黄金种子（Golden Seed）相互隔离。

### 4.2 UI 布局与工作台

* **左侧：资源管理树**：文件夹结构展示（Characters, Textures, Scenes, VFX 等），支持节点拖拽排序，具备状态指示灯。  
* **中间：配置与编辑器 (参考图片编辑器.png)**：当选中某个节点时，展示其详细生成配置。  
* **右侧：资源预览区**：大图预览、精灵图（Sprite Sheet）动画播放器、种子提取按钮。

### 4.3 资源编辑器面板 (基于参考图需求)

编辑器面板包含以下核心设置项：

* **生成模式**：Easy (简单模式，UI勾选拼接) 与 Manual (专家模式，直接写Prompt)。  
* **资产类型 (What are you making?)**：  
* Character：单位、道具、建筑。  
* Texture：动画切片、无缝贴图。  
* Scene：概念图、电影级背景。  
* Visual FX：火球、爆炸、魔法特效。  
* **输出尺寸 (Output Size)**：如下拉选择 512x512 (1:1), 1024x1024, 16:9 等。  
* **动画时长 (Duration)**：4s QUICK 或 8s EXTENDED（针对特效或精灵图序列长度的设定）。  
* **样式选项开关 (Style Options)**：  
* Centered（居中）：确保物体在画面中央。  
* 2D Style（2D风格）：强制扁平化或像素化渲染。  
* Isometric（等距视角）：开启后系统底层自动追加固定透视参数（如：precise 30-degree angle）1。  
* Transparent BG（透明背景）：**关键技术点**——勾选后，底层 Prompt 自动追加 background: pure white (\#FFFFFF) for easy extraction，并在出图后由本地程序自动执行白底抠图运算，输出真正的透明 PNG，避免模型生成假透明的黑白棋盘格 2。

### 4.4 风格选择器 (Style Library)

提供全局或节点级别的风格预设（基于 Nano Banana 的特性）3, 4：

* **Pixel Art (像素风)**：包含 8-bit 复古、16-bit 高清、Isometric Pixel (等距像素)。  
* **Cartoon (卡通风)**：日式动漫 (Anime)、美式卡通 (American cartoon)、手绘水彩 (Watercolor)。  
* **Realistic (写实风)**：PBR 材质、次世代 (Next-gen)、照片级真实 (Photo-realistic)。

### 4.5 提示词引擎与模板系统

* **底层公式套用**：采用官方推荐的 \[核心对象\] \+ \[视觉风格\] \+ \[技术参数\] \+ \[场景约束\] \+ \[质量控制\] 结构 2。  
* **内置负面提示词库**：默认附加排除元素（如 blurry, low quality, watermark, jpeg artifacts 等）以保证图像质量 5。  
* **版权合规机制**：系统文本模型在生成 Prompt 时，自动规避版权词汇（例如将“马里奥”转换为“穿红色衣服的水管工角色，原创设计”），保障商用安全 6, 7。

### 4.6 动画与精灵图 (Sprite Sheet) 工作流

* **精灵图生成**：自动在 Prompt 中追加约束条件（例："Create a 6-frame side-view walk cycle, horizontal sprite sheet, consistent proportions"）8, 9。  
* **纠错与对齐指令**：针对 AI 容易出现的错位，提供快速纠错按钮（如应用 "Align all frames on the same baseline" 重新生成）8。  
* **预览播放器**：在右侧预览区，系统可对水平排列的精灵图进行自动等距切割，并提供 Play 按钮进行帧动画循环播放预览 10。

### 4.7 种子 (Seed) 与一致性管理

* **黄金种子库**：当用户在历史记录中遇到完美符合画风的图片时，可点击“提取种子”，将其保存为该项目的“黄金标准 (Golden Seed)” 11。  
* **批量一致性生成**：支持设定基础种子（Base Seed），系统利用递增变量（如 Base Seed \+ Index）为同类物品（如一套武器）生成风格绝对一致的变体资产 11, 12。

### 4.8 资源导出与引擎就绪

* **元数据写入**：导出图片时，自动将生成参数、提示词、模型版本和版权归属写入 PNG/WebP 文件的 Metadata 中，作为合法原创凭证 7。  
* **一键导出**：支持按左侧资源树的文件夹结构，将整个项目的所有透明 PNG 和精灵图一键打包导出到本地。

## 五、 非功能性需求

1. **易用性**：UI 需高度契合 图片编辑器.png 的深色现代游戏开发工具风格，操作逻辑直观，非技术美术（Technical Artist）也可无障碍使用。  
2. **稳定性**：面对大量并发 API 请求时，必须有完善的异常捕获（如网络超时、Token 耗尽），防止应用崩溃，并能记录断点状态以备重试。  
3. **安全性**：API Key 与 JSON 凭证仅进行本地加密存储（如 SQLite 或项目本地文件中），绝对不上传至任何第三方服务器。

## 六、 技术栈选型与实现要求 (全 TypeScript Web 架构)

• **运行环境**：Node.js (LTS 版本)，使用纯 TypeScript (TS) 进行前后端分离的全栈 Web 开发。
• **架构模式**：标准的 B/S（Browser/Server）架构。前端作为纯 Web 客户端运行在浏览器中，后端作为独立的 Node.js API 服务运行。前后端通过 RESTful API 进行常规数据交互；针对耗时的 AI 批量生图任务，通过 WebSocket (如 Socket.io) 实现双向通信与实时进度推送。
• **包管理器与构建工具**：推荐使用 pnpm 结合 Turborepo/Nx 进行 Monorepo (单体仓库) 管理，方便前后端共享 TS 类型定义（如 API 接口契约）。前端使用 Vite 进行快速构建与热更新，后端可使用 tsx 或 ts-node-dev 进行开发环境热重载。

### 6.2 前端技术栈 (Web Client)

前端运行在用户浏览器中，负责实现复杂的资源管理树、生图配置面板、精灵图预览以及与后端的网络通信。
• **核心框架**：React 18 + TypeScript。提供良好的组件化和类型推导能力。
• **UI 组件库**：Ant Design 或 MUI (Material-UI) 配合 TailwindCSS。用于快速搭建高度契合“深色现代游戏开发工具风格”的界面。
• **状态管理与数据请求**：使用 Zustand 或 Redux Toolkit (RTK) 用于管理本地复杂的“项目资源树”拖拽等状态机逻辑；建议引入 TanStack Query (React Query) 专门处理服务端状态、接口缓存和 API 请求生命周期。
• **视图树与拖拽**：react-complex-tree 或 dnd-kit，用于实现左侧支持拖拽排序和右键编辑的“项目资源管理树”。
• **动画预览与图像渲染**：HTML5 `<canvas>` 配合 PixiJS (纯 TS 支持)。用于在右侧预览区对精灵图（Sprite Sheet）进行自动等距切割，并实现帧动画的循环播放预览。

### 6.3 后端核心服务栈 (Web Server)

后端作为独立 Node.js 服务运行，负责 API 路由调度、异步任务处理、图像计算及数据库持久化。
• **核心框架**：Express.js 或 Fastify (配合 TypeScript)，若需要更高阶的工程化，可使用 NestJS 以获得开箱即用的依赖注入和完善的 TS 装饰器支持。
• **数据库与 ORM**：Prisma (TypeScript) + SQLite 3 (或升级为 PostgreSQL)。Prisma 提供极佳的 TS 类型安全，用于持久化保存项目配置、黄金种子库（Golden Seed）、节点状态及断点续传记录。
• **AI 接口对接 SDK**：使用 Google 官方提供的 Node.js SDK（如 `@google/genai` 或 `@google-cloud/vertexai`），完美支持 TypeScript 类型，满足双模式鉴权（API Key 或 JSON 凭证）和模型选择需求。
• **并发与异步任务队列**：由于 Web 请求具有即时性要求，耗时的批量生图任务不能阻塞主线程。需使用 BullMQ (基于 Redis) 或基于内存的 P-Queue/fastq 构建后台任务队列。精确控制并发请求数量（如 1~10），适配 Google API 的速率限制（RPM）防止 429 报错，并通过 WebSocket 将队列进度实时同步给前端。
• **图像与元数据处理**：sharp (TypeScript bindings)。这是 Node.js 生态中最强大的图像处理库，用于：

1. 提取生成图片并写入生成参数、提示词、版权归属等 Metadata 元数据。
2. 配合纯 JS/TS 的背景去除库（如 `@imgly/background-removal-node`），在服务器端执行白底抠图运算，输出真正的透明 PNG。
• **资产打包与导出**：**（重点架构差异）** 由于 Web 无法像 Electron 那样静默写入用户本地磁盘，后端需使用 `archiver` 等模块，根据内存或数据库中的资源树结构，在服务器端动态生成 ZIP 压缩包，前端通过触发文件下载流（Blob/Stream）的方式将资产导出到本地。

### 6.4 安全与加密模块

• **凭证加密**：Node.js 原生 crypto 模块。用户输入的 Gemini API Key 与 Vertex JSON 凭证在存入后端数据库前，必须通过 crypto 进行 AES 加密存储，保证即使数据库文件泄露，凭证也相对安全。
• **通信与接口安全**：前后端分离架构下，需在后端配置 CORS (跨域资源共享)。生产环境必须强制启用 HTTPS (TLS/SSL) 保证数据传输加密，防止 API Key 等敏感信息在网络传输中被拦截。可引入 JWT (JSON Web Token) 进行基础的 API 接口鉴权。


## 七、 google vertex ai 配置
VERTEX_PROJECT_ID=atomic-nation-480601-r3
VERTEX_LOCATION=global
GOOGLE_APPLICATION_CREDENTIALS=/home/ubuntu/projects/banana-slides/tang-vertex.json
