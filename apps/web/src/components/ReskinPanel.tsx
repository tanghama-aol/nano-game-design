import { useState } from 'react';
import axios from 'axios';
import type { IReskinGameResponse } from '@nano-game/types';
import { Layers3, WandSparkles } from 'lucide-react';
import { useTreeStore } from '../store/treeStore';
import { useI18n } from '../i18n';

export function ReskinPanel() {
  const { language, t } = useI18n();
  const globalStyle = useTreeStore(state => state.globalStyle);
  const setNodes = useTreeStore(state => state.setNodes);
  const [gameName, setGameName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IReskinGameResponse | null>(null);
  const [message, setMessage] = useState('');

  const handleReskin = async () => {
    if (!gameName.trim()) {
      setMessage(t('reskinRequired'));
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post<IReskinGameResponse>('http://localhost:3001/api/reskin-game', {
        gameName,
        globalStyle,
        language,
      });
      setNodes(res.data.tree);
      setResult(res.data);
      setMessage(res.data.source === 'fallback' ? t('reskinFallback') : t('reskinApplied'));
    } catch {
      setMessage(t('generateTreeFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel p-4">
      <div className="panel-header mb-4">
        <h2 className="panel-title">
          <Layers3 size={17} className="text-emerald-300" />
          {t('oneClickReskin')}
        </h2>
      </div>

      <div className="mb-3">
        <label className="field-label">{t('sourceGameName')}</label>
        <input
          className="field-input p-2 text-sm"
          value={gameName}
          placeholder={t('sourceGamePlaceholder')}
          onChange={(event) => setGameName(event.target.value)}
        />
      </div>

      <button className="primary-button w-full" onClick={handleReskin} disabled={loading}>
        <WandSparkles size={16} />
        {loading ? t('reskinning') : t('reskinButton')}
      </button>

      {message && (
        <div className="mt-3 rounded-md border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
          {message}
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-3">
          <p className="rounded-md border border-slate-700 bg-slate-950/60 p-3 text-xs leading-5 text-slate-300">
            {result.description}
          </p>
          <div>
            <div className="field-label">{t('extractedElements')}</div>
            <div className="thin-scrollbar max-h-32 space-y-2 overflow-y-auto pr-1">
              {result.elements.slice(0, 5).map((element) => (
                <div key={`${element.category}-${element.name}`} className="rounded-md border border-slate-700 bg-slate-900/70 p-2">
                  <div className="text-xs font-black text-slate-100">{element.name}</div>
                  <div className="mt-1 text-[11px] leading-4 text-slate-500">{element.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
