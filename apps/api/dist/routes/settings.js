"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRouter = void 0;
const express_1 = require("express");
const database_1 = require("@nano-game/database");
const crypto_1 = require("../utils/crypto");
const ai_provider_1 = require("../services/ai-provider");
exports.settingsRouter = (0, express_1.Router)();
exports.settingsRouter.get('/', async (_req, res) => {
    let settings = await database_1.prisma.settings.findFirst();
    if (!settings) {
        settings = await database_1.prisma.settings.create({ data: {} });
    }
    const response = {
        id: settings.id,
        authMode: settings.authMode,
        textProvider: (settings.textProvider || settings.authMode),
        imageProvider: (settings.imageProvider || settings.authMode),
        hasGeminiKey: !!settings.geminiApiKey,
        hasVertexPrivateKey: !!settings.vertexPrivateKey,
        hasTextCredential: (0, ai_provider_1.hasConfiguredCredential)(settings, 'text'),
        hasImageCredential: (0, ai_provider_1.hasConfiguredCredential)(settings, 'image'),
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
exports.settingsRouter.post('/', async (req, res) => {
    const data = req.body;
    let settings = await database_1.prisma.settings.findFirst();
    if (!settings) {
        settings = await database_1.prisma.settings.create({ data: {} });
    }
    const updateData = {
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
        updateData.geminiApiKey = (0, crypto_1.encrypt)(data.geminiApiKey);
    }
    if (data.textBaseUrl !== undefined) {
        updateData.textBaseUrl = data.textBaseUrl;
    }
    if (data.imageBaseUrl !== undefined) {
        updateData.imageBaseUrl = data.imageBaseUrl;
    }
    if (data.textApiKey) {
        updateData.textApiKey = (0, crypto_1.encrypt)(data.textApiKey);
    }
    if (data.imageApiKey) {
        updateData.imageApiKey = (0, crypto_1.encrypt)(data.imageApiKey);
    }
    if (data.vertexProjectId !== undefined) {
        updateData.vertexProjectId = data.vertexProjectId;
    }
    if (data.vertexClientEmail !== undefined) {
        updateData.vertexClientEmail = data.vertexClientEmail;
    }
    if (data.vertexPrivateKey) {
        updateData.vertexPrivateKey = (0, crypto_1.encrypt)(data.vertexPrivateKey);
    }
    await database_1.prisma.settings.update({
        where: { id: settings.id },
        data: updateData,
    });
    res.json({ success: true });
});
//# sourceMappingURL=settings.js.map