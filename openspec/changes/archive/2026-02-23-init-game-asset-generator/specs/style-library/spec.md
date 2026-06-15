## ADDED Requirements

### Requirement: Pixel Art Styles
系统 SHALL 提供像素风风格预设。

#### Scenario: 选择 8-bit 复古风格
- **WHEN** 用户选择 8-bit 复古像素风
- **THEN** 系统应用该风格预设

#### Scenario: 选择 16-bit 高清风格
- **WHEN** 用户选择 16-bit 高清像素风
- **THEN** 系统应用该风格预设

#### Scenario: 选择 Isometric Pixel 风格
- **WHEN** 用户选择 Isometric Pixel 等距像素风
- **THEN** 系统应用该风格预设

### Requirement: Cartoon Styles
系统 SHALL 提供卡通风风格预设。

#### Scenario: 选择日式动漫风格
- **WHEN** 用户选择 Anime 日式动漫风格
- **THEN** 系统应用该风格预设

#### Scenario: 选择美式卡通风格
- **WHEN** 用户选择 American cartoon 美式卡通风格
- **THEN** 系统应用该风格预设

#### Scenario: 选择手绘水彩风格
- **WHEN** 用户选择 Watercolor 手绘水彩风格
- **THEN** 系统应用该风格预设

### Requirement: Realistic Styles
系统 SHALL 提供写实风风格预设。

#### Scenario: 选择 PBR 材质风格
- **WHEN** 用户选择 PBR 材质风格
- **THEN** 系统应用该风格预设

#### Scenario: 选择次世代风格
- **WHEN** 用户选择 Next-gen 次世代风格
- **THEN** 系统应用该风格预设

#### Scenario: 选择照片级真实风格
- **WHEN** 用户选择 Photo-realistic 照片级真实风格
- **THEN** 系统应用该风格预设

### Requirement: Global vs Node-level Style
系统 SHALL 支持全局或节点级别的风格预设。

#### Scenario: 应用全局风格
- **WHEN** 用户在全局设置中选择风格
- **THEN** 该风格应用于所有未单独设置风格的节点

#### Scenario: 应用节点级风格
- **WHEN** 用户为特定节点选择风格
- **THEN** 该节点使用单独设置的风格，覆盖全局风格
