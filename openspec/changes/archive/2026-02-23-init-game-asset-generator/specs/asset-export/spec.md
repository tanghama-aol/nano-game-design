## ADDED Requirements

### Requirement: Metadata Writing
系统 SHALL 在导出图片时自动将生成参数、提示词、模型版本和版权归属写入文件 Metadata。

#### Scenario: 写入元数据
- **WHEN** 系统导出 PNG/WebP 文件
- **THEN** 系统将生成参数、提示词、模型版本和版权归属写入文件 Metadata

### Requirement: One-click Export
系统 SHALL 支持按资源树文件夹结构一键打包导出所有资源。

#### Scenario: 一键导出
- **WHEN** 用户点击"一键导出"按钮
- **THEN** 系统按左侧资源树的文件夹结构，将整个项目的所有透明 PNG 和精灵图打包成 ZIP 文件并提供下载
