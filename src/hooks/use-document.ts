"use client";

import { useCallback } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { useFileSystem } from "./use-file-system";

export function useDocument() {
  const {
    currentDocId,
    currentDocTitle,
    currentDocContent,
    isDirty,
    setCurrentDoc,
    updateTitle,
    markSaved,
    newDocument,
  } = useEditorStore();
  
  const { readFile, writeFile, listDir, isConnected } = useFileSystem();

  const saveDocument = useCallback(async () => {
    if (!isConnected || !currentDocId) return false;

    const filename = `drafts/${currentDocId}.md`;
    const frontmatter = `---
title: ${currentDocTitle}
updatedAt: ${new Date().toISOString()}
---

`;
    const success = await writeFile(filename, frontmatter + currentDocContent);
    
    if (success) {
      markSaved();
    }
    
    return success;
  }, [isConnected, currentDocId, currentDocTitle, currentDocContent, writeFile, markSaved]);

  const loadDocument = useCallback(async (docId: string) => {
    if (!isConnected) return false;

    const filename = `drafts/${docId}.md`;
    const content = await readFile(filename);
    
    if (content) {
      // Parse frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const bodyContent = frontmatterMatch[2];
        const titleMatch = frontmatter.match(/title:\s*(.+)/);
        const title = titleMatch ? titleMatch[1].trim() : "Untitled";
        
        setCurrentDoc(docId, title, bodyContent);
      } else {
        setCurrentDoc(docId, "Untitled", content);
      }
      
      return true;
    }
    
    return false;
  }, [isConnected, readFile, setCurrentDoc]);

  const listDocuments = useCallback(async () => {
    if (!isConnected) return [];

    const files = await listDir("drafts");
    return files
      .filter((f) => f.kind === "file" && f.name.endsWith(".md"))
      .map((f) => ({
        id: f.name.replace(".md", ""),
        name: f.name,
      }));
  }, [isConnected, listDir]);

  const createNewDocument = useCallback(() => {
    newDocument();
  }, [newDocument]);

  return {
    currentDocId,
    currentDocTitle,
    isDirty,
    saveDocument,
    loadDocument,
    listDocuments,
    createNewDocument,
    updateTitle,
  };
}
