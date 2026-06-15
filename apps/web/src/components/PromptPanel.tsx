import { useState } from 'react';
import axios from 'axios';
import { useTreeStore } from '../store/treeStore';
import { STYLE_PRESETS } from '@nano-game/types';
import type { IResourceNode, IGeneratePromptsRequest, IGeneratePromptsResponse } from '@nano-game/types';
import { FileText, Sparkles } from 'lucide-react';

const NEGATIVE_PROMPTS = "blurry, cropped, deformed, watermark, text, signature, worst quality, low quality, normal quality, jpeg artifacts";

export function PromptPanel() {
  const nodes = useTreeStore(state => state.nodes);
  const globalStyle = useTreeStore(state => state.globalStyle);
  const setGlobalStyle = useTreeStore(state => state.setGlobalStyle);
  const batchUpdateNodes = useTreeStore(state => state.batchUpdateNodes);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGeneratePrompts = async () => {
    if (nodes.length === 0) {
      setMessage('Generate or add resources before creating prompts.');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    const flatNodes: IGeneratePromptsRequest['nodes'] = [];
    const traverse = (nList: IResourceNode[]) => {
      nList.forEach(node => {
        flatNodes.push({ 
          id: node.id, 
          name: node.name, 
          type: node.type, 
          currentPrompt: node.prompt,
          styleOverride: node.style,
          animationFrames: node.animationFrames,
        });
        if (node.children) traverse(node.children);
      });
    };
    traverse(nodes);

    try {
      const payload: IGeneratePromptsRequest = { nodes: flatNodes, globalStyle };
      const res = await axios.post<IGeneratePromptsResponse>('http://localhost:3001/api/generate-prompts', payload);
      
      const promptsMap = res.data.prompts;
      const updates: Record<string, Partial<IResourceNode>> = {};
      
      Object.entries(promptsMap).forEach(([id, prompt]) => {
        updates[id] = { prompt };
      });
      
      batchUpdateNodes(updates);
      setMessage(`Applied ${Object.keys(updates).length} production prompts to the tree.`);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to generate prompts. Check credentials and backend logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel p-4">
      <div className="panel-header mb-4">
        <h2 className="panel-title">
          <FileText size={17} className="text-amber-300" />
          Style & Prompts
        </h2>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-300">
          {nodes.length} root nodes
        </span>
      </div>
      
      <div className="mb-4">
        <label className="field-label">Global Style Preset</label>
        <select 
          className="field-input p-2 text-sm"
          value={globalStyle}
          onChange={(e) => setGlobalStyle(e.target.value)}
        >
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
        <p className="mt-1 text-[11px] text-slate-500">
          Individual nodes can override this in the Editor panel.
        </p>
      </div>

      <div className="mb-4">
        <label className="field-label">Built-in Negative Prompts</label>
        <div className="rounded-md border border-red-400/20 bg-red-500/10 p-2 text-xs leading-5 text-red-100">
          {NEGATIVE_PROMPTS}
        </div>
        <p className="mt-1 text-[11px] text-slate-500">Automatically applied during image generation.</p>
      </div>

      {message && (
        <div className="mb-3 rounded-md border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
          {message}
        </div>
      )}

      <button 
        className="secondary-button w-full"
        onClick={handleGeneratePrompts}
        disabled={loading || nodes.length === 0}
      >
        <Sparkles size={16} />
        {loading ? 'Generating prompts...' : 'Generate Prompts for Tree'}
      </button>
    </section>
  );
}
