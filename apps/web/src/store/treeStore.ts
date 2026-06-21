import { create } from 'zustand';
import type { IGameDesignDocument, IResourceNode } from '@nano-game/types';
import { v4 as uuidv4 } from 'uuid';

interface TreeState {
  nodes: IResourceNode[];
  designDocument: IGameDesignDocument | null;
  globalStyle: string;
  selectedNodeId: string | null;
  setDesignDocument: (document: IGameDesignDocument | null) => void;
  setGlobalStyle: (style: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setNodes: (nodes: IResourceNode[]) => void;
  updateNode: (id: string, data: Partial<IResourceNode>) => void;
  batchUpdateNodes: (updates: Record<string, Partial<IResourceNode>>) => void;
  addNode: (parentId: string | null, node: Omit<IResourceNode, 'id' | 'status'>) => void;
  deleteNode: (id: string) => void;
}

// Zustand gives the app a tiny global store without reducers or context
// providers. Components subscribe to only the slices they read, which keeps
// tree edits and progress updates straightforward.
export const useTreeStore = create<TreeState>((set) => ({
  nodes: [],
  designDocument: null,
  globalStyle: 'Pixel Art (16-bit)',
  selectedNodeId: null,
  setDesignDocument: (document) => set({ designDocument: document }),
  setGlobalStyle: (style) => set({ globalStyle: style }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setNodes: (nodes) => set({ nodes }),
  
  updateNode: (id, data) => set((state) => {
    // Keep updates immutable: React can only re-render reliably when each
    // changed branch returns a new object/array reference.
    const updateRecursive = (nodes: IResourceNode[]): IResourceNode[] => {
      return nodes.map(node => {
        if (node.id === id) return { ...node, ...data };
        if (node.children) return { ...node, children: updateRecursive(node.children) };
        return node;
      });
    };
    return { nodes: updateRecursive(state.nodes) };
  }),

  batchUpdateNodes: (updates) => set((state) => {
    // Batch updates are used after prompt generation and seed application to
    // avoid calling set() once per node.
    const updateRecursive = (nodes: IResourceNode[]): IResourceNode[] => {
      return nodes.map(node => {
        let updatedNode = node;
        if (updates[node.id]) {
          updatedNode = { ...updatedNode, ...updates[node.id] };
        }
        if (updatedNode.children) {
          updatedNode = { ...updatedNode, children: updateRecursive(updatedNode.children) };
        }
        return updatedNode;
      });
    };
    return { nodes: updateRecursive(state.nodes) };
  }),

  addNode: (parentId, newNodeData) => set((state) => {
    const newNode: IResourceNode = {
      ...newNodeData,
      id: uuidv4(),
      status: 'pending',
    };

    // A null parent means "add a root node"; otherwise recurse until the parent
    // is found and append to its children.
    if (!parentId) return { nodes: [...state.nodes, newNode] };

    const addRecursive = (nodes: IResourceNode[]): IResourceNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) return { ...node, children: [...(node.children || []), newNode] };
        if (node.children) return { ...node, children: addRecursive(node.children) };
        return node;
      });
    };
    return { nodes: addRecursive(state.nodes) };
  }),

  deleteNode: (id) => set((state) => {
    // Delete is also recursive because child nodes can be nested arbitrarily
    // deep by the drag-and-drop tree.
    const deleteRecursive = (nodes: IResourceNode[]): IResourceNode[] => {
      return nodes.filter(node => node.id !== id).map(node => {
        if (node.children) return { ...node, children: deleteRecursive(node.children) };
        return node;
      });
    };
    // If we delete the selected node, unselect it
    if (state.selectedNodeId === id) {
      set({ selectedNodeId: null });
    }
    return { nodes: deleteRecursive(state.nodes) };
  }),
}));
