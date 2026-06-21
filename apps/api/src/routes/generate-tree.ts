import { Router, Request, Response } from 'express';
import { prisma } from '@nano-game/database';
import { IGenerateTreeRequest, IResourceNode } from '@nano-game/types';
import { generateText } from '../services/ai-provider';

export const generateTreeRouter: Router = Router();

function generateId(): string {
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

generateTreeRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { concept } = req.body as IGenerateTreeRequest;
    if (!concept) {
      res.status(400).json({ error: 'Concept is required' });
      return;
    }

    const settings = await prisma.settings.findFirst();
    if (!settings) {
      res.status(400).json({ error: 'Settings not configured' });
      return;
    }

    // The LLM is asked for JSON, but many models still wrap answers in markdown.
    // Strip common fences before parsing, then normalize fields the UI requires.
    let resultText = await generateText(settings, SYSTEM_PROMPT, `Concept: ${concept}`);

    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

    const treeData = JSON.parse(resultText) as IResourceNode[];
    
    // Defensive pass: generated trees must have IDs and a predictable initial
    // status so React can render, select, and queue nodes reliably.
    const traverseAndFix = (nodes: any[]) => {
      nodes.forEach(node => {
        if (!node.id) node.id = generateId();
        node.status = 'pending';
        if (node.children) traverseAndFix(node.children);
      });
    };
    traverseAndFix(treeData);

    res.json({ tree: treeData });
    
  } catch (error: any) {
    console.error('LLM Tree Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate tree' });
  }
});
