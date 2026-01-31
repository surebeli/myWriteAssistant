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
  wordCount: number;
  
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

// Helper to count words in text
function countWords(text: string): number {
  const cleaned = text.replace(/<[^>]*>/g, '').trim();
  if (!cleaned) return 0;
  // Count Chinese characters and English words
  const chineseChars = (cleaned.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = cleaned.replace(/[\u4e00-\u9fa5]/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length;
  return chineseChars + englishWords;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  currentDocId: null,
  currentDocTitle: 'Untitled',
  currentDocContent: '',
  isDirty: false,
  lastSaved: null,
  wordCount: 0,
  recentDocs: [],
  
  setCurrentDoc: (id, title, content) => set({
    currentDocId: id,
    currentDocTitle: title,
    currentDocContent: content,
    wordCount: countWords(content),
    isDirty: false,
  }),
  
  updateContent: (content) => set({
    currentDocContent: content,
    wordCount: countWords(content),
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
      wordCount: 0,
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
