## ADDED Requirements

### Requirement: Sprite Sheet Generation
系统 SHALL 在 Prompt 中自动追加精灵图生成约束条件。

#### Scenario: 生成精灵图
- **WHEN** 用户选择生成精灵图
- **THEN** 系统在 Prompt 中自动追加约束条件（例如："Create a 6-frame side-view walk cycle, horizontal sprite sheet, consistent proportions"）

### Requirement: Alignment Correction
系统 SHALL 提供快速纠错按钮来对齐精灵图帧。

#### Scenario: 应用对齐指令
- **WHEN** 用户点击"对齐帧"按钮
- **THEN** 系统应用 "Align all frames on the same baseline" 等指令重新生成

### Requirement: Sprite Sheet Preview Player
系统 SHALL 对水平排列的精灵图进行自动等距切割，并提供 Play 按钮进行帧动画循环播放预览。

#### Scenario: 预览精灵图动画
- **WHEN** 用户选中带有精灵图的节点并点击 Play 按钮
- **THEN** 系统自动等距切割精灵图并进行帧动画循环播放预览
