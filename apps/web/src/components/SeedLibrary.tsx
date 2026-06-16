import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTreeStore } from '../store/treeStore';
import type { IResourceNode } from '@nano-game/types';
import { Dices, Save, Sprout } from 'lucide-react';
import { useI18n } from '../i18n';

interface IGoldenSeed {
  id: string;
  seed: number;
  name: string;
  description: string;
}

export function SeedLibrary() {
  const { t } = useI18n();
  const [seeds, setSeeds] = useState<IGoldenSeed[]>([]);
  const [globalSeed, setGlobalSeed] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const nodes = useTreeStore(state => state.nodes);
  const batchUpdateNodes = useTreeStore(state => state.batchUpdateNodes);

  useEffect(() => {
    setSeeds([
      { id: '1', seed: 1048576, name: 'Protagonist Template', description: 'Good proportions for characters' },
      { id: '2', seed: 42424242, name: 'Cyberpunk Red', description: 'Strong neon contrast' }
    ]);
    axios.get('http://localhost:3001/api/settings')
      .then((res) => {
        if (res.data.globalSeed) setGlobalSeed(res.data.globalSeed);
      })
      .catch(() => {
        setMessage(t('backendUnavailableSeed'));
      });
  }, []);

  const flatten = (list: IResourceNode[]): IResourceNode[] => {
    return list.flatMap(node => [node, ...(node.children ? flatten(node.children) : [])]);
  };

  const handleSaveGlobal = async () => {
    setSaving(true);
    setMessage('');
    try {
      await axios.post('http://localhost:3001/api/settings', {
        globalSeed: globalSeed === '' ? null : globalSeed,
      });
      setMessage(globalSeed === '' ? t('globalSeedCleared') : `${t('globalSeedSaved')} ${globalSeed}`);
    } catch {
      setMessage(t('backendUnavailableSeed'));
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToNodes = () => {
    if (globalSeed === '') {
      setMessage(t('setGlobalSeedFirst'));
      return;
    }

    const updates: Record<string, Partial<IResourceNode>> = {};
    flatten(nodes).forEach(node => {
      if (node.status === 'pending' || node.status === 'failed') {
        updates[node.id] = { seed: globalSeed };
      }
    });

    batchUpdateNodes(updates);
    setMessage(`${t('seedApplied')} ${Object.keys(updates).length}`);
  };

  return (
    <section className="panel p-4">
      <div className="panel-header mb-4">
        <h2 className="panel-title">
          <Dices size={17} className="text-emerald-300" />
          {t('goldenSeeds')}
        </h2>
      </div>
      
      <div className="mb-4">
        <label className="field-label">{t('globalBaseSeed')}</label>
        <div className="flex gap-2">
          <input 
            type="number" 
            placeholder="e.g. 1048576"
            className="field-input p-2 text-sm"
            value={globalSeed}
            onChange={(e) => setGlobalSeed(e.target.value ? parseInt(e.target.value) : '')}
          />
          <button 
            className="secondary-button whitespace-nowrap px-3"
            onClick={handleSaveGlobal}
            disabled={saving}
          >
            <Save size={15} />
          </button>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">{t('seedHelp')}</p>
      </div>

      <button className="primary-button mb-4 w-full" onClick={handleApplyToNodes} disabled={nodes.length === 0}>
        <Sprout size={16} />
        {t('applySeedPending')}
      </button>

      {message && (
        <div className="mb-3 rounded-md border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
          {message}
        </div>
      )}

      <div className="space-y-2">
        <label className="field-label">{t('savedGoldenSeeds')}</label>
        {seeds.map(s => (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-700 bg-slate-900/70 p-2 text-sm">
            <div>
              <span className="block font-bold text-slate-100">{s.name}</span>
              <span className="font-mono text-xs text-slate-500">Seed: {s.seed}</span>
            </div>
            <button 
              className="ghost-button min-h-0 px-2 py-1 text-xs text-cyan-200"
              onClick={() => setGlobalSeed(s.seed)}
            >
              {t('use')}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
