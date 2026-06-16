"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reskinGameRouter = void 0;
const express_1 = require("express");
const database_1 = require("@nano-game/database");
const ai_provider_1 = require("../services/ai-provider");
exports.reskinGameRouter = (0, express_1.Router)();
const SYSTEM_PROMPT = `You are a senior game art director.
Given only a game name, infer broad visual and gameplay-facing asset categories without copying protected characters, logos, exact names, story, maps, or signature IP.
Extract reusable design DNA as abstract descriptors, then generate a production-ready resource tree.

Return ONLY valid JSON with this exact shape:
{
  "description": "A copyright-safe abstract description of the visual direction and resource needs.",
  "elements": [
    {
      "category": "Character | Texture | Scene | VFX",
      "name": "Abstract element name",
      "description": "What this element contributes",
      "generationHint": "Concrete prompt-friendly visual cues"
    }
  ],
  "tree": [
    {
      "id": "random-id",
      "name": "Abstract Asset Name",
      "type": "Character",
      "prompt": "Image generation prompt using abstract descriptors only...",
      "status": "pending",
      "style": "Optional style",
      "dimensions": "512x512",
      "animationFrames": 1,
      "transparent": true,
      "children": []
    }
  ]
}

Do not use the source game's exact character names, trademarks, studio names, UI logos, or iconic named locations.`;
exports.reskinGameRouter.post('/', async (req, res) => {
    const { gameName, globalStyle, language } = req.body;
    if (!gameName?.trim()) {
        res.status(400).json({ error: 'Game name is required' });
        return;
    }
    const settings = await database_1.prisma.settings.findFirst();
    const userPrompt = `Source game name: ${gameName}
Target style: ${globalStyle || 'inherit current project style'}
Output language for description/elements: ${language === 'zh' ? 'Simplified Chinese' : 'English'}
Create 8-14 practical game image assets, grouped by characters, scenes, textures, and VFX.`;
    try {
        let resultText = await (0, ai_provider_1.generateText)(settings, SYSTEM_PROMPT, userPrompt);
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(resultText);
        const tree = normalizeTree(parsed.tree || fallbackTree(gameName, globalStyle));
        res.json({
            sourceGame: gameName,
            description: parsed.description || fallbackDescription(gameName, language),
            elements: parsed.elements || [],
            tree,
            source: 'ai',
        });
    }
    catch (error) {
        console.warn('Reskin analysis failed, using fallback', error);
        res.json({
            sourceGame: gameName,
            description: fallbackDescription(gameName, language),
            elements: fallbackElements(gameName, language),
            tree: normalizeTree(fallbackTree(gameName, globalStyle)),
            source: 'fallback',
        });
    }
});
function normalizeTree(nodes) {
    return nodes.map((node) => ({
        id: node.id || generateId(),
        name: node.name || 'Untitled Asset',
        type: node.type || 'Character',
        prompt: node.prompt || node.name || 'game asset',
        status: 'pending',
        style: node.style,
        dimensions: node.dimensions || '512x512',
        animationFrames: Math.max(1, node.animationFrames || 1),
        transparent: node.transparent ?? node.type !== 'Scene',
        resultUrl: undefined,
        seed: undefined,
        children: node.children?.length ? normalizeTree(node.children) : undefined,
    }));
}
function fallbackDescription(gameName, language) {
    if (language === 'zh') {
        return `基于《${gameName}》的名称线索，抽象出一套可商用的原创游戏美术资源方向：强调清晰角色轮廓、可复用场景模块、标志性但不侵权的效果语言，以及统一的材质和色彩系统。`;
    }
    return `A copyright-safe visual resource direction inspired only by the name "${gameName}": strong silhouettes, reusable scene modules, distinctive but original effect language, and a consistent material and color system.`;
}
function fallbackElements(gameName, language) {
    if (language === 'zh') {
        return [
            { category: 'Character', name: '主角轮廓', description: '定义玩家识别度和动作基调', generationHint: `${gameName} inspired original protagonist silhouette, no copyrighted likeness` },
            { category: 'Scene', name: '核心场景', description: '建立世界观第一印象', generationHint: 'original game environment key art, readable composition' },
            { category: 'VFX', name: '技能反馈', description: '强化操作瞬间的节奏', generationHint: 'stylized impact vfx, transparent background, game ready' },
        ];
    }
    return [
        { category: 'Character', name: 'Hero Silhouette', description: 'Defines player readability and action tone', generationHint: `${gameName} inspired original protagonist silhouette, no copyrighted likeness` },
        { category: 'Scene', name: 'Core Environment', description: 'Establishes the world at first glance', generationHint: 'original game environment key art, readable composition' },
        { category: 'VFX', name: 'Action Feedback', description: 'Adds timing and clarity to actions', generationHint: 'stylized impact vfx, transparent background, game ready' },
    ];
}
function fallbackTree(gameName, globalStyle) {
    const style = globalStyle || 'Modern Indie Pixel';
    return [
        {
            id: generateId(),
            name: 'Original Hero Silhouette',
            type: 'Character',
            prompt: `Original playable hero inspired by the broad mood of ${gameName}, no copyrighted likeness, clear silhouette, ${style}, neutral pose, transparent background`,
            status: 'pending',
            style,
            dimensions: '512x512',
            animationFrames: 1,
            transparent: true,
        },
        {
            id: generateId(),
            name: 'Core Environment Key Art',
            type: 'Scene',
            prompt: `Original game environment key art inspired by the broad mood of ${gameName}, reusable background layer, no named locations, ${style}`,
            status: 'pending',
            style,
            dimensions: '1024x1024',
            animationFrames: 1,
            transparent: false,
        },
        {
            id: generateId(),
            name: 'Impact VFX Sheet',
            type: 'VFX',
            prompt: `Original stylized impact effect sprite sheet, 6 frames, transparent background, game-ready timing, ${style}`,
            status: 'pending',
            style,
            dimensions: '512x512',
            animationFrames: 6,
            transparent: true,
        },
        {
            id: generateId(),
            name: 'Tileable Material Set',
            type: 'Texture',
            prompt: `Original tileable game material set, coherent palette, no logos, ${style}`,
            status: 'pending',
            style,
            dimensions: '512x512',
            animationFrames: 1,
            transparent: false,
        },
    ];
}
function generateId() {
    return Math.random().toString(36).substring(2, 9);
}
//# sourceMappingURL=reskin-game.js.map