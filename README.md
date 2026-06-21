# Nano Game Asset Generator

A local game image design workbench for turning a game concept into a managed visual asset tree, production prompts, seeded image batches, sprite previews, and exportable metadata.

## Features

- Concept-to-tree generation for characters, textures, scenes, and VFX assets.
- English / Chinese UI switch for the main workbench.
- One-click reskin workflow: enter a game name, extract copyright-safe design descriptors, and build a new asset tree.
- Editable resource tree with drag-and-drop organization, manual root/child nodes, and per-node status.
- Batch prompt generation with global style presets and sprite sheet prompt rules.
- Seed consistency workflow with global seeds and per-node seed overrides.
- Asset editor for type, dimensions, animation frames, transparency, prompt overrides, output preview, and sprite playback.
- Local API settings for Gemini, Vertex AI, OpenAI, and OpenAI-compatible text / image providers.
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

For a beginner-friendly development walkthrough, see [`DEVELOPMENT.md`](./DEVELOPMENT.md).

## Environment

The API can generate a temporary encryption key at startup, but persisted credentials should use a stable key:

```env
ENCRYPTION_KEY=your_32_byte_hex_string_here
```

Store it in `apps/api/.env`.

### API Providers

Text and image providers can be configured in the UI, environment variables, or `.codex/config.toml`.

Common environment variables:

```env
TEXT_PROVIDER=OPENAI
IMAGE_PROVIDER=OPENAI
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_key_or_token
OPENAI_TEXT_MODEL=gpt-5.5
OPENAI_IMAGE_MODEL=image2
```

Provider-specific overrides:

```env
TEXT_BASE_URL=https://your-text-provider.example/v1
TEXT_API_KEY=your_text_token
TEXT_MODEL=gpt-5.5
IMAGE_BASE_URL=https://your-image-provider.example/v1
IMAGE_API_KEY=your_image_token
IMAGE_MODEL=image2
```

Supported provider values are `GEMINI`, `VERTEX`, `OPENAI`, `OPENAI_COMPATIBLE`, and `SIMULATED`.

Example `.codex/config.toml`:

```toml
[providers.openai]
base_url = "https://api.openai.com/v1"
api_key = "$OPENAI_API_KEY"
text_model = "gpt-5.5"
image_model = "image2"

[providers.text]
base_url = "https://your-text-provider.example/v1"
token = "$TEXT_API_KEY"
model = "gpt-5.5"

[providers.image]
base_url = "https://your-image-provider.example/v1"
token = "$IMAGE_API_KEY"
model = "image2"
```

The model names are plain configurable strings, so private gateways or future provider aliases can be used without code changes.

## Verification

```bash
corepack pnpm --filter @nano-game/web build
corepack pnpm --filter @nano-game/api build
```

## License

MIT
