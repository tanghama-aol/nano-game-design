import { Router, Request, Response } from 'express';
import { prisma } from '@nano-game/database';
import { ISaveProjectRequest, IGenerateAssetsRequest, IResourceNode } from '@nano-game/types';
import { addJobToQueue } from '../services/queue';
import archiver from 'archiver';
import { attachMetadata } from '../utils/metadata';
import axios from 'axios';

export const projectsRouter: Router = Router();

projectsRouter.post('/save', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, treeData, isGenerating } = req.body as ISaveProjectRequest;
    
    let proj = await prisma.project.findFirst();
    
    if (!proj) {
      proj = await prisma.project.create({
        data: {
          name: name || 'Untitled',
          treeData: JSON.stringify(treeData),
          isGenerating: isGenerating || false,
        }
      });
    } else {
      proj = await prisma.project.update({
        where: { id: proj.id },
        data: {
          name: name || proj.name,
          treeData: JSON.stringify(treeData),
          isGenerating: isGenerating !== undefined ? isGenerating : proj.isGenerating,
        }
      });
    }

    res.json({ id: proj.id, success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

projectsRouter.get('/load', async (_req: Request, res: Response): Promise<void> => {
  try {
    const proj = await prisma.project.findFirst();
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

projectsRouter.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, nodeIds } = req.body as IGenerateAssetsRequest;
    const proj = await prisma.project.findUnique({ where: { id: projectId } });
    
    if (!proj) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    const tree: IResourceNode[] = JSON.parse(proj.treeData);
    const nodesToQueue: IResourceNode[] = [];
    
    const collectNodes = (nodes: IResourceNode[]) => {
      nodes.forEach(node => {
        if (nodeIds && nodeIds.length > 0) {
          if (nodeIds.includes(node.id)) nodesToQueue.push(node);
        } else {
          if (node.status === 'pending' || node.status === 'failed') {
            nodesToQueue.push(node);
          }
        }
        if (node.children) collectNodes(node.children);
      });
    };
    
    collectNodes(tree);
    
    for (const node of nodesToQueue) {
      await addJobToQueue(projectId, node);
    }
    
    res.json({ queued: nodesToQueue.length, success: true });
    
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Download ZIP Export
projectsRouter.get('/export/:projectId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const proj = await prisma.project.findUnique({ where: { id: projectId } });
    if (!proj) {
      res.status(404).send('Project not found');
      return;
    }
    
    const tree: IResourceNode[] = JSON.parse(proj.treeData);
    
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-disposition': `attachment; filename=${proj.name.replace(/\s+/g, '_')}_Assets.zip`
    });

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // Recursively parse tree, attach metadata, and stream to ZIP
    const appendNodesToArchive = async (nodes: IResourceNode[], currentPath: string) => {
      for (const node of nodes) {
        const folderName = `${currentPath}${node.name.replace(/[^\w\s-]/gi, '')}`;
        
        if (node.status === 'success' && node.resultUrl) {
          try {
            let base64Data = node.resultUrl;
            
            // If it's a simulated URL like placehold.co, we download it first
            if (node.resultUrl.startsWith('http')) {
              const response = await axios.get(node.resultUrl, { responseType: 'arraybuffer' });
              base64Data = Buffer.from(response.data, 'binary').toString('base64');
            }
            
            // Process buffer & attach metadata
            const buffer = await attachMetadata(base64Data, node);
            
            // File extension based on transp
            const ext = node.transparent ? 'png' : 'jpg';
            archive.append(buffer, { name: `${folderName}.${ext}` });
            
            // Also append a text file with prompt for reference
            archive.append(Buffer.from(`Prompt: ${node.prompt}\nSeed: ${node.seed}`), { 
              name: `${folderName}_info.txt` 
            });

          } catch (e) {
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

  } catch (error: any) {
    console.error('Export Error:', error);
    if (!res.headersSent) {
      res.status(500).send('Failed to generate export archive');
    }
  }
});
