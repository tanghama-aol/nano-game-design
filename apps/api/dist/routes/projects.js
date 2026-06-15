"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectsRouter = void 0;
const express_1 = require("express");
const database_1 = require("@nano-game/database");
const queue_1 = require("../services/queue");
const archiver_1 = __importDefault(require("archiver"));
const metadata_1 = require("../utils/metadata");
const axios_1 = __importDefault(require("axios"));
exports.projectsRouter = (0, express_1.Router)();
exports.projectsRouter.post('/save', async (req, res) => {
    try {
        const { name, treeData, isGenerating } = req.body;
        let proj = await database_1.prisma.project.findFirst();
        if (!proj) {
            proj = await database_1.prisma.project.create({
                data: {
                    name: name || 'Untitled',
                    treeData: JSON.stringify(treeData),
                    isGenerating: isGenerating || false,
                }
            });
        }
        else {
            proj = await database_1.prisma.project.update({
                where: { id: proj.id },
                data: {
                    name: name || proj.name,
                    treeData: JSON.stringify(treeData),
                    isGenerating: isGenerating !== undefined ? isGenerating : proj.isGenerating,
                }
            });
        }
        res.json({ id: proj.id, success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.projectsRouter.get('/load', async (_req, res) => {
    try {
        const proj = await database_1.prisma.project.findFirst();
        if (!proj) {
            res.json({ project: null });
            return;
        }
        res.json({
            project: {
                id: proj.id,
                name: proj.name,
                treeData: JSON.parse(proj.treeData),
                isGenerating: proj.isGenerating,
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.projectsRouter.post('/generate', async (req, res) => {
    try {
        const { projectId, nodeIds } = req.body;
        const proj = await database_1.prisma.project.findUnique({ where: { id: projectId } });
        if (!proj) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        const tree = JSON.parse(proj.treeData);
        const nodesToQueue = [];
        const collectNodes = (nodes) => {
            nodes.forEach(node => {
                if (nodeIds && nodeIds.length > 0) {
                    if (nodeIds.includes(node.id))
                        nodesToQueue.push(node);
                }
                else {
                    if (node.status === 'pending' || node.status === 'failed') {
                        nodesToQueue.push(node);
                    }
                }
                if (node.children)
                    collectNodes(node.children);
            });
        };
        collectNodes(tree);
        for (const node of nodesToQueue) {
            await (0, queue_1.addJobToQueue)(projectId, node);
        }
        res.json({ queued: nodesToQueue.length, success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Download ZIP Export
exports.projectsRouter.get('/export/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const proj = await database_1.prisma.project.findUnique({ where: { id: projectId } });
        if (!proj) {
            res.status(404).send('Project not found');
            return;
        }
        const tree = JSON.parse(proj.treeData);
        res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-disposition': `attachment; filename=${proj.name.replace(/\s+/g, '_')}_Assets.zip`
        });
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        archive.pipe(res);
        // Recursively parse tree, attach metadata, and stream to ZIP
        const appendNodesToArchive = async (nodes, currentPath) => {
            for (const node of nodes) {
                const folderName = `${currentPath}${node.name.replace(/[^\w\s-]/gi, '')}`;
                if (node.status === 'success' && node.resultUrl) {
                    try {
                        let base64Data = node.resultUrl;
                        // If it's a simulated URL like placehold.co, we download it first
                        if (node.resultUrl.startsWith('http')) {
                            const response = await axios_1.default.get(node.resultUrl, { responseType: 'arraybuffer' });
                            base64Data = Buffer.from(response.data, 'binary').toString('base64');
                        }
                        // Process buffer & attach metadata
                        const buffer = await (0, metadata_1.attachMetadata)(base64Data, node);
                        // File extension based on transp
                        const ext = node.transparent ? 'png' : 'jpg';
                        archive.append(buffer, { name: `${folderName}.${ext}` });
                        // Also append a text file with prompt for reference
                        archive.append(Buffer.from(`Prompt: ${node.prompt}\nSeed: ${node.seed}`), {
                            name: `${folderName}_info.txt`
                        });
                    }
                    catch (e) {
                        console.error(`Failed to export node ${node.name}`, e);
                    }
                }
                if (node.children && node.children.length > 0) {
                    await appendNodesToArchive(node.children, `${folderName}/`);
                }
            }
        };
        await appendNodesToArchive(tree, '');
        await archive.finalize();
    }
    catch (error) {
        console.error('Export Error:', error);
        if (!res.headersSent) {
            res.status(500).send('Failed to generate export archive');
        }
    }
});
//# sourceMappingURL=projects.js.map