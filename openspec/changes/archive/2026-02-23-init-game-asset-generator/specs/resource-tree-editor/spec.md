## ADDED Requirements

### Requirement: Tree Visualization
系统 SHALL 将 JSON 资源树渲染为左侧的项目资源管理树。

#### Scenario: 显示资源树
- **WHEN** 资源树 JSON 生成成功
- **THEN** 系统在左侧面板以文件夹结构展示（Characters, Textures, Scenes, VFX 等）

### Requirement: Node Editing
系统 SHALL 允许用户右键增、删、改节点名称及属性。

#### Scenario: 新增节点
- **WHEN** 用户在资源树中右键点击并选择"新增节点"
- **THEN** 系统在该位置创建新节点并允许用户编辑名称和属性

#### Scenario: 删除节点
- **WHEN** 用户右键点击节点并选择"删除节点"
- **THEN** 系统删除该节点及其所有子节点

#### Scenario: 修改节点
- **WHEN** 用户右键点击节点并选择"编辑节点"
- **THEN** 系统允许用户修改节点名称和属性

### Requirement: Node Drag and Drop
系统 SHALL 支持节点拖拽排序。

#### Scenario: 拖拽节点
- **WHEN** 用户拖拽节点到新位置
- **THEN** 系统更新资源树结构并保存

### Requirement: Node Status Indicator
系统 SHALL 为节点提供状态指示灯。

#### Scenario: 显示节点状态
- **WHEN** 节点具有不同状态（草稿、等待中、生成中、已完成、失败）
- **THEN** 系统显示相应的状态指示灯
