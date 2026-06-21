import { useTreeStore } from '../store/treeStore';
import type { IResourceNode } from '@nano-game/types';
import { ChevronRight, ChevronDown, Plus, Trash2, ListTree } from 'lucide-react';
import { Tree, MultiBackend, getBackendOptions } from "@minoru/react-dnd-treeview";
import type { NodeModel } from "@minoru/react-dnd-treeview";
import { DndProvider } from "react-dnd";
import { useI18n } from '../i18n';

export function ResourceTree() {
  const { t } = useI18n();
  const nodes = useTreeStore(state => state.nodes);
  const setNodes = useTreeStore(state => state.setNodes);
  const addNode = useTreeStore(state => state.addNode);
  const deleteNode = useTreeStore(state => state.deleteNode);
  const selectedNodeId = useTreeStore(state => state.selectedNodeId);
  const setSelectedNodeId = useTreeStore(state => state.setSelectedNodeId);

  const statusColors: Record<string, string> = {
    pending: 'border-slate-600 bg-slate-700/60 text-slate-200',
    generating: 'border-blue-400/40 bg-blue-500/15 text-blue-200 animate-pulse',
    success: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
    failed: 'border-red-400/40 bg-red-500/15 text-red-200',
  };

  const handleAddNode = (parentId: string | null = null) => {
    addNode(parentId, {
      name: parentId ? t('newChildAsset') : t('newAsset'),
      type: 'Character',
      prompt: '',
      dimensions: '512x512',
      animationFrames: 1,
      transparent: true,
      children: [],
    });
  };

  const getFlatData = (list: IResourceNode[], parentId: string | number = 0): NodeModel<IResourceNode>[] => {
    // @minoru/react-dnd-treeview works with flat rows and parent IDs. The app's
    // domain model is nested, so we convert before rendering.
    let result: NodeModel<IResourceNode>[] = [];
    list.forEach(node => {
      result.push({
        id: node.id,
        parent: parentId,
        text: node.name,
        droppable: true,
        data: node
      });
      if (node.children) {
        result = result.concat(getFlatData(node.children, node.id));
      }
    });
    return result;
  };

  const getNestedData = (flatData: NodeModel<IResourceNode>[], parentId: string | number = 0): IResourceNode[] => {
    // After a drag/drop, convert the library's flat tree back into the nested
    // IResourceNode[] shape used by the store, API, and exporter.
    const children = flatData.filter(node => node.parent === parentId);
    return children.map(node => {
      const nestedChildren = getNestedData(flatData, node.id);
      return {
        ...node.data!,
        children: nestedChildren.length > 0 ? nestedChildren : undefined
      };
    });
  };

  const handleDrop = (newTree: NodeModel<IResourceNode>[]) => {
    const nested = getNestedData(newTree);
    setNodes(nested);
  };

  const flatNodes = getFlatData(nodes);

  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      {/* DndProvider supplies HTML5/touch drag-and-drop backends for the Tree. */}
      <section className="panel min-h-[520px] p-4">
        <div className="panel-header mb-4">
          <h2 className="panel-title">
            <ListTree size={17} className="text-cyan-300" />
            {t('resourceTree')}
          </h2>
          <button className="secondary-button min-h-0 px-2.5 py-1.5 text-xs" onClick={() => handleAddNode()}>
            <Plus size={14} /> {t('rootNode')}
          </button>
        </div>
        
        {nodes.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950/45 px-6 text-center">
            <ListTree size={42} className="mb-4 text-slate-600" />
            <div className="text-sm font-bold text-slate-200">{t('noResourcesYet')}</div>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
              {t('noResourcesHelp')}
            </p>
            <button className="primary-button mt-4" onClick={() => handleAddNode()}>
              <Plus size={16} />
              {t('addFirstAsset')}
            </button>
          </div>
        ) : (
          <Tree
            tree={flatNodes}
            rootId={0}
            render={(node, { depth, isOpen, onToggle }) => {
              const resNode = node.data!;
              const isSelected = selectedNodeId === resNode.id;
              
              return (
                <div 
                  className={`group flex min-h-12 cursor-pointer items-center rounded-md border px-2 py-2 transition ${isSelected ? 'border-cyan-400/50 bg-cyan-500/12 shadow-lg shadow-cyan-950/20' : 'border-transparent hover:border-slate-700 hover:bg-slate-900/80'}`}
                  style={{ marginLeft: `${depth * 20}px` }}
                  onClick={() => setSelectedNodeId(resNode.id)}
                >
                  <div className="mr-1 flex w-5 items-center justify-center text-slate-400" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                    {flatNodes.some(n => n.parent === node.id) && (
                      isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span className="min-w-0 truncate text-sm font-bold text-slate-100">{resNode.name}</span>
                    <span className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[11px] text-slate-400">{resNode.type}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColors[resNode.status] || 'border-slate-700 bg-slate-800 text-slate-300'}`}>
                      {resNode.status}
                    </span>
                    {resNode.resultUrl && (
                      <a href={resNode.resultUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-cyan-300 hover:text-cyan-100" onClick={e => e.stopPropagation()}>
                        View
                      </a>
                    )}
                  </div>
                  <div className="hidden gap-1 pr-1 group-hover:flex">
                    <button 
                      className="rounded p-1 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-200"
                      onClick={(e) => { e.stopPropagation(); handleAddNode(resNode.id); }}
                      aria-label={`Add child to ${resNode.name}`}
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      className="rounded p-1 text-red-300 hover:bg-red-500/10 hover:text-red-100"
                      onClick={(e) => { e.stopPropagation(); deleteNode(resNode.id); }}
                      aria-label={`Delete ${resNode.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            }}
            onDrop={handleDrop}
            classes={{
              root: "flex flex-col gap-1 thin-scrollbar overflow-x-auto",
              draggingSource: "opacity-50",
              dropTarget: "bg-cyan-500/15"
            }}
          />
        )}
      </section>
    </DndProvider>
  );
}
