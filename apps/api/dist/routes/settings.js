"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRouter = void 0;
const express_1 = require("express");
const database_1 = require("@nano-game/database");
const crypto_1 = require("../utils/crypto");
exports.settingsRouter = (0, express_1.Router)();
exports.settingsRouter.get('/', async (_req, res) => {
    let settings = await database_1.prisma.settings.findFirst();
    if (!settings) {
        settings = await database_1.prisma.settings.create({ data: {} });
    }
    const response = {
        id: settings.id,
        authMode: settings.authMode,
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
exports.settingsRouter.post('/', async (req, res) => {
    const data = req.body;
    let settings = await database_1.prisma.settings.findFirst();
    if (!settings) {
        settings = await database_1.prisma.settings.create({ data: {} });
    }
    const updateData = {
        authMode: data.authMode || settings.authMode,
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