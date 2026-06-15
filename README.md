# Nano Game Asset Generator

A local game image design workbench for turning a game concept into a managed visual asset tree, production prompts, seeded image batches, sprite previews, and exportable metadata.

## Features

- Concept-to-tree generation for characters, textures, scenes, and VFX assets.
- Editable resource tree with drag-and-drop organization, manual root/child nodes, and per-node status.
- Batch prompt generation with global style presets and sprite sheet prompt rules.
- Seed consistency workflow with global seeds and per-node seed overrides.
- Asset editor for type, dimensions, animation frames, transparency, prompt overrides, output preview, and sprite playback.
- Local API settings for Gemini API Key or Vertex AI credentials.
- ZIP export with prompts, seeds, and metadata.

## Monorepo Structure

- `apps/web`: React + Vite + Tailwind CSS frontend.
- `apps/api`: Express API, Socket.IO progress updates, local queue, and Google AI integrations.
- `packages/database`: Prisma + SQLite persistence.
- `packages/types`: Shared TypeScript contracts.
- `packages/config-typescript`: Shared TypeScript configs.

## Quick Start

```bash
corepack pnpm install
corepack pnpm build
corepack pnpm db:push
corepack pnpm dev
```

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:3001`.

## Environment

The API can generate a temporary encryption key at startup, but persisted credentials should use a stable key:

```env
ENCRYPTION_KEY=your_32_byte_hex_string_here
```

Store it in `apps/api/.env`.

## Verification

```bash
corepack pnpm --filter @nano-game/web build
corepack pnpm --filter @nano-game/api build
```

## License

MIT
