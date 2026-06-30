import { create } from 'zustand';
import { WhiteboardElement } from '../types';

interface WhiteboardState {
  elements: WhiteboardElement[];
  undoStack: WhiteboardElement[][];
  redoStack: WhiteboardElement[][];
  tool: 'pen' | 'highlighter' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'sticky';
  color: string;
  size: number;
  setTool: (
    tool: 'pen' | 'highlighter' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'sticky'
  ) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setElements: (elements: WhiteboardElement[]) => void;
  addElement: (element: WhiteboardElement) => void;
  clearCanvas: () => void;
  undo: () => WhiteboardElement[] | null;
  redo: () => WhiteboardElement[] | null;
  saveHistory: () => void;
}

export const useWhiteboardStore = create<WhiteboardState>((set, get) => ({
  elements: [],
  undoStack: [],
  redoStack: [],
  tool: 'pen',
  color: '#e11d48',
  size: 3,

  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setSize: (size) => set({ size }),
  setElements: (elements) => set({ elements }),

  addElement: (element) => {
    set((state) => {
      const newElements = [...state.elements, element];
      return { elements: newElements };
    });
  },

  clearCanvas: () => {
    set((state) => {
      const current = state.elements;
      if (current.length === 0) return {};
      return {
        undoStack: [...state.undoStack, current],
        elements: [],
        redoStack: []
      };
    });
  },

  saveHistory: () => {
    set((state) => ({
      undoStack: [...state.undoStack, state.elements],
      redoStack: []
    }));
  },

  undo: () => {
    const { undoStack, elements, redoStack } = get();
    if (undoStack.length === 0) return null;

    const previous = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    set({
      undoStack: newUndoStack,
      redoStack: [...redoStack, elements],
      elements: previous
    });

    return previous;
  },

  redo: () => {
    const { undoStack, elements, redoStack } = get();
    if (redoStack.length === 0) return null;

    const next = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    set({
      redoStack: newRedoStack,
      undoStack: [...undoStack, elements],
      elements: next
    });

    return next;
  }
}));
