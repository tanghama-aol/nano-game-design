export interface ISettings {
    id: string;
    authMode: 'GEMINI' | 'VERTEX';
    hasGeminiKey: boolean;
    hasVertexPrivateKey: boolean;
    vertexProjectId?: string;
    vertexClientEmail?: string;
    textModel: string;
    imageModel: string;
    maxConcurrency: number;
    globalSeed?: number;
}
export interface IUpdateSettings {
    authMode?: 'GEMINI' | 'VERTEX';
    geminiApiKey?: string;
    vertexProjectId?: string;
    vertexClientEmail?: string;
    vertexPrivateKey?: string;
    textModel?: string;
    imageModel?: string;
    maxConcurrency?: number;
    globalSeed?: number | null;
}
export type ResourceType = 'Character' | 'Texture' | 'Scene' | 'VFX';
export type NodeStatus = 'pending' | 'generating' | 'success' | 'failed';
export interface IResourceNode {
    id: string;
    name: string;
    type: ResourceType;
    prompt: string;
    status: NodeStatus;
    children?: IResourceNode[];
    style?: string;
    dimensions?: string;
    animationFrames?: number;
    transparent?: boolean;
    resultUrl?: string;
    seed?: number;
}
export interface IGenerateTreeRequest {
    concept: string;
}
export interface IGenerateTreeResponse {
    tree: IResourceNode[];
}
export interface IGeneratePromptsRequest {
    nodes: {
        id: string;
        name: string;
        type: ResourceType;
        currentPrompt?: string;
        styleOverride?: string;
        animationFrames?: number;
    }[];
    globalStyle: string;
}
export interface IGeneratePromptsResponse {
    prompts: Record<string, string>;
}
export interface IProject {
    id: string;
    name: string;
    treeData: IResourceNode[];
    isGenerating: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface ISaveProjectRequest {
    name?: string;
    treeData: IResourceNode[];
    isGenerating?: boolean;
}
export interface IGenerateAssetsRequest {
    projectId: string;
    nodeIds?: string[];
}
export interface ITaskProgress {
    nodeId: string;
    status: NodeStatus;
    resultUrl?: string;
    error?: string;
    seed?: number;
}
export interface IGoldenSeed {
    id: string;
    seed: number;
    name: string;
    description?: string;
    imageUrl?: string;
    createdAt: string;
}
export declare const STYLE_PRESETS: {
    PIXEL: string[];
    CARTOON: string[];
    REALISTIC: string[];
};
//# sourceMappingURL=index.d.ts.map