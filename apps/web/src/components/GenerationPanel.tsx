import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { useTreeStore } from '../store/treeStore';
import { io } from 'socket.io-client';
import type { IResourceNode, ITaskProgress } from '@nano-game/types';
import { Archive, Download, Play, Save } from 'lucide-react';
import { useI18n } from '../i18n';

// The socket is module-scoped so all renders of this component share one
// client connection. Event listeners are still registered/removed in effects.
const socket = io('http://localhost:3001');

export function GenerationPanel() {
  const { t } = useI18n();
  const nodes = useTreeStore(state => state.nodes);
  const setNodes = useTreeStore(state => state.setNodes);
  const updateNode = useTreeStore(state => state.updateNode);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const flatNodes = useMemo(() => {
    // useMemo avoids re-flattening during unrelated state changes such as
    // message text updates.
    const flatten = (list: IResourceNode[]): IResourceNode[] => {
      return list.flatMap(node => [node, ...(node.children ? flatten(node.children) : [])]);
    };
    return flatten(nodes);
  }, [nodes]);

  const readyCount = flatNodes.filter(node => node.status === 'success').length;
  const queuedCount = flatNodes.filter(node => node.status === 'pending' || node.status === 'failed').length;
  const hasGenerationFinished = flatNodes.length > 0 && flatNodes.every(node => node.status === 'success' || node.status === 'failed');
  const generationRunning = isGenerating && !hasGenerationFinished;

  useEffect(() => {
    // Load the last saved local project on mount. The API currently stores one
    // active project, so there is no project picker in the frontend.
    axios.get('http://localhost:3001/api/projects/load')
      .then(res => {
        if (res.data.project) {
          setProjectId(res.data.project.id);
          setNodes(res.data.project.treeData);
          setIsGenerating(res.data.project.isGenerating);
          setMessage(t('projectLoaded'));
        }
      })
      .catch(() => setMessage(t('backendUnavailableGeneration')));
  }, [setNodes, t]);

  useEffect(() => {
    if (!projectId) return;

    // The backend emits progress on a project-specific channel. This keeps
    // multiple browser tabs/projects from consuming unrelated job events.
    socket.on(`task:progress:${projectId}`, (data: ITaskProgress) => {
      updateNode(data.nodeId, { 
        status: data.status, 
        resultUrl: data.resultUrl,
        seed: data.seed 
      });
      setMessage(data.status === 'success' ? `${t('assets')} ${t('ready').toLowerCase()}.` : `${t('assets')} ${data.status}.`);
    });

    return () => {
      socket.off(`task:progress:${projectId}`);
    };
  }, [projectId, t, updateNode]);

  const saveProject = async () => {
    try {
      // Save before generation so queued jobs can update the same persisted
      // tree while the browser receives live Socket.IO progress.
      const res = await axios.post('http://localhost:3001/api/projects/save', {
        treeData: nodes,
        isGenerating: generationRunning
      });
      setProjectId(res.data.id);
      setMessage(t('projectSaved'));
      return res.data.id;
    } catch (e) {
      console.error(e);
      setMessage(t('projectSaveFailed'));
      return null;
    }
  };

  const handleGenerate = async () => {
    if (nodes.length === 0) {
      setMessage(t('noResources'));
      return;
    }
    
    const id = await saveProject();
    if (!id) return;

    setIsGenerating(true);
    try {
      const res = await axios.post('http://localhost:3001/api/projects/generate', { projectId: id });
      setMessage(`${res.data.queued} ${t('queuedAssets')}`);
    } catch (e) {
      console.error(e);
      setMessage(t('generationFailed'));
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!projectId) {
      setMessage(t('saveBeforeExport'));
      return;
    }
    // Export is a normal browser download because the API streams a ZIP file.
    window.open(`http://localhost:3001/api/projects/export/${projectId}`, '_blank');
  };

  return (
    <section className="panel p-4">
      <div className="panel-header mb-4">
        <h2 className="panel-title">
          <Archive size={17} className="text-emerald-300" />
          {t('generationExport')}
        </h2>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-300">
          {readyCount}/{flatNodes.length} {t('ready').toLowerCase()}
        </span>
      </div>
      
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <button 
          className="primary-button"
          onClick={handleGenerate}
          disabled={nodes.length === 0 || generationRunning || queuedCount === 0}
        >
          <Play size={16} />
          {generationRunning ? t('generationRunning') : `${t('generateAssets')} (${queuedCount})`}
        </button>
        <button 
          className="secondary-button"
          onClick={saveProject}
        >
          <Save size={16} />
          {t('saveState')}
        </button>
      </div>
      
      <div className="mt-4 border-t border-slate-800 pt-4">
        <button 
          className="secondary-button w-full"
          onClick={handleExport}
          disabled={!projectId || readyCount === 0}
        >
          <Download size={16} />
          {t('exportZip')}
        </button>
      </div>

      {message && (
        <div className="mt-3 rounded-md border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
          {message}
        </div>
      )}

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {t('exportHelp')}
      </p>
    </section>
  );
}
