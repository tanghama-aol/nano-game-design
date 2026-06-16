import fs from 'fs';
import os from 'os';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { VertexAI } from '@google-cloud/vertexai';
import type { ApiProvider, IResourceNode } from '@nano-game/types';
import { decrypt } from '../utils/crypto';
import { getProxyFetch } from '../utils/proxy';

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

const DEFAULTS = {
  textModel: 'gemini-1.5-pro',
  imageModel: 'imagen-3.0-generate-001',
  openAiBaseUrl: 'https://api.openai.com/v1',
  openAiTextModel: 'gpt-5.5',
  openAiImageModel: 'image2',
};

export function hasConfiguredCredential(settings: ProviderSettings | null, kind: ProviderKind): boolean {
  const resolved = resolveProvider(settings, kind);
  if (resolved.provider === 'SIMULATED') return true;
  if (resolved.provider === 'VERTEX') {
    return !!(settings?.vertexProjectId && settings.vertexClientEmail && settings.vertexPrivateKey);
  }
  if (resolved.provider === 'GEMINI') {
    return !!settings?.geminiApiKey || !!process.env.GEMINI_API_KEY || !!findCodexValue('gemini', ['api_key', 'key', 'token', 'apiKey']);
  }
  return !!resolved.apiKey;
}

export async function generateText(settings: ProviderSettings | null, systemPrompt: string, userPrompt: string): Promise<string> {
  const resolved = resolveProvider(settings, 'text');
  const prompt = `${systemPrompt}\n\n${userPrompt}`;

  if (resolved.provider === 'SIMULATED') {
    throw new Error('Text provider is set to simulation.');
  }

  if (resolved.provider === 'GEMINI') {
    const apiKey = getGeminiKey(settings);
    if (!apiKey) throw new Error('Gemini API Key missing');
    const ai = new GoogleGenAI({ apiKey, fetch: getProxyFetch() } as any);
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

    const privateKey = decrypt(settings.vertexPrivateKey).replace(/\\n/g, '\n');
    const vertexAI = new VertexAI({
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
    return (response.response.candidates?.[0]?.content?.parts?.[0] as any)?.text || '';
  }

  return postOpenAiCompatibleText(resolved, systemPrompt, userPrompt);
}

export async function generateImage(settings: ProviderSettings | null, node: IResourceNode): Promise<string> {
  const resolved = resolveProvider(settings, 'image');

  if (resolved.provider === 'OPENAI' || resolved.provider === 'OPENAI_COMPATIBLE') {
    return postOpenAiCompatibleImage(resolved, node);
  }

  if (resolved.provider === 'GEMINI') {
    const apiKey = getGeminiKey(settings);
    if (!apiKey) throw new Error('Gemini API Key missing');
    const ai = new GoogleGenAI({ apiKey, fetch: getProxyFetch() } as any);
    const response = (await ai.models.generateContent({
      model: resolved.model || DEFAULTS.imageModel,
      contents: node.prompt || node.name,
    })) as any;
    if (response?.candidates?.[0]) {
      return 'data:image/jpeg;base64,placeholder-from-real-api';
    }
  }

  throw new Error(`Image provider ${resolved.provider} is not available for image generation.`);
}

export function resolveProvider(settings: ProviderSettings | null, kind: ProviderKind): ResolvedProvider {
  const provider = normalizeProvider(
    kind === 'text'
      ? settings?.textProvider || process.env.TEXT_PROVIDER || process.env.AI_TEXT_PROVIDER || settings?.authMode
      : settings?.imageProvider || process.env.IMAGE_PROVIDER || process.env.AI_IMAGE_PROVIDER || settings?.authMode,
  );

  if (provider === 'OPENAI' || provider === 'OPENAI_COMPATIBLE') {
    const codexProviderName = provider === 'OPENAI' ? 'openai' : kind;
    const dbKey = kind === 'text' ? settings?.textApiKey : settings?.imageApiKey;
    const dbBaseUrl = kind === 'text' ? settings?.textBaseUrl : settings?.imageBaseUrl;
    const envPrefix = kind === 'text' ? 'TEXT' : 'IMAGE';

    const apiKey =
      decryptOptional(dbKey) ||
      process.env[`${envPrefix}_API_KEY`] ||
      process.env[`${envPrefix}_TOKEN`] ||
      process.env.OPENAI_API_KEY ||
      process.env.OPENAI_TOKEN ||
      findCodexValue(codexProviderName, ['api_key', 'key', 'token', 'apiKey']) ||
      findCodexValue('openai', ['api_key', 'key', 'token', 'apiKey']);

    const baseUrl =
      dbBaseUrl ||
      process.env[`${envPrefix}_BASE_URL`] ||
      process.env.OPENAI_BASE_URL ||
      findCodexValue(codexProviderName, ['base_url', 'baseURL', 'baseUrl']) ||
      findCodexValue('openai', ['base_url', 'baseURL', 'baseUrl']) ||
      DEFAULTS.openAiBaseUrl;

    const model =
      (kind === 'text' ? settings?.textModel : settings?.imageModel) ||
      process.env[`${envPrefix}_MODEL`] ||
      (kind === 'text' ? process.env.OPENAI_TEXT_MODEL : process.env.OPENAI_IMAGE_MODEL) ||
      findCodexValue(codexProviderName, [kind === 'text' ? 'text_model' : 'image_model', 'model']) ||
      (kind === 'text' ? DEFAULTS.openAiTextModel : DEFAULTS.openAiImageModel);

    return { provider, baseUrl, apiKey, model };
  }

  return {
    provider,
    model:
      (kind === 'text' ? settings?.textModel : settings?.imageModel) ||
      (kind === 'text' ? process.env.TEXT_MODEL : process.env.IMAGE_MODEL) ||
      (kind === 'text' ? DEFAULTS.textModel : DEFAULTS.imageModel),
  };
}

function normalizeProvider(value?: string | null): ApiProvider {
  const normalized = (value || 'GEMINI').toUpperCase().replace(/[- ]/g, '_');
  if (normalized === 'OPENAI_COMPATIBLE' || normalized === 'OPENAI' || normalized === 'VERTEX' || normalized === 'GEMINI' || normalized === 'SIMULATED') {
    return normalized as ApiProvider;
  }
  return 'OPENAI_COMPATIBLE';
}

async function postOpenAiCompatibleText(resolved: ResolvedProvider, systemPrompt: string, userPrompt: string): Promise<string> {
  if (!resolved.apiKey) throw new Error('OpenAI-compatible API key or token missing');
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

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || data.output_text || data.output?.[0]?.content?.[0]?.text || '';
}

async function postOpenAiCompatibleImage(resolved: ResolvedProvider, node: IResourceNode): Promise<string> {
  if (!resolved.apiKey) throw new Error('OpenAI-compatible image API key or token missing');
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

  const data = await response.json() as any;
  const first = data.data?.[0];
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  if (first?.url) return first.url;
  throw new Error('Image API returned no image data');
}

function getGeminiKey(settings: ProviderSettings | null): string | undefined {
  return decryptOptional(settings?.geminiApiKey) || process.env.GEMINI_API_KEY || findCodexValue('gemini', ['api_key', 'key', 'token', 'apiKey']);
}

function decryptOptional(value?: string | null): string | undefined {
  if (!value) return undefined;
  try {
    return decrypt(value);
  } catch {
    return value;
  }
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizeImageSize(dimensions?: string): string {
  if (!dimensions) return '1024x1024';
  if (/^\d+x\d+$/.test(dimensions)) return dimensions;
  return '1024x1024';
}

function findCodexValue(providerName: string, keyNames: string[]): string | undefined {
  const config = readCodexConfig();
  const sections = [
    `api.${providerName}`,
    `providers.${providerName}`,
    `model_providers.${providerName}`,
    providerName,
  ];

  for (const section of sections) {
    const values = config[section];
    if (!values) continue;
    for (const key of keyNames) {
      const value = values[key];
      if (value) return resolveEnvReference(value);
    }
    const envKey = values.env_key || values.envKey;
    if (envKey && process.env[envKey]) return process.env[envKey];
  }

  return undefined;
}

function readCodexConfig(): Record<string, Record<string, string>> {
  const candidates = [
    path.join(process.cwd(), '.codex', 'config.toml'),
    path.join(os.homedir(), '.codex', 'config.toml'),
  ];

  const merged: Record<string, Record<string, string>> = {};
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    Object.assign(merged, parseSimpleToml(fs.readFileSync(filePath, 'utf8')));
  }
  return merged;
}

function parseSimpleToml(content: string): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  let current = '';

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const section = line.match(/^\[([^\]]+)]$/);
    if (section) {
      current = section[1] || '';
      result[current] ||= {};
      continue;
    }
    const pair = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
    if (!pair || !current) continue;
    const key = pair[1]!;
    const value = pair[2]!.trim().replace(/^['"]|['"]$/g, '');
    result[current]![key] = value;
  }

  return result;
}

function resolveEnvReference(value: string): string {
  const match = value.match(/^\$([A-Za-z_][A-Za-z0-9_]*)$/);
  if (match) return process.env[match[1]!] || value;
  return value;
}
