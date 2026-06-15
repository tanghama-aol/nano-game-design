## ADDED Requirements

### Requirement: Generation Mode Selection
系统 SHALL 提供 Easy（简单模式，UI勾选拼接）与 Manual（专家模式，直接写Prompt）两种生成模式。

#### Scenario: 选择 Easy 模式
- **WHEN** 用户选择 Easy 模式
- **THEN** 系统显示 UI 勾选界面供用户配置生成参数

#### Scenario: 选择 Manual 模式
- **WHEN** 用户选择 Manual 模式
- **THEN** 系统显示文本编辑器供用户直接编写 Prompt

### Requirement: Asset Type Selection
系统 SHALL 支持选择多种资产类型。

#### Scenario: 选择 Character 类型
- **WHEN** 用户选择 Character 资产类型
- **THEN** 系统配置为生成单位、道具、建筑类资产

#### Scenario: 选择 Texture 类型
- **WHEN** 用户选择 Texture 资产类型
- **THEN** 系统配置为生成动画切片、无缝贴图类资产

#### Scenario: 选择 Scene 类型
- **WHEN** 用户选择 Scene 资产类型
- **THEN** 系统配置为生成概念图、电影级背景类资产

#### Scenario: 选择 Visual FX 类型
- **WHEN** 用户选择 Visual FX 资产类型
- **THEN** 系统配置为生成火球、爆炸、魔法特效类资产

### Requirement: Output Size Selection
系统 SHALL 提供多种输出尺寸选项。

#### Scenario: 选择输出尺寸
- **WHEN** 用户从下拉列表选择输出尺寸（如 512x512, 1024x1024, 16:9 等）
- **THEN** 系统应用该尺寸配置

### Requirement: Animation Duration
系统 SHALL 提供动画时长设置（4s QUICK 或 8s EXTENDED）。

#### Scenario: 设置动画时长
- **WHEN** 用户选择 4s QUICK 或 8s EXTENDED
- **THEN** 系统应用该时长配置

### Requirement: Style Options
系统 SHALL 提供多种样式选项开关。

#### Scenario: 启用 Centered
- **WHEN** 用户启用 Centered 选项
- **THEN** 系统确保物体在画面中央

#### Scenario: 启用 2D Style
- **WHEN** 用户启用 2D Style 选项
- **THEN** 系统强制扁平化或像素化渲染

#### Scenario: 启用 Isometric
- **WHEN** 用户启用 Isometric 选项
- **THEN** 系统底层自动追加固定透视参数（如 precise 30-degree angle）

#### Scenario: 启用 Transparent BG
- **WHEN** 用户启用 Transparent BG 选项
- **THEN** 系统底层 Prompt 自动追加 background: pure white (#FFFFFF)，并在出图后执行白底抠图运算，输出透明 PNG
