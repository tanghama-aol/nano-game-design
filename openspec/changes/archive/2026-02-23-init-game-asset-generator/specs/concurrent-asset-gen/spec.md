## ADDED Requirements

### Requirement: Concurrent Batch Generation
系统 SHALL 根据设定的并发数，批量调用 Nano Banana Pro 模型渲染整树资源。

#### Scenario: 启动批量生成
- **WHEN** 用户点击"批量生成"按钮
- **THEN** 系统根据设定的并发数，批量调用图像模型渲染资源树中的所有节点

#### Scenario: 资源挂载
- **WHEN** 某个节点的资源生成成功
- **THEN** 系统自动将生成的图片、精灵图挂载至左侧对应节点

### Requirement: Real-time State Saving
系统 SHALL 实时保存节点状态（草稿、等待中、生成中、已完成、失败）。

#### Scenario: 状态更新
- **WHEN** 节点状态发生变化
- **THEN** 系统实时保存该状态

### Requirement: Resume from Breakpoint
系统 SHALL 支持从失败或未生成的节点继续并发生成。

#### Scenario: 断点续传
- **WHEN** 用户在生成中断后重新启动系统
- **THEN** 系统扫描资源树，仅从失败或未生成的节点继续并发生成

### Requirement: Single Node Regeneration
系统 SHALL 支持对单一不满意节点单独修改 Prompt 并重新生成。

#### Scenario: 单个节点重新生成
- **WHEN** 用户选择某个节点，修改其 Prompt 并点击"重新生成"
- **THEN** 系统仅重新生成该节点的资源
