## ADDED Requirements

### Requirement: Golden Seed Extraction
系统 SHALL 允许用户从历史生成的图片中提取种子并保存为黄金种子。

#### Scenario: 提取黄金种子
- **WHEN** 用户在预览区点击"提取种子"按钮
- **THEN** 系统提取该图片的种子并保存为该项目的黄金种子

### Requirement: Batch Consistency Generation
系统 SHALL 支持设定基础种子，使用递增变量为同类物品生成风格一致的变体资产。

#### Scenario: 使用基础种子生成
- **WHEN** 用户设定基础种子（Base Seed）并启动批量生成
- **THEN** 系统利用递增变量（如 Base Seed + Index）为同类物品生成风格绝对一致的变体资产
