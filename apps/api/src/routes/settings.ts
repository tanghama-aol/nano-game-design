import { Router } from 'express';
import { prisma } from '@nano-game/database';
import { ApiProvider, ISettings, IUpdateSettings } from '@nano-game/types';
import { encrypt } from '../utils/crypto';
import { hasConfiguredCredential } from '../services/ai-provider';

export const settingsRouter: Router = Router();

settingsRouter.get('/', async (_req, res) => {
  let settings = await prisma.settings.findFirst();
  
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }

  const response: ISettings = {
    id: settings.id,
    authMode: settings.authMode as ApiProvider,
    textProvider: (settings.textProvider || settings.authMode) as ApiProvider,
    imageProvider: (settings.imageProvider || settings.authMode) as ApiProvider,
    hasGeminiKey: !!settings.geminiApiKey,
    hasVertexPrivateKey: !!settings.vertexPrivateKey,
    hasTextCredential: hasConfiguredCredential(settings, 'text'),
    hasImageCredential: hasConfiguredCredential(settings, 'image'),
    vertexProjectId: settings.vertexProjectId || undefined,
    vertexClientEmail: settings.vertexClientEmail || undefined,
    textModel: settings.textModel,
    imageModel: settings.imageModel,
    textBaseUrl: settings.textBaseUrl || undefined,
    imageBaseUrl: settings.imageBaseUrl || undefined,
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
    textProvider: data.textProvider || settings.textProvider || settings.authMode,
    imageProvider: data.imageProvider || settings.imageProvider || settings.authMode,
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
  if (data.textBaseUrl !== undefined) {
    updateData.textBaseUrl = data.textBaseUrl;
  }
  if (data.imageBaseUrl !== undefined) {
    updateData.imageBaseUrl = data.imageBaseUrl;
  }
  if (data.textApiKey) {
    updateData.textApiKey = encrypt(data.textApiKey);
  }
  if (data.imageApiKey) {
    updateData.imageApiKey = encrypt(data.imageApiKey);
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
