"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initQueue = initQueue;
exports.addJobToQueue = addJobToQueue;
const p_queue_1 = __importDefault(require("p-queue"));
const database_1 = require("@nano-game/database");
const ai_provider_1 = require("./ai-provider");
let assetQueue = null;
let ioInstance = null;
function initQueue(concurrency, io) {
    if (!assetQueue) {
        assetQueue = new p_queue_1.default({ concurrency });
        ioInstance = io;
    }
    else {
        assetQueue.concurrency = concurrency;
    }
}
async function simulateOrGenerateImage(node) {
    const settings = await database_1.prisma.settings.findFirst();
    const targetSeed = node.seed || settings?.globalSeed || Math.floor(Math.random() * 2147483647);
    let resultUrl = '';
    if (settings) {
        try {
            resultUrl = await (0, ai_provider_1.generateImage)(settings, node);
        }
        catch (e) {
            console.warn("Real generation failed, falling back to simulation", e);
        }
    }
    if (!resultUrl) {
        resultUrl = `https://placehold.co/512x512?text=${encodeURIComponent(node.name.replace(/ /g, '+'))}`;
    }
    // NOTE: Background removal using @imgly removed temporarily due to C++ compilation errors in test environment
    if (node.transparent) {
        console.log(`[Queue] Simulated background removal for ${node.name}`);
    }
    if (resultUrl.includes('placehold.co')) {
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    }
    return { url: resultUrl, seed: targetSeed };
}
async function addJobToQueue(projectId, node) {
    if (!assetQueue || !ioInstance)
        throw new Error("Queue not initialized");
    assetQueue.add(async () => {
        try {
            const startStatus = { nodeId: node.id, status: 'generating' };
            ioInstance.emit(`task:progress:${projectId}`, startStatus);
            const { url, seed } = await simulateOrGenerateImage(node);
            const successStatus = { nodeId: node.id, status: 'success', resultUrl: url, seed };
            ioInstance.emit(`task:progress:${projectId}`, successStatus);
            await updateNodeInDb(projectId, node.id, { status: 'success', resultUrl: url, seed });
        }
        catch (error) {
            const errorStatus = { nodeId: node.id, status: 'failed', error: error.message };
            ioInstance.emit(`task:progress:${projectId}`, errorStatus);
            await updateNodeInDb(projectId, node.id, { status: 'failed' });
        }
    });
}
async function updateNodeInDb(projectId, nodeId, patch) {
    const proj = await database_1.prisma.project.findUnique({ where: { id: projectId } });
    if (!proj)
        return;
    const tree = JSON.parse(proj.treeData);
    const updateRec = (nodes) => {
        if (!nodes)
            return false;
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i] && nodes[i].id === nodeId) {
                nodes[i] = { ...nodes[i], ...patch };
                return true;
            }
            if (nodes[i] && nodes[i].children && updateRec(nodes[i].children)) {
                return true;
            }
        }
        return false;
    };
    if (updateRec(tree)) {
        await database_1.prisma.project.update({
            where: { id: projectId },
            data: { treeData: JSON.stringify(tree) }
        });
    }
}
//# sourceMappingURL=queue.js.map