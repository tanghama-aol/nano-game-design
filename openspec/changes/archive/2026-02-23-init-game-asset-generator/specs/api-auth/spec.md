## ADDED Requirements

### Requirement: Dual-mode Authentication
系统 SHALL 支持两种鉴权模式：Gemini API Key 模式和 Vertex AI Service Account 模式。

#### Scenario: Gemini API Key 模式配置成功
- **WHEN** 用户在配置界面输入有效的 Google AI Studio API Key
- **THEN** 系统保存该 API Key 并允许用户使用 Gemini API Key 模式进行 API 调用

#### Scenario: Vertex AI Service Account 模式配置成功
- **WHEN** 用户上传或粘贴有效的 Google Cloud Vertex AI Service Account JSON
- **THEN** 系统保存该凭证并允许用户使用 Vertex AI 模式进行 API 调用

### Requirement: Model Selection
系统 SHALL 提供文本模型和图像模型的下拉选择器。

#### Scenario: 文本模型选择
- **WHEN** 用户点击文本模型下拉选择器
- **THEN** 系统显示可用的文本模型列表（包括 Gemini 1.5 Pro、Gemini 2.0 Flash 等）

#### Scenario: 图像模型选择
- **WHEN** 用户点击图像模型下拉选择器
- **THEN** 系统显示可用的图像模型列表（包括 gemini-2.0-flash-imagen、gemini-3-pro-image 等）

### Requirement: Concurrency Control
系统 SHALL 提供可视化的并发数设置（1~10）。

#### Scenario: 设置并发数
- **WHEN** 用户在配置界面调整并发数滑块或输入数值
- **THEN** 系统保存该并发数设置并在批量生成时使用

#### Scenario: 并发数超出范围
- **WHEN** 用户尝试设置超出 1~10 范围的并发数
- **THEN** 系统拒绝该设置并提示有效范围

### Requirement: Credential Encryption
系统 SHALL 在存储前对 API Key 和 Service Account JSON 进行 AES 加密。

#### Scenario: 凭证加密存储
- **WHEN** 用户保存 API Key 或 Service Account JSON
- **THEN** 系统使用 AES 加密后再存入数据库或本地文件

#### Scenario: 凭证解密使用
- **WHEN** 系统需要调用 API
- **THEN** 系统从存储中读取并解密凭证后使用
