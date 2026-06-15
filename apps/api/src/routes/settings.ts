import { Router } from 'express';
import { prisma } from '@nano-game/database';
import { ISettings, IUpdateSettings } from '@nano-game/types';
import { encrypt } from '../utils/crypto';

export const settingsRouter: Router = Router();

settingsRouter.get('/', async (_req, res) => {
  let settings = await prisma.settings.findFirst();
  
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }

  const response: ISettings = {
    id: settings.id,
    authMode: settings.authMode as 'GEMINI' | 'VERTEX',
    hasGeminiKey: !!settings.geminiApiKey,
    hasVertexPrivateKey: !!settings.vertexPrivateKey,
    vertexProjectId: settings.vertexProjectId || undefined,
    vertexClientEmail: settings.vertexClientEmail || undefined,
    textModel: settings.textModel,
    imageModel: settings.imageModel,
    maxConcurrency: settings.maxConcurrency,
    globalSeed: settings.globalSeed || undefined,
  };

  res.json(response);
});

settingsRouter.post('/', async (req, res) => {
  const data: IUpdateSettings = req.body;
  
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }
  
  const updateData: any = {
    authMode: data.authMode || settings.authMode,
    textModel: data.textModel || settings.textModel,
    imageModel: data.imageModel || settings.imageModel,
    maxConcurrency: data.maxConcurrency || settings.maxConcurrency,
  };

  if (data.globalSeed !== undefined) {
    updateData.globalSeed = data.globalSeed;
  }

  if (data.geminiApiKey) {
    updateData.geminiApiKey = encrypt(data.geminiApiKey);
  }
  if (data.vertexProjectId !== undefined) {
    updateData.vertexProjectId = data.vertexProjectId;
  }
  if (data.vertexClientEmail !== undefined) {
    updateData.vertexClientEmail = data.vertexClientEmail;
  }
  if (data.vertexPrivateKey) {
    updateData.vertexPrivateKey = encrypt(data.vertexPrivateKey);
  }

  await prisma.settings.update({
    where: { id: settings.id },
    data: updateData,
  });

  res.json({ success: true });
});
