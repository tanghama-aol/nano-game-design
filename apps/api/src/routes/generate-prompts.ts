import { Router, Request, Response } from 'express';
import { prisma } from '@nano-game/database';
import { IGeneratePromptsRequest } from '@nano-game/types';
import { decrypt } from '../utils/crypto';
import { GoogleGenAI } from '@google/genai';
import { VertexAI } from '@google-cloud/vertexai';
import { getProxyFetch } from '../utils/proxy';

export const generatePromptsRouter: Router = Router();

const SYSTEM_PROMPT = `You are an expert AI image generation prompt engineer.
Given a list of game assets (nodes) and an overall visual style, enrich their prompts for image generation.
Make them highly detailed, focusing on lighting, composition, camera angle, and material textures.

CRITICAL INSTRUCTIONS:
1. FORMULA: Ensure each prompt roughly follows this formula: "[Subject Description], [Setting/Context], [Global Style/Node Style], [Technical details like lighting/renderer/quality]".
2. COPYRIGHT EVASION: DO NOT use copyrighted names, trademarks, or specific franchise characters. Describe them generically.
3. SPRITE SHEETS: If a node has "animationFrames" > 1, you MUST append explicit sprite sheet instructions to the prompt, e.g., "sprite sheet containing {N} frames of animation, uniform grid layout, simple white background, game asset sprite, sequential animation poses".
4. You must return ONLY a JSON object mapping the node 'id' to the newly 'enrichedPrompt'.
DO NOT include markdown block markers like \`\`\`json.`;

generatePromptsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodes, globalStyle } = req.body as IGeneratePromptsRequest;
    if (!nodes || nodes.length === 0) {
      res.status(400).json({ error: 'Nodes are required' });
      return;
    }

    const settings = await prisma.settings.findFirst();
    if (!settings) {
      res.status(400).json({ error: 'Settings not configured' });
      return;
    }

    let resultText = '';
    const payloadContext = JSON.stringify({ globalStyle, nodes });

    if (settings.authMode === 'GEMINI') {
      if (!settings.geminiApiKey) {
        res.status(400).json({ error: 'Gemini API Key missing' });
        return;
      }
      
      const apiKey = decrypt(settings.geminiApiKey);
      const ai = new GoogleGenAI({ apiKey, fetch: getProxyFetch() } as any);
      
      const response = await ai.models.generateContent({
        model: settings.textModel || 'gemini-1.5-pro',
        contents: `${SYSTEM_PROMPT}\n\nAssets to process:\n${payloadContext}`
      });
      
      resultText = response.text || '';
      
    } else {
      if (!settings.vertexProjectId || !settings.vertexClientEmail || !settings.vertexPrivateKey) {
        res.status(400).json({ error: 'Vertex credentials incomplete' });
        return;
      }
      
      const privateKey = decrypt(settings.vertexPrivateKey).replace(/\\n/g, '\n');
      
      const vertexAI = new VertexAI({
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
          { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nAssets to process:\n${payloadContext}` }] }
        ]
      });
      
      resultText = (response.response.candidates?.[0]?.content?.parts?.[0] as any)?.text || '';
    }

    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

    const promptsMap = JSON.parse(resultText) as Record<string, string>;

    res.json({ prompts: promptsMap });
    
  } catch (error: any) {
    console.error('LLM Prompt Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate prompts' });
  }
});
