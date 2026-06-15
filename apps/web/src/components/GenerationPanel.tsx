import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { useTreeStore } from '../store/treeStore';
import { io } from 'socket.io-client';
import type { IResourceNode, ITaskProgress } from '@nano-game/types';
import { Archive, Download, Play, Save } from 'lucide-react';

const socket = io('http://localhost:3001');

export function GenerationPanel() {
  const nodes = useTreeStore(state => state.nodes);
  const setNodes = useTreeStore(state => state.setNodes);
  const updateNode = useTreeStore(state => state.updateNode);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const flatNodes = useMemo(() => {
    const flatten = (list: IResourceNode[]): IResourceNode[] => {
      return list.flatMap(node => [node, ...(node.children ? flatten(node.children) : [])]);
    };
    return flatten(nodes);
  }, [nodes]);

  const readyCount = flatNodes.filter(node => node.status === 'success').length;
  const queuedCount = flatNodes.filter(node => node.status === 'pending' || node.status === 'failed').length;

  useEffect(() => {
    axios.get('http://localhost:3001/api/projects/load')
      .then(res => {
        if (res.data.project) {
          setProjectId(res.data.project.id);
          setNodes(res.data.project.treeData);
          setIsGenerating(res.data.project.isGenerating);
          setMessage('Loaded saved project state.');
        }
      })
      .catch(() => setMessage('Backend unavailable. Generation and export require the API server.'));
  }, []);

  useEffect(() => {
    if (!projectId) return;

    socket.on(`task:progress:${projectId}`, (data: ITaskProgress) => {
      updateNode(data.nodeId, { 
        status: data.status, 
        resultUrl: data.resultUrl,
        seed: data.seed 
      });
      setMessage(data.status === 'success' ? 'Asset completed.' : `Asset ${data.status}.`);
    });

    return () => {
      socket.off(`task:progress:${projectId}`);
    };
  }, [projectId]);

  useEffect(() => {
    if (isGenerating && flatNodes.length > 0 && flatNodes.every(node => node.status === 'success' || node.status === 'failed')) {
      setIsGenerating(false);
    }
  }, [flatNodes, isGenerating]);

  const saveProject = async () => {
    try {
      const res = await axios.post('http://localhost:3001/api/projects/save', {
        treeData: nodes,
        isGenerating
      });
      setProjectId(res.data.id);
      setMessage('Project state saved.');
      return res.data.id;
    } catch (e) {
      console.error(e);
      setMessage('Failed to save project state.');
      return null;
    }
  };

  const handleGenerate = async () => {
    if (nodes.length === 0) {
      setMessage('No resources to generate.');
      return;
    }
    
    const id = await saveProject();
    if (!id) return;

    setIsGenerating(true);
    try {
      const res = await axios.post('http://localhost:3001/api/projects/generate', { projectId: id });
      setMessage(`Queued ${res.data.queued} assets for generation.`);
    } catch (e) {
      console.error(e);
      setMessage('Failed to start generation.');
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!projectId) {
      setMessage('Save the project before exporting.');
      return;
    }
    window.open(`http://localhost:3001/api/projects/export/${projectId}`, '_blank');
  };

  return (
    <section className="panel p-4">
      <div className="panel-header mb-4">
        <h2 className="panel-title">
          <Archive size={17} className="text-emerald-300" />
          Generation & Export
        </h2>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-300">
          {readyCount}/{flatNodes.length} ready
        </span>
      </div>
      
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <button 
          className="primary-button"
          onClick={handleGenerate}
          disabled={nodes.length === 0 || isGenerating || queuedCount === 0}
        >
          <Play size={16} />
          {isGenerating ? 'Generation Running...' : `Generate Assets (${queuedCount})`}
        </button>
        <button 
          className="secondary-button"
          onClick={saveProject}
        >
          <Save size={16} />
          Save State
        </button>
      </div>
      
      <div className="mt-4 border-t border-slate-800 pt-4">
        <button 
          className="secondary-button w-full"
          onClick={handleExport}
          disabled={!projectId || readyCount === 0}
        >
          <Download size={16} />
          Export ZIP with Metadata
        </button>
      </div>

      {message && (
        <div className="mt-3 rounded-md border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
          {message}
        </div>
      )}

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Export includes successful nodes, prompts, seeds, and metadata in the current tree structure.
      </p>
    </section>
  );
}
