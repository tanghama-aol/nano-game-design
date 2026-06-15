"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTreeRouter = void 0;
const express_1 = require("express");
const database_1 = require("@nano-game/database");
const crypto_1 = require("../utils/crypto");
const genai_1 = require("@google/genai");
const vertexai_1 = require("@google-cloud/vertexai");
const proxy_1 = require("../utils/proxy");
exports.generateTreeRouter = (0, express_1.Router)();
function generateId() {
    return Math.random().toString(36).substring(2, 9);
}
const SYSTEM_PROMPT = `You are an expert game developer and technical artist.
Given a game concept, generate a comprehensive JSON structure representing the visual assets needed for the game.
The structure should be a tree where complex objects can have children.
The JSON MUST perfectly match this structure:
[
  {
    "id": "random-id",
    "name": "Player Character",
    "type": "Character",
    "prompt": "Highly detailed 2D pixel art character, idle pose...",
    "status": "pending",
    "style": "Pixel Art",
    "dimensions": "64x64",
    "animationFrames": 1,
    "transparent": true,
    "children": []
  }
]
Return ONLY valid JSON. DO NOT include markdown block markers like \`\`\`json.`;
exports.generateTreeRouter.post('/', async (req, res) => {
    try {
        const { concept } = req.body;
        if (!concept) {
            res.status(400).json({ error: 'Concept is required' });
            return;
        }
        const settings = await database_1.prisma.settings.findFirst();
        if (!settings) {
            res.status(400).json({ error: 'Settings not configured' });
            return;
        }
        let resultText = '';
        if (settings.authMode === 'GEMINI') {
            if (!settings.geminiApiKey) {
                res.status(400).json({ error: 'Gemini API Key missing' });
                return;
            }
            const apiKey = (0, crypto_1.decrypt)(settings.geminiApiKey);
            const ai = new genai_1.GoogleGenAI({ apiKey, fetch: (0, proxy_1.getProxyFetch)() });
            const response = await ai.models.generateContent({
                model: settings.textModel || 'gemini-1.5-pro',
                contents: `${SYSTEM_PROMPT}\n\nConcept: ${concept}`
            });
            resultText = response.text || '';
        }
        else {
            if (!settings.vertexProjectId || !settings.vertexClientEmail || !settings.vertexPrivateKey) {
                res.status(400).json({ error: 'Vertex credentials incomplete' });
                return;
            }
            const privateKey = (0, crypto_1.decrypt)(settings.vertexPrivateKey).replace(/\\n/g, '\n');
            const vertexAI = new vertexai_1.VertexAI({
                project: settings.vertexProjectId,
                location: 'us-central1',
                googleAuthOptions: {
                    credentials: {
                        client_email: settings.vertexClientEmail,
                        private_key: privateKey,
                    }
                }
            });
            const generativeModel = vertexAI.getGenerativeModel({
                model: settings.textModel || 'gemini-1.5-pro'
            });
            const response = await generativeModel.generateContent({
                contents: [
                    { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nConcept: ${concept}` }] }
                ]
            });
            resultText = response.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const treeData = JSON.parse(resultText);
        const traverseAndFix = (nodes) => {
            nodes.forEach(node => {
                if (!node.id)
                    node.id = generateId();
                node.status = 'pending';
                if (node.children)
                    traverseAndFix(node.children);
            });
        };
        traverseAndFix(treeData);
        res.json({ tree: treeData });
    }
    catch (error) {
        console.error('LLM Tree Generation Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate tree' });
    }
});
//# sourceMappingURL=generate-tree.js.map