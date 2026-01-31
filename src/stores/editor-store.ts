import { create } from 'zustand';

interface EditorState {
  // Current document
  currentDocId: string | null;
  currentDocTitle: string;
  currentDocContent: string;
  
  // Document state
  isDirty: boolean;
  lastSaved: Date | null;
  
  // Actions
  setCurrentDoc: (id: string | null, title: string, content: string) => void;
  updateContent: (content: string) => void;
  markSaved: () => void;
  newDocument: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  currentDocId: null,
  currentDocTitle: 'Untitled',
  currentDocContent: '',
  isDirty: false,
  lastSaved: null,
  
  setCurrentDoc: (id, title, content) => set({
    currentDocId: id,
    currentDocTitle: title,
    currentDocContent: content,
    isDirty: false,
  }),
  
  updateContent: (content) => set({
    currentDocContent: content,
    isDirty: true,
  }),
  
  markSaved: () => set({
    isDirty: false,
    lastSaved: new Date(),
  }),
  
  newDocument: () => set({
    currentDocId: null,
    currentDocTitle: 'Untitled',
    currentDocContent: '',
    isDirty: false,
    lastSaved: null,
  }),
}));
