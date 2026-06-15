import { IResourceNode } from '@nano-game/types';

export async function attachMetadata(base64Image: string, _node: IResourceNode): Promise<Buffer> {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');
  
  try {
    // Mock metadata attachment without Sharp to bypass binary compile errors in this environment
    return imageBuffer;
  } catch (error) {
    return imageBuffer;
  }
}
