## ADDED Requirements

### Requirement: Global Style Selection
系统 SHALL 允许用户选择全局游戏风格。

#### Scenario: 选择全局风格
- **WHEN** 用户从风格库中选择一个全局游戏风格
- **THEN** 系统保存该风格并在批量生成提示词时应用

### Requirement: Batch Prompt Generation
系统 SHALL 为资源树中所有节点自动生成英文绘画提示词与负面提示词。

#### Scenario: 成功生成批量提示词
- **WHEN** 用户点击"生成提示词"按钮
- **THEN** 系统结合全局游戏风格，为所有节点自动生成精准的英文绘画提示词（Prompt）与负面提示词

### Requirement: Prompt Formula Application
系统 SHALL 采用官方推荐的 [核心对象] + [视觉风格] + [技术参数] + [场景约束] + [质量控制] 结构。

#### Scenario: 应用提示词公式
- **WHEN** 系统为节点生成提示词
- **THEN** 系统按照官方推荐的公式结构生成提示词

### Requirement: Built-in Negative Prompts
系统 SHALL 默认附加排除元素（如 blurry, low quality, watermark, jpeg artifacts 等）以保证图像质量。

#### Scenario: 附加负面提示词
- **WHEN** 系统为节点生成提示词
- **THEN** 系统自动附加内置的负面提示词库内容

### Requirement: Copyright Compliance
系统 SHALL 在生成 Prompt 时自动规避版权词汇。

#### Scenario: 版权词汇规避
- **WHEN** 文本模型生成 Prompt 时检测到版权词汇（例如"马里奥"）
- **THEN** 系统自动将其转换为非版权描述（例如"穿红色衣服的水管工角色，原创设计"）
