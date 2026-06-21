"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDesignPackageRouter = void 0;
const express_1 = require("express");
const database_1 = require("@nano-game/database");
const ai_provider_1 = require("../services/ai-provider");
exports.generateDesignPackageRouter = (0, express_1.Router)();
const RESOURCE_TYPES = ['Character', 'Texture', 'Scene', 'VFX'];
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
exports.generateDesignPackageRouter.post('/', async (req, res) => {
    try {
        const { concept, globalStyle, language } = req.body;
        const trimmedConcept = concept?.trim();
        if (!trimmedConcept) {
            res.status(400).json({ error: 'Concept is required' });
            return;
        }
        const settings = await database_1.prisma.settings.findFirst();
        if (!settings) {
            res.status(400).json({ error: 'Settings not configured' });
            return;
        }
        const payload = {
            concept: trimmedConcept,
            globalStyle: globalStyle || 'Pixel Art (16-bit)',
            language: language || 'en',
        };
        const rawText = await (0, ai_provider_1.generateText)(settings, SYSTEM_PROMPT, `Input:\n${JSON.stringify(payload)}`);
        const parsed = parseModelJson(rawText);
        const designDocument = normalizeDesignDocument(parsed.designDocument, trimmedConcept);
        const tree = normalizeTree(parsed.tree, payload.globalStyle);
        res.json({ designDocument, tree });
    }
    catch (error) {
        console.error('LLM Design Package Generation Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate design package' });
    }
});
function parseModelJson(text) {
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    const jsonText = start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned;
    return JSON.parse(jsonText);
}
function normalizeDesignDocument(raw, fallbackTitle) {
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
function normalizeTree(raw, globalStyle) {
    if (!Array.isArray(raw)) {
        throw new Error('Design package response did not include a valid resource tree');
    }
    return raw.map((node) => normalizeNode(node, globalStyle));
}
function normalizeNode(raw, globalStyle) {
    const source = isRecord(raw) ? raw : {};
    const name = toText(source.name, 'Untitled Asset');
    const style = optionalText(source.style) || globalStyle;
    const animationFrames = normalizePositiveInteger(source.animationFrames, 1);
    const prompt = toText(source.prompt, `${name}, game asset, ${style}, clean silhouette, readable details, production-ready image prompt`);
    const children = Array.isArray(source.children)
        ? source.children.map((child) => normalizeNode(child, globalStyle))
        : [];
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
function normalizeResourceType(value) {
    if (typeof value === 'string') {
        const exact = RESOURCE_TYPES.find((type) => type === value);
        if (exact)
            return exact;
        const lower = value.toLowerCase();
        if (lower.includes('texture') || lower.includes('ui') || lower.includes('prop'))
            return 'Texture';
        if (lower.includes('scene') || lower.includes('environment') || lower.includes('background'))
            return 'Scene';
        if (lower.includes('vfx') || lower.includes('effect') || lower.includes('particle'))
            return 'VFX';
    }
    return 'Character';
}
function normalizePositiveInteger(value, fallback) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric))
        return fallback;
    return Math.max(1, Math.floor(numeric));
}
function toText(value, fallback) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
function optionalText(value) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
function toTextList(value, fallback) {
    if (Array.isArray(value)) {
        const items = value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
        if (items.length > 0)
            return items;
    }
    if (typeof value === 'string' && value.trim()) {
        return [value.trim()];
    }
    return fallback;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function generateId() {
    return Math.random().toString(36).substring(2, 9);
}
//# sourceMappingURL=generate-design-package.js.map