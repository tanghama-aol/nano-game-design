## Why

Users can currently generate an asset tree from a game concept, then run a separate prompt enrichment step. That leaves no structured design document and forces users to infer how the tree relates to the intended game direction. A one-shot design package makes the concept-to-production handoff clearer: refined design intent, resource hierarchy, and per-node asset prompt are returned together.

## What Changes

- Add a concept design package API that accepts a user concept and optional global style.
- Return a refined game design document alongside the resource tree.
- Ensure every resource tree node includes a production-ready resource description prompt.
- Add frontend state and UI for displaying the generated design document.
- Update the concept input workflow so users can generate the full package in one action while preserving existing tree and prompt editing flows.

## Capabilities

### New Capabilities
- `concept-design-package`: Generate a structured design package containing a design document, resource tree, and node-level resource prompts.

### Modified Capabilities
- `concept-to-tree`: The concept input workflow can now populate the tree from a full design package.
- `batch-prompt-generator`: Existing prompt enrichment remains available as a follow-up refinement step.

## Impact

- Adds shared TypeScript types for design packages and design documents.
- Adds one Express route under the API service.
- Adds local frontend state for the generated design document.
- Adds a compact design document panel to the workbench.
