"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePromptsRouter = void 0;
const express_1 = require("express");
const database_1 = require("@nano-game/database");
const ai_provider_1 = require("../services/ai-provider");
exports.generatePromptsRouter = (0, express_1.Router)();
const SYSTEM_PROMPT = `You are an expert AI image generation prompt engineer.
Given a list of game assets (nodes) and an overall visual style, enrich their prompts for image generation.
Make them highly detailed, focusing on lighting, composition, camera angle, and material textures.

CRITICAL INSTRUCTIONS:
1. FORMULA: Ensure each prompt roughly follows this formula: "[Subject Description], [Setting/Context], [Global Style/Node Style], [Technical details like lighting/renderer/quality]".
2. COPYRIGHT EVASION: DO NOT use copyrighted names, trademarks, or specific franchise characters. Describe them generically.
3. SPRITE SHEETS: If a node has "animationFrames" > 1, you MUST append explicit sprite sheet instructions to the prompt, e.g., "sprite sheet containing {N} frames of animation, uniform grid layout, simple white background, game asset sprite, sequential animation poses".
4. You must return ONLY a JSON object mapping the node 'id' to the newly 'enrichedPrompt'.
DO NOT include markdown block markers like \`\`\`json.`;
exports.generatePromptsRouter.post('/', async (req, res) => {
    try {
        const { nodes, globalStyle } = req.body;
        if (!nodes || nodes.length === 0) {
            res.status(400).json({ error: 'Nodes are required' });
            return;
        }
        const settings = await database_1.prisma.settings.findFirst();
        if (!settings) {
            res.status(400).json({ error: 'Settings not configured' });
            return;
        }
        const payloadContext = JSON.stringify({ globalStyle, nodes });
        let resultText = await (0, ai_provider_1.generateText)(settings, SYSTEM_PROMPT, `Assets to process:\n${payloadContext}`);
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const promptsMap = JSON.parse(resultText);
        res.json({ prompts: promptsMap });
    }
    catch (error) {
        console.error('LLM Prompt Generation Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate prompts' });
    }
});
//# sourceMappingURL=generate-prompts.js.map