"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasConfiguredCredential = hasConfiguredCredential;
exports.generateText = generateText;
exports.generateImage = generateImage;
exports.resolveProvider = resolveProvider;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const genai_1 = require("@google/genai");
const vertexai_1 = require("@google-cloud/vertexai");
const crypto_1 = require("../utils/crypto");
const proxy_1 = require("../utils/proxy");
const DEFAULTS = {
    textModel: 'gemini-1.5-pro',
    imageModel: 'imagen-3.0-generate-001',
    openAiBaseUrl: 'https://api.openai.com/v1',
    openAiTextModel: 'gpt-5.5',
    openAiImageModel: 'image2',
};
function hasConfiguredCredential(settings, kind) {
    const resolved = resolveProvider(settings, kind);
    if (resolved.provider === 'SIMULATED')
        return true;
    if (resolved.provider === 'VERTEX') {
        return !!(settings?.vertexProjectId && settings.vertexClientEmail && settings.vertexPrivateKey);
    }
    if (resolved.provider === 'GEMINI') {
        return !!settings?.geminiApiKey || !!process.env.GEMINI_API_KEY || !!findCodexValue('gemini', ['api_key', 'key', 'token', 'apiKey']);
    }
    return !!resolved.apiKey;
}
async function generateText(settings, systemPrompt, userPrompt) {
    const resolved = resolveProvider(settings, 'text');
    const prompt = `${systemPrompt}\n\n${userPrompt}`;
    if (resolved.provider === 'SIMULATED') {
        throw new Error('Text provider is set to simulation.');
    }
    if (resolved.provider === 'GEMINI') {
        const apiKey = getGeminiKey(settings);
        if (!apiKey)
            throw new Error('Gemini API Key missing');
        const ai = new genai_1.GoogleGenAI({ apiKey, fetch: (0, proxy_1.getProxyFetch)() });
        const response = await ai.models.generateContent({
            model: resolved.model || DEFAULTS.textModel,
            contents: prompt,
        });
        return response.text || '';
    }
    if (resolved.provider === 'VERTEX') {
        if (!settings?.vertexProjectId || !settings.vertexClientEmail || !settings.vertexPrivateKey) {
            throw new Error('Vertex credentials incomplete');
        }
        const privateKey = (0, crypto_1.decrypt)(settings.vertexPrivateKey).replace(/\\n/g, '\n');
        const vertexAI = new vertexai_1.VertexAI({
            project: settings.vertexProjectId,
            location: 'us-central1',
            googleAuthOptions: {
                credentials: {
                    client_email: settings.vertexClientEmail,
                    private_key: privateKey,
                },
            },
        });
        const generativeModel = vertexAI.getGenerativeModel({ model: resolved.model || DEFAULTS.textModel });
        const response = await generativeModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        return response.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    return postOpenAiCompatibleText(resolved, systemPrompt, userPrompt);
}
async function generateImage(settings, node) {
    const resolved = resolveProvider(settings, 'image');
    if (resolved.provider === 'OPENAI' || resolved.provider === 'OPENAI_COMPATIBLE') {
        return postOpenAiCompatibleImage(resolved, node);
    }
    if (resolved.provider === 'GEMINI') {
        const apiKey = getGeminiKey(settings);
        if (!apiKey)
            throw new Error('Gemini API Key missing');
        const ai = new genai_1.GoogleGenAI({ apiKey, fetch: (0, proxy_1.getProxyFetch)() });
        const response = (await ai.models.generateContent({
            model: resolved.model || DEFAULTS.imageModel,
            contents: node.prompt || node.name,
        }));
        if (response?.candidates?.[0]) {
            return 'data:image/jpeg;base64,placeholder-from-real-api';
        }
    }
    throw new Error(`Image provider ${resolved.provider} is not available for image generation.`);
}
function resolveProvider(settings, kind) {
    const provider = normalizeProvider(kind === 'text'
        ? settings?.textProvider || process.env.TEXT_PROVIDER || process.env.AI_TEXT_PROVIDER || settings?.authMode
        : settings?.imageProvider || process.env.IMAGE_PROVIDER || process.env.AI_IMAGE_PROVIDER || settings?.authMode);
    if (provider === 'OPENAI' || provider === 'OPENAI_COMPATIBLE') {
        const codexProviderName = provider === 'OPENAI' ? 'openai' : kind;
        const dbKey = kind === 'text' ? settings?.textApiKey : settings?.imageApiKey;
        const dbBaseUrl = kind === 'text' ? settings?.textBaseUrl : settings?.imageBaseUrl;
        const envPrefix = kind === 'text' ? 'TEXT' : 'IMAGE';
        const apiKey = decryptOptional(dbKey) ||
            process.env[`${envPrefix}_API_KEY`] ||
            process.env[`${envPrefix}_TOKEN`] ||
            process.env.OPENAI_API_KEY ||
            process.env.OPENAI_TOKEN ||
            findCodexValue(codexProviderName, ['api_key', 'key', 'token', 'apiKey']) ||
            findCodexValue('openai', ['api_key', 'key', 'token', 'apiKey']);
        const baseUrl = dbBaseUrl ||
            process.env[`${envPrefix}_BASE_URL`] ||
            process.env.OPENAI_BASE_URL ||
            findCodexValue(codexProviderName, ['base_url', 'baseURL', 'baseUrl']) ||
            findCodexValue('openai', ['base_url', 'baseURL', 'baseUrl']) ||
            DEFAULTS.openAiBaseUrl;
        const model = (kind === 'text' ? settings?.textModel : settings?.imageModel) ||
            process.env[`${envPrefix}_MODEL`] ||
            (kind === 'text' ? process.env.OPENAI_TEXT_MODEL : process.env.OPENAI_IMAGE_MODEL) ||
            findCodexValue(codexProviderName, [kind === 'text' ? 'text_model' : 'image_model', 'model']) ||
            (kind === 'text' ? DEFAULTS.openAiTextModel : DEFAULTS.openAiImageModel);
        return { provider, baseUrl, apiKey, model };
    }
    return {
        provider,
        model: (kind === 'text' ? settings?.textModel : settings?.imageModel) ||
            (kind === 'text' ? process.env.TEXT_MODEL : process.env.IMAGE_MODEL) ||
            (kind === 'text' ? DEFAULTS.textModel : DEFAULTS.imageModel),
    };
}
function normalizeProvider(value) {
    const normalized = (value || 'GEMINI').toUpperCase().replace(/[- ]/g, '_');
    if (normalized === 'OPENAI_COMPATIBLE' || normalized === 'OPENAI' || normalized === 'VERTEX' || normalized === 'GEMINI' || normalized === 'SIMULATED') {
        return normalized;
    }
    return 'OPENAI_COMPATIBLE';
}
async function postOpenAiCompatibleText(resolved, systemPrompt, userPrompt) {
    if (!resolved.apiKey)
        throw new Error('OpenAI-compatible API key or token missing');
    const response = await fetch(`${trimSlash(resolved.baseUrl || DEFAULTS.openAiBaseUrl)}/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${resolved.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: resolved.model || DEFAULTS.openAiTextModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.6,
        }),
    });
    if (!response.ok) {
        throw new Error(`Text API failed: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || data.output_text || data.output?.[0]?.content?.[0]?.text || '';
}
async function postOpenAiCompatibleImage(resolved, node) {
    if (!resolved.apiKey)
        throw new Error('OpenAI-compatible image API key or token missing');
    const response = await fetch(`${trimSlash(resolved.baseUrl || DEFAULTS.openAiBaseUrl)}/images/generations`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${resolved.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: resolved.model || DEFAULTS.openAiImageModel,
            prompt: node.prompt || node.name,
            size: normalizeImageSize(node.dimensions),
            response_format: 'b64_json',
        }),
    });
    if (!response.ok) {
        throw new Error(`Image API failed: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();
    const first = data.data?.[0];
    if (first?.b64_json)
        return `data:image/png;base64,${first.b64_json}`;
    if (first?.url)
        return first.url;
    throw new Error('Image API returned no image data');
}
function getGeminiKey(settings) {
    return decryptOptional(settings?.geminiApiKey) || process.env.GEMINI_API_KEY || findCodexValue('gemini', ['api_key', 'key', 'token', 'apiKey']);
}
function decryptOptional(value) {
    if (!value)
        return undefined;
    try {
        return (0, crypto_1.decrypt)(value);
    }
    catch {
        return value;
    }
}
function trimSlash(value) {
    return value.replace(/\/+$/, '');
}
function normalizeImageSize(dimensions) {
    if (!dimensions)
        return '1024x1024';
    if (/^\d+x\d+$/.test(dimensions))
        return dimensions;
    return '1024x1024';
}
function findCodexValue(providerName, keyNames) {
    const config = readCodexConfig();
    const sections = [
        `api.${providerName}`,
        `providers.${providerName}`,
        `model_providers.${providerName}`,
        providerName,
    ];
    for (const section of sections) {
        const values = config[section];
        if (!values)
            continue;
        for (const key of keyNames) {
            const value = values[key];
            if (value)
                return resolveEnvReference(value);
        }
        const envKey = values.env_key || values.envKey;
        if (envKey && process.env[envKey])
            return process.env[envKey];
    }
    return undefined;
}
function readCodexConfig() {
    const candidates = [
        path_1.default.join(process.cwd(), '.codex', 'config.toml'),
        path_1.default.join(os_1.default.homedir(), '.codex', 'config.toml'),
    ];
    const merged = {};
    for (const filePath of candidates) {
        if (!fs_1.default.existsSync(filePath))
            continue;
        Object.assign(merged, parseSimpleToml(fs_1.default.readFileSync(filePath, 'utf8')));
    }
    return merged;
}
function parseSimpleToml(content) {
    const result = {};
    let current = '';
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.replace(/#.*$/, '').trim();
        if (!line)
            continue;
        const section = line.match(/^\[([^\]]+)]$/);
        if (section) {
            current = section[1] || '';
            result[current] ||= {};
            continue;
        }
        const pair = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
        if (!pair || !current)
            continue;
        const key = pair[1];
        const value = pair[2].trim().replace(/^['"]|['"]$/g, '');
        result[current][key] = value;
    }
    return result;
}
function resolveEnvReference(value) {
    const match = value.match(/^\$([A-Za-z_][A-Za-z0-9_]*)$/);
    if (match)
        return process.env[match[1]] || value;
    return value;
}
//# sourceMappingURL=ai-provider.js.map