import { Router, Request, Response } from 'express';
import { prisma } from '@nano-game/database';
import type {
  IGameDesignDocument,
  IGenerateDesignPackageRequest,
  IGenerateDesignPackageResponse,
  IResourceNode,
  ResourceType,
} from '@nano-game/types';
import { generateText } from '../services/ai-provider';

export const generateDesignPackageRouter: Router = Router();

const RESOURCE_TYPES: ResourceType[] = ['Character', 'Texture', 'Scene', 'VFX'];

// This prompt is the contract between product intent and code. It asks the LLM
// for a planning document plus a production asset tree in one response.
const SYSTEM_PROMPT = `You are a senior game designer, art director, and AI image prompt engineer.
Given a user game concept, create one coherent concept design package.

Return ONLY valid JSON with this exact shape:
{
  "designDocument": {
    "title": "short original game title",
    "genre": "genre and camera format",
    "playerFantasy": "one concise paragraph",
    "coreLoop": ["verb-driven loop step"],
    "artDirection": "visual style, mood, materials, palette, readability constraints",
    "keyMechanics": ["mechanic"],
    "contentPillars": ["pillar"],
    "productionNotes": ["production note"]
  },
  "tree": [
    {
      "id": "stable-id",
      "name": "Asset Name",
      "type": "Character",
      "prompt": "English production image prompt for this exact asset",
      "status": "pending",
      "style": "style override if useful",
      "dimensions": "1024x1024",
      "animationFrames": 1,
      "transparent": true,
      "children": []
    }
  ]
}

Rules:
- designDocument must be written in the requested language.
- tree node prompts must be English because they are used for image generation.
- Use only these node types: Character, Texture, Scene, VFX.
- Every node prompt must describe the resource itself, the visual treatment, camera/composition, materials, lighting, and production constraints.
- If animationFrames is greater than 1, include sprite sheet instructions in that node prompt.
- Avoid copyrighted names, trademarks, and direct franchise references.`;

generateDesignPackageRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { concept, globalStyle, language } = req.body as IGenerateDesignPackageRequest;
    const trimmedConcept = concept?.trim();
    if (!trimmedConcept) {
      res.status(400).json({ error: 'Concept is required' });
      return;
    }

    const settings = await prisma.settings.findFirst();
    if (!settings) {
      res.status(400).json({ error: 'Settings not configured' });
      return;
    }

    const payload = {
      concept: trimmedConcept,
      globalStyle: globalStyle || 'Pixel Art (16-bit)',
      language: language || 'en',
    };

    // The AI response is treated as untrusted input: parse first, then normalize
    // into strong shared types before returning it to the frontend.
    const rawText = await generateText(settings, SYSTEM_PROMPT, `Input:\n${JSON.stringify(payload)}`);
    const parsed = parseModelJson(rawText) as Partial<IGenerateDesignPackageResponse>;
    const designDocument = normalizeDesignDocument(parsed.designDocument, trimmedConcept);
    const tree = normalizeTree(parsed.tree, payload.globalStyle);

    res.json({ designDocument, tree } satisfies IGenerateDesignPackageResponse);
  } catch (error: any) {
    console.error('LLM Design Package Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate design package' });
  }
});

function parseModelJson(text: string): unknown {
  // Some models prepend notes or markdown despite instructions. Extracting the
  // outer object keeps the route tolerant without accepting non-JSON payloads.
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const jsonText = start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(jsonText);
}

function normalizeDesignDocument(raw: unknown, fallbackTitle: string): IGameDesignDocument {
  // Normalizers convert loose model output into complete UI-ready objects. This
  // prevents missing fields from breaking panels downstream.
  const source = isRecord(raw) ? raw : {};
  return {
    title: toText(source.title, fallbackTitle.slice(0, 80) || 'Untitled Game Concept'),
    genre: toText(source.genre, 'Game concept'),
    playerFantasy: toText(source.playerFantasy, 'A focused player fantasy built from the supplied concept.'),
    coreLoop: toTextList(source.coreLoop, ['Explore', 'Act', 'Collect feedback', 'Upgrade']),
    artDirection: toText(source.artDirection, 'Readable game assets with a coherent style and strong silhouettes.'),
    keyMechanics: toTextList(source.keyMechanics, ['Core interaction derived from the concept']),
    contentPillars: toTextList(source.contentPillars, ['Readable moment-to-moment play', 'Distinct asset families']),
    productionNotes: toTextList(source.productionNotes, ['Keep prompts consistent across related assets']),
  };
}

function normalizeTree(raw: unknown, globalStyle: string): IResourceNode[] {
  if (!Array.isArray(raw)) {
    throw new Error('Design package response did not include a valid resource tree');
  }
  return raw.map((node) => normalizeNode(node, globalStyle));
}

function normalizeNode(raw: unknown, globalStyle: string): IResourceNode {
  const source = isRecord(raw) ? raw : {};
  const name = toText(source.name, 'Untitled Asset');
  const style = optionalText(source.style) || globalStyle;
  const animationFrames = normalizePositiveInteger(source.animationFrames, 1);
  const prompt = toText(
    source.prompt,
    `${name}, game asset, ${style}, clean silhouette, readable details, production-ready image prompt`,
  );
  const children = Array.isArray(source.children)
    ? source.children.map((child) => normalizeNode(child, globalStyle))
    : [];

  // Keep generated IDs when present so future re-generation can preserve
  // references, but always fall back to a local ID for React tree rendering.
  return {
    id: toText(source.id, generateId()),
    name,
    type: normalizeResourceType(source.type),
    prompt,
    status: 'pending',
    style,
    dimensions: toText(source.dimensions, '1024x1024'),
    animationFrames,
    transparent: typeof source.transparent === 'boolean' ? source.transparent : true,
    children: children.length > 0 ? children : undefined,
  };
}

function normalizeResourceType(value: unknown): ResourceType {
  // LLMs may invent close category names like "Environment" or "Prop". Mapping
  // them into the app's four canonical types keeps the editor controls simple.
  if (typeof value === 'string') {
    const exact = RESOURCE_TYPES.find((type) => type === value);
    if (exact) return exact;

    const lower = value.toLowerCase();
    if (lower.includes('texture') || lower.includes('ui') || lower.includes('prop')) return 'Texture';
    if (lower.includes('scene') || lower.includes('environment') || lower.includes('background')) return 'Scene';
    if (lower.includes('vfx') || lower.includes('effect') || lower.includes('particle')) return 'VFX';
  }
  return 'Character';
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(1, Math.floor(numeric));
}

function toText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toTextList(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) {
    const items = value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
    if (items.length > 0) return items;
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
