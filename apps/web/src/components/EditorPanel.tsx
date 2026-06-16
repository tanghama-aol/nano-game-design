import { useState } from 'react';
import { STYLE_PRESETS } from '@nano-game/types';
import type { IResourceNode, ResourceType } from '@nano-game/types';
import { Copy, Eye, ImageIcon, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useTreeStore } from '../store/treeStore';
import { SpritePreviewer } from './SpritePreviewer';
import { useI18n } from '../i18n';

const ASSET_TYPES: { label: ResourceType; hint: string }[] = [
  { label: 'Character', hint: 'Unit, prop, building' },
  { label: 'Texture', hint: 'Tiles, materials' },
  { label: 'Scene', hint: 'Backgrounds, key art' },
  { label: 'VFX', hint: 'Impacts, magic, UI FX' },
];

export function EditorPanel() {
  const { t } = useI18n();
  const nodes = useTreeStore(state => state.nodes);
  const selectedNodeId = useTreeStore(state => state.selectedNodeId);
  const updateNode = useTreeStore(state => state.updateNode);
  const [mode, setMode] = useState<'EASY' | 'MANUAL'>('EASY');
  const [copied, setCopied] = useState(false);

  const findNode = (id: string, nList: IResourceNode[]): IResourceNode | null => {
    for (const n of nList) {
      if (n.id === id) return n;
      if (n.children) {
        const found = findNode(id, n.children);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedNode = selectedNodeId ? findNode(selectedNodeId, nodes) : null;

  if (!selectedNode) {
    return (
      <section className="panel flex min-h-[620px] flex-col items-center justify-center p-8 text-center">
        <ImageIcon size={52} className="mb-4 text-slate-600" />
        <h2 className="text-lg font-black text-slate-100">{t('selectAsset')}</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          {t('selectAssetHelp')}
        </p>
      </section>
    );
  }

  const handleChange = (field: keyof IResourceNode, value: IResourceNode[keyof IResourceNode]) => {
    updateNode(selectedNode.id, { [field]: value });
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(selectedNode.prompt || '');
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <section className="panel sticky top-5 min-h-[620px] p-4">
      <div className="panel-header mb-4">
        <h2 className="panel-title">
          <SlidersHorizontal size={17} className="text-amber-300" />
          {t('assetEditor')}
        </h2>

        <div className="flex overflow-hidden rounded-md border border-slate-700 bg-slate-950 text-xs font-bold">
          <button
            className={`px-3 py-2 ${mode === 'EASY' ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-slate-100'}`}
            onClick={() => setMode('EASY')}
          >
            {t('easy')}
          </button>
          <button
            className={`px-3 py-2 ${mode === 'MANUAL' ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-slate-100'}`}
            onClick={() => setMode('MANUAL')}
          >
            {t('manual')}
          </button>
        </div>
      </div>

      <div className="thin-scrollbar max-h-[calc(100vh-9rem)] space-y-4 overflow-y-auto pr-1">
        <div>
          <label className="field-label">{t('assetName')}</label>
          <input
            className="field-input p-2 text-sm font-bold"
            value={selectedNode.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">{t('whatMaking')}</label>
          <div className="grid grid-cols-2 gap-2">
            {ASSET_TYPES.map(type => (
              <button
                key={type.label}
                className={`rounded-md border p-3 text-left transition ${selectedNode.type === type.label ? 'border-cyan-400/70 bg-cyan-400/15 text-cyan-100' : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500'}`}
                onClick={() => handleChange('type', type.label)}
              >
                <span className="block text-sm font-black">{type.label}</span>
                <span className="mt-1 block text-[11px] text-slate-500">{type.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">{t('dimensions')}</label>
            <select
              className="field-input p-2 text-sm"
              value={selectedNode.dimensions || '512x512'}
              onChange={(e) => handleChange('dimensions', e.target.value)}
            >
              <option value="256x256">256 x 256</option>
              <option value="512x512">512 x 512</option>
              <option value="1024x1024">1024 x 1024</option>
            </select>
          </div>
          <div>
            <label className="field-label">{t('animationFrames')}</label>
            <input
              type="number"
              className="field-input p-2 text-sm"
              value={selectedNode.animationFrames || 1}
              onChange={(e) => handleChange('animationFrames', Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={32}
            />
          </div>
        </div>

        <div>
          <label className="field-label">{t('nodeStyleOverride')}</label>
          <select
            className="field-input p-2 text-sm"
            value={selectedNode.style || ''}
            onChange={(e) => handleChange('style', e.target.value)}
          >
            <option value="">{t('inheritGlobalStyle')}</option>
            <optgroup label="Pixel Art">
              {STYLE_PRESETS.PIXEL.map(s => <option key={s} value={s}>{s}</option>)}
            </optgroup>
            <optgroup label="Cartoon & Anime">
              {STYLE_PRESETS.CARTOON.map(s => <option key={s} value={s}>{s}</option>)}
            </optgroup>
            <optgroup label="Realistic 3D">
              {STYLE_PRESETS.REALISTIC.map(s => <option key={s} value={s}>{s}</option>)}
            </optgroup>
          </select>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label className="field-label">{t('nodeSeed')}</label>
            <input
              type="number"
              className="field-input p-2 text-sm"
              placeholder={t('optionalFixedSeed')}
              value={selectedNode.seed || ''}
              onChange={(e) => handleChange('seed', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
          <label className="mt-6 flex min-h-10 items-center gap-2 rounded-md border border-slate-700 bg-slate-900/70 px-3 text-sm font-bold text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 accent-cyan-400"
              checked={!!selectedNode.transparent}
              onChange={(e) => handleChange('transparent', e.target.checked)}
            />
            {t('transparent')}
          </label>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="field-label mb-0">{t('prompt')}</label>
            <button className="ghost-button min-h-0 px-2 py-1 text-xs" onClick={handleCopyPrompt} disabled={!selectedNode.prompt}>
              <Copy size={13} />
              {copied ? t('copied') : t('copy')}
            </button>
          </div>
          <textarea
            className="field-input thin-scrollbar h-36 resize-none p-3 font-mono text-xs leading-5"
            value={selectedNode.prompt || ''}
            placeholder={mode === 'MANUAL' ? 'Write the exact generation prompt...' : 'Generate prompts or add a concise art brief here.'}
            onChange={(e) => handleChange('prompt', e.target.value)}
          />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-950/55 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-black text-slate-100">
              <Eye size={16} className="text-cyan-300" />
              {t('outputPreview')}
            </div>
            <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {selectedNode.status}
            </span>
          </div>

          {selectedNode.resultUrl ? (
            <a href={selectedNode.resultUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-slate-700 bg-slate-900">
              <img src={selectedNode.resultUrl} alt={selectedNode.name} className="aspect-square w-full object-cover" />
            </a>
          ) : (
            <div className="flex aspect-square w-full flex-col items-center justify-center rounded-md border border-dashed border-slate-700 bg-slate-900/60 p-6 text-center">
              <Sparkles size={32} className="mb-3 text-slate-600" />
              <p className="text-sm font-bold text-slate-300">{t('noRenderYet')}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{t('noRenderHelp')}</p>
            </div>
          )}
        </div>

        {selectedNode.resultUrl && selectedNode.animationFrames && selectedNode.animationFrames > 1 && (
          <SpritePreviewer imageUrl={selectedNode.resultUrl} frames={selectedNode.animationFrames} />
        )}
      </div>
    </section>
  );
}
