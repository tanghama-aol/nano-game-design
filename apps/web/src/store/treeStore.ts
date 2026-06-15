import { create } from 'zustand';
import type { IResourceNode } from '@nano-game/types';
import { v4 as uuidv4 } from 'uuid';

interface TreeState {
  nodes: IResourceNode[];
  globalStyle: string;
  selectedNodeId: string | null;
  setGlobalStyle: (style: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setNodes: (nodes: IResourceNode[]) => void;
  updateNode: (id: string, data: Partial<IResourceNode>) => void;
  batchUpdateNodes: (updates: Record<string, Partial<IResourceNode>>) => void;
  addNode: (parentId: string | null, node: Omit<IResourceNode, 'id' | 'status'>) => void;
  deleteNode: (id: string) => void;
}

export const useTreeStore = create<TreeState>((set) => ({
  nodes: [],
  globalStyle: 'Pixel Art (16-bit)',
  selectedNodeId: null,
  setGlobalStyle: (style) => set({ globalStyle: style }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setNodes: (nodes) => set({ nodes }),
  
  updateNode: (id, data) => set((state) => {
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
