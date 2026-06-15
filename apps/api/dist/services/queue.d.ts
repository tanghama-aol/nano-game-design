import { IResourceNode } from '@nano-game/types';
import { Server } from 'socket.io';
export declare function initQueue(concurrency: number, io: Server): void;
export declare function addJobToQueue(projectId: string, node: IResourceNode): Promise<void>;
//# sourceMappingURL=queue.d.ts.map