"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CollectedDocument, DocumentFolder, Tag } from "@/types/document";
import { indexDocument, removeFromIndex, initSearchEngine } from "@/lib/search-engine";

interface DocumentState {
  // 文档列表
  documents: CollectedDocument[];
  // 文件夹列表
  folders: DocumentFolder[];
  // 标签列表
  tags: Tag[];
  // 当前选中的文档
  selectedDocumentId: string | null;
  // 当前选中的文件夹
  selectedFolderId: string | null;
  // 是否已初始化搜索引擎
  searchEngineReady: boolean;
}

interface DocumentActions {
  // 文档操作
  addDocument: (doc: Omit<CollectedDocument, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  updateDocument: (id: string, updates: Partial<CollectedDocument>) => void;
  deleteDocument: (id: string) => Promise<void>;
  getDocument: (id: string) => CollectedDocument | undefined;
  
  // 文件夹操作
  addFolder: (name: string, parentId?: string) => string;
  updateFolder: (id: string, updates: Partial<DocumentFolder>) => void;
  deleteFolder: (id: string) => void;
  
  // 标签操作
  addTag: (name: string, color: string) => string;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  
  // 选择操作
  selectDocument: (id: string | null) => void;
  selectFolder: (id: string | null) => void;
  
  // 获取操作
  getDocumentsByFolder: (folderId: string | null) => CollectedDocument[];
  getDocumentsByTag: (tagId: string) => CollectedDocument[];
  getRecentDocuments: (limit?: number) => CollectedDocument[];
  
  // 初始化搜索引擎
  initializeSearch: () => Promise<void>;
}

type DocumentStore = DocumentState & DocumentActions;

// 生成唯一 ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      documents: [],
      folders: [],
      tags: [],
      selectedDocumentId: null,
      selectedFolderId: null,
      searchEngineReady: false,

      // 文档操作
      addDocument: async (docData) => {
        const id = generateId();
        const now = new Date().toISOString();
        
        const newDoc: CollectedDocument = {
          ...docData,
          id,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          documents: [newDoc, ...state.documents],
        }));

        // 索引到搜索引擎
        if (get().searchEngineReady) {
          await indexDocument({
            id: newDoc.id,
            title: newDoc.title,
            content: newDoc.content,
            tags: newDoc.tags,
          });
        }

        return id;
      },

      updateDocument: (id, updates) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id
              ? { ...doc, ...updates, updatedAt: new Date().toISOString() }
              : doc
          ),
        }));

        // 更新搜索索引
        const doc = get().documents.find((d) => d.id === id);
        if (doc && get().searchEngineReady) {
          indexDocument({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            tags: doc.tags,
          });
        }
      },

      deleteDocument: async (id) => {
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
          selectedDocumentId:
            state.selectedDocumentId === id ? null : state.selectedDocumentId,
        }));

        // 从搜索索引移除
        if (get().searchEngineReady) {
          await removeFromIndex(id);
        }
      },

      getDocument: (id) => {
        return get().documents.find((doc) => doc.id === id);
      },

      // 文件夹操作
      addFolder: (name, parentId) => {
        const id = generateId();
        const now = new Date().toISOString();

        const newFolder: DocumentFolder = {
          id,
          name,
          parentId: parentId || null,
          createdAt: now,
        };

        set((state) => ({
          folders: [...state.folders, newFolder],
        }));

        return id;
      },

      updateFolder: (id, updates) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id ? { ...folder, ...updates } : folder
          ),
        }));
      },

      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== id),
          // 将该文件夹下的文档移到根目录
          documents: state.documents.map((doc) =>
            doc.folderId === id ? { ...doc, folderId: undefined } : doc
          ),
          selectedFolderId:
            state.selectedFolderId === id ? null : state.selectedFolderId,
        }));
      },

      // 标签操作
      addTag: (name, color) => {
        const id = generateId();

        const newTag: Tag = {
          id,
          name,
          color,
        };

        set((state) => ({
          tags: [...state.tags, newTag],
        }));

        return id;
      },

      updateTag: (id, updates) => {
        set((state) => ({
          tags: state.tags.map((tag) =>
            tag.id === id ? { ...tag, ...updates } : tag
          ),
        }));
      },

      deleteTag: (id) => {
        set((state) => ({
          tags: state.tags.filter((tag) => tag.id !== id),
          // 从所有文档中移除该标签
          documents: state.documents.map((doc) => ({
            ...doc,
            tags: doc.tags.filter((tagId) => tagId !== id),
          })),
        }));
      },

      // 选择操作
      selectDocument: (id) => {
        set({ selectedDocumentId: id });
      },

      selectFolder: (id) => {
        set({ selectedFolderId: id });
      },

      // 获取操作
      getDocumentsByFolder: (folderId) => {
        return get().documents.filter((doc) =>
          folderId === null ? !doc.folderId : doc.folderId === folderId
        );
      },

      getDocumentsByTag: (tagId) => {
        return get().documents.filter((doc) => doc.tags.includes(tagId));
      },

      getRecentDocuments: (limit = 10) => {
        return get()
          .documents.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          .slice(0, limit);
      },

      // 初始化搜索引擎
      initializeSearch: async () => {
        await initSearchEngine();
        
        // 重新索引所有文档
        const docs = get().documents;
        for (const doc of docs) {
          await indexDocument({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            tags: doc.tags,
          });
        }
        
        set({ searchEngineReady: true });
      },
    }),
    {
      name: "document-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        documents: state.documents,
        folders: state.folders,
        tags: state.tags,
      }),
    }
  )
);
