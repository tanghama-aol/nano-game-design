import type { ApiProvider, IResourceNode } from '@nano-game/types';
type ProviderKind = 'text' | 'image';
interface ProviderSettings {
    authMode?: string | null;
    textProvider?: string | null;
    imageProvider?: string | null;
    geminiApiKey?: string | null;
    vertexProjectId?: string | null;
    vertexClientEmail?: string | null;
    vertexPrivateKey?: string | null;
    textModel?: string | null;
    imageModel?: string | null;
    textBaseUrl?: string | null;
    imageBaseUrl?: string | null;
    textApiKey?: string | null;
    imageApiKey?: string | null;
}
interface ResolvedProvider {
    provider: ApiProvider;
    baseUrl?: string;
    apiKey?: string;
    model: string;
}
export declare function hasConfiguredCredential(settings: ProviderSettings | null, kind: ProviderKind): boolean;
export declare function generateText(settings: ProviderSettings | null, systemPrompt: string, userPrompt: string): Promise<string>;
export declare function generateImage(settings: ProviderSettings | null, node: IResourceNode): Promise<string>;
export declare function resolveProvider(settings: ProviderSettings | null, kind: ProviderKind): ResolvedProvider;
export {};
//# sourceMappingURL=ai-provider.d.ts.map