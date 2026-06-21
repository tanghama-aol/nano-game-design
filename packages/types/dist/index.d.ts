export interface ISettings {
    id: string;
    authMode: ApiProvider;
    textProvider: ApiProvider;
    imageProvider: ApiProvider;
    hasGeminiKey: boolean;
    hasVertexPrivateKey: boolean;
    hasTextCredential: boolean;
    hasImageCredential: boolean;
    vertexProjectId?: string;
    vertexClientEmail?: string;
    textModel: string;
    imageModel: string;
    textBaseUrl?: string;
    imageBaseUrl?: string;
    maxConcurrency: number;
    globalSeed?: number;
}
export interface IUpdateSettings {
    authMode?: ApiProvider;
    textProvider?: ApiProvider;
    imageProvider?: ApiProvider;
    geminiApiKey?: string;
    vertexProjectId?: string;
    vertexClientEmail?: string;
    vertexPrivateKey?: string;
    textModel?: string;
    imageModel?: string;
    textBaseUrl?: string;
    imageBaseUrl?: string;
    textApiKey?: string;
    imageApiKey?: string;
    maxConcurrency?: number;
    globalSeed?: number | null;
}
export type ApiProvider = 'GEMINI' | 'VERTEX' | 'OPENAI' | 'OPENAI_COMPATIBLE' | 'SIMULATED';
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
export interface IGameDesignDocument {
    title: string;
    genre: string;
    playerFantasy: string;
    coreLoop: string[];
    artDirection: string;
    keyMechanics: string[];
    contentPillars: string[];
    productionNotes: string[];
}
export interface IGenerateDesignPackageRequest {
    concept: string;
    globalStyle?: string;
    language?: 'en' | 'zh';
}
export interface IGenerateDesignPackageResponse {
    designDocument: IGameDesignDocument;
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
export interface IReskinGameRequest {
    gameName: string;
    globalStyle?: string;
    language?: 'en' | 'zh';
}
export interface IReskinElement {
    category: string;
    name: string;
    description: string;
    generationHint: string;
}
export interface IReskinGameResponse {
    sourceGame: string;
    description: string;
    elements: IReskinElement[];
    tree: IResourceNode[];
    source: 'ai' | 'fallback';
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