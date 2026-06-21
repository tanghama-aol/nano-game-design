## ADDED Requirements

### Requirement: Concept Design Package Generation
The system SHALL generate a complete first-pass design package from a user supplied game concept.

#### Scenario: Generate a complete design package
- **WHEN** the user submits a non-empty game concept
- **THEN** the system returns a design document, an editable resource tree, and node-level resource description prompts

### Requirement: Structured Design Document
The generated design package SHALL include a structured design document with gameplay direction and production guidance.

#### Scenario: Display design intent
- **WHEN** the design package is generated successfully
- **THEN** the response includes title, genre, player fantasy, core loop, art direction, key mechanics, content pillars, and production notes

### Requirement: Resource Tree With Node Prompts
The generated design package SHALL include resource tree nodes compatible with the existing asset workflow.

#### Scenario: Apply generated tree
- **WHEN** the frontend receives the generated resource tree
- **THEN** each node has an id, name, type, prompt, pending status, and optional children compatible with existing tree editing and asset generation

### Requirement: Frontend Design Document View
The frontend SHALL display the generated design document alongside the resource tree workflow.

#### Scenario: Inspect generated design document
- **WHEN** a design package has been generated
- **THEN** the user can review the design document without leaving the workbench
