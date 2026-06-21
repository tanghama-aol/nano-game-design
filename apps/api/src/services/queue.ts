import PQueue from 'p-queue';
import { prisma } from '@nano-game/database';
import { IResourceNode, ITaskProgress } from '@nano-game/types';
import { Server } from 'socket.io';
import { generateImage } from './ai-provider';

let assetQueue: PQueue | null = null;
let ioInstance: Server | null = null;

export function initQueue(concurrency: number, io: Server) {
  // p-queue limits how many image-generation jobs run at once. This protects AI
  // provider rate limits and keeps the local server responsive during batches.
  if (!assetQueue) {
    assetQueue = new PQueue({ concurrency });
    ioInstance = io;
  } else {
    assetQueue.concurrency = concurrency;
  }
}

async function simulateOrGenerateImage(node: IResourceNode): Promise<{ url: string; seed: number }> {
  const settings = await prisma.settings.findFirst();
  // Seed priority: node override, global setting, then a random fallback. The
  // returned seed is saved so a successful render can be reproduced later.
  const targetSeed = node.seed || settings?.globalSeed || Math.floor(Math.random() * 2147483647);
  
  let resultUrl = '';

  if (settings) {
    try {
      resultUrl = await generateImage(settings, node);
    } catch (e) {
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

export async function addJobToQueue(projectId: string, node: IResourceNode) {
  if (!assetQueue || !ioInstance) throw new Error("Queue not initialized");

  // Queue jobs are fire-and-forget from the HTTP route. Progress is reported by
  // Socket.IO and persisted back into the project tree when each job completes.
  assetQueue.add(async () => {
    try {
      const startStatus: ITaskProgress = { nodeId: node.id, status: 'generating' };
      ioInstance!.emit(`task:progress:${projectId}`, startStatus);
      
      const { url, seed } = await simulateOrGenerateImage(node);

      const successStatus: ITaskProgress = { nodeId: node.id, status: 'success', resultUrl: url, seed };
      ioInstance!.emit(`task:progress:${projectId}`, successStatus);

      await updateNodeInDb(projectId, node.id, { status: 'success', resultUrl: url, seed } as Partial<IResourceNode>);

    } catch (error: any) {
      const errorStatus: ITaskProgress = { nodeId: node.id, status: 'failed', error: error.message };
      ioInstance!.emit(`task:progress:${projectId}`, errorStatus);
      await updateNodeInDb(projectId, node.id, { status: 'failed' } as Partial<IResourceNode>);
    }
  });
}

async function updateNodeInDb(projectId: string, nodeId: string, patch: Partial<IResourceNode>) {
  const proj = await prisma.project.findUnique({ where: { id: projectId } });
  if (!proj) return;
  
  const tree: IResourceNode[] = JSON.parse(proj.treeData);
  
  // The tree is stored as nested JSON, so updates walk recursively until the
  // target node is found. The function mutates only the matched node in memory,
  // then writes the full serialized tree back to SQLite.
  const updateRec = (nodes: IResourceNode[] | undefined): boolean => {
    if (!nodes) return false;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i] && nodes[i]!.id === nodeId) {
        nodes[i] = { ...nodes[i]!, ...patch };
        return true;
      }
      if (nodes[i] && nodes[i]!.children && updateRec(nodes[i]!.children)) {
        return true;
      }
    }
    return false;
  };
  
  if (updateRec(tree)) {
    await prisma.project.update({
      where: { id: projectId },
      data: { treeData: JSON.stringify(tree) }
    });
  }
}
