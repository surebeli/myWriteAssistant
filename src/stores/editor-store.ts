import { create } from 'zustand';

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EditorState {
  // Current document
  currentDocId: string | null;
  currentDocTitle: string;
  currentDocContent: string;
  
  // Document state
  isDirty: boolean;
  lastSaved: Date | null;
  
  // Recent documents
  recentDocs: Array<{ id: string; title: string; updatedAt: Date }>;
  
  // Actions
  setCurrentDoc: (id: string | null, title: string, content: string) => void;
  updateContent: (content: string) => void;
  updateTitle: (title: string) => void;
  markSaved: () => void;
  newDocument: () => void;
  addRecentDoc: (doc: { id: string; title: string; updatedAt: Date }) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  currentDocId: null,
  currentDocTitle: 'Untitled',
  currentDocContent: '',
  isDirty: false,
  lastSaved: null,
  recentDocs: [],
  
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
  
  updateTitle: (title) => set({
    currentDocTitle: title,
    isDirty: true,
  }),
  
  markSaved: () => {
    const { currentDocId, currentDocTitle, addRecentDoc } = get();
    const now = new Date();
    
    set({
      isDirty: false,
      lastSaved: now,
    });
    
    if (currentDocId) {
      addRecentDoc({ id: currentDocId, title: currentDocTitle, updatedAt: now });
    }
  },
  
  newDocument: () => {
    const id = `doc-${Date.now()}`;
    set({
      currentDocId: id,
      currentDocTitle: 'Untitled',
      currentDocContent: '',
      isDirty: false,
      lastSaved: null,
    });
  },
  
  addRecentDoc: (doc) => set((state) => {
    const filtered = state.recentDocs.filter((d) => d.id !== doc.id);
    return {
      recentDocs: [doc, ...filtered].slice(0, 10), // Keep only 10 recent docs
    };
  }),
}));
