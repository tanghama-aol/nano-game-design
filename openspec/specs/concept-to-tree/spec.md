## ADDED Requirements

### Requirement: Concept Input
系统 SHALL 提供多行文本框用于输入游戏整体描述。

#### Scenario: 输入游戏概念
- **WHEN** 用户在概念输入框中输入游戏描述（例如："一款赛博朋克风格2D横版过关游戏，主角是机械武士..."）
- **THEN** 系统保存该输入并允许用户触发资源树生成

### Requirement: Tree Generation
系统 SHALL 调用文本大模型，输出标准 JSON 格式的游戏资源设计结构。

#### Scenario: 成功生成资源树
- **WHEN** 用户点击"生成资源树"按钮
- **THEN** 系统调用文本大模型，按角色、环境、道具、UI分类生成标准 JSON 格式的资源树结构

#### Scenario: 资源树生成失败
- **WHEN** 文本大模型调用失败或返回无效 JSON
- **THEN** 系统显示错误信息并允许用户重试
