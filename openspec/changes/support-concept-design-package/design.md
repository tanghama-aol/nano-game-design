## Context

The app is a React + TypeScript workbench with an Express API. Existing generation is split across:

- `/api/generate-tree`: concept to asset tree.
- `/api/generate-prompts`: asset nodes to enriched image prompts.

The requested workflow should not remove those existing steps. It should add a higher-level orchestration path for a complete first draft.

## Goals / Non-Goals

**Goals:**
- Generate a concise but structured game design document from the user's concept.
- Generate an editable `IResourceNode[]` tree in the existing shape.
- Populate every tree node `prompt` with a resource description prompt suitable for image generation.
- Surface the design document in the frontend without blocking existing resource editing and generation.

**Non-Goals:**
- Persist design documents in the database.
- Generate images automatically after creating the design package.
- Replace manual prompt editing or the existing prompt enrichment endpoint.

## Decisions

### 1. Single LLM Call for Coherence

Use one text generation call for the full design package. This gives the design document, resource tree, and node prompts shared context, reducing mismatch between gameplay direction and asset prompts.

### 2. Shared Package Type

Add shared interfaces in `@nano-game/types` so the frontend and API agree on response shape:

- `IGameDesignDocument`
- `IGenerateDesignPackageRequest`
- `IGenerateDesignPackageResponse`

### 3. Defensive Normalization

The API normalizes model output before returning:

- Generate missing IDs.
- Force node status to `pending`.
- Ensure children arrays are recursively normalized.
- Fill missing prompt/style/dimensions defaults where necessary.

### 4. Frontend State Stays Local

Store the generated design document in the existing Zustand tree store. This keeps the feature small and avoids expanding project persistence before users validate the workflow.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Model returns markdown or malformed JSON | Strip markdown fences and parse JSON in the API, returning a clear error on failure. |
| Design document is too verbose for the current UI | Render compact sections and lists in a scrollable panel. |
| Node prompts are inconsistent with later style changes | Keep the existing prompt enrichment panel as the follow-up refinement step. |
