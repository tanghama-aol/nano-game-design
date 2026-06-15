import { useState } from 'react';
import axios from 'axios';
import { useTreeStore } from '../store/treeStore';
import { WandSparkles } from 'lucide-react';

const CONCEPT_STARTERS = [
  'A cozy tactical farming RPG with mushroom villages, modular tools, and seasonal monsters.',
  'A 2D cyberpunk courier platformer with neon rooftops, drone enemies, and rain-soaked streets.',
  'A hand-painted ocean roguelite about rebuilding a tiny lighthouse after each expedition.',
];

export function ConceptInput() {
  const [concept, setConcept] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setNodes = useTreeStore(state => state.setNodes);

  const handleGenerate = async () => {
    if (!concept.trim()) {
      setError('Enter a game concept before generating the asset tree.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3001/api/generate-tree', { concept });
      if (res.data.tree) {
        setNodes(res.data.tree);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to generate tree. Check API settings and backend status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel p-4">
      <div className="panel-header mb-4">
        <h2 className="panel-title">
          <WandSparkles size={17} className="text-cyan-300" />
          Game Concept
        </h2>
      </div>

      <textarea 
        className="field-input thin-scrollbar h-32 resize-none p-3 text-sm leading-6"
        placeholder="Describe the game, camera, mood, and key mechanics..."
        value={concept}
        onChange={(e) => setConcept(e.target.value)}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {CONCEPT_STARTERS.map((starter, index) => (
          <button
            key={starter}
            type="button"
            className="rounded-md border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-left text-[11px] font-semibold text-slate-300 hover:border-cyan-400/60 hover:text-cyan-100"
            onClick={() => setConcept(starter)}
          >
            Template {index + 1}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <button 
        className="primary-button mt-4 w-full"
        onClick={handleGenerate}
        disabled={loading}
      >
        <WandSparkles size={16} />
        {loading ? 'Generating resource tree...' : 'Generate Resource Tree'}
      </button>
    </section>
  );
}
