"use client";

import { useCallback, useState } from "react";

// 检测是否在 Tauri 环境中
export function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  return "__TAURI__" in window || "__TAURI_INTERNALS__" in window;
}

interface UseWorkspaceReturn {
  selectWorkspace: () => Promise<string | null>;
  isSelecting: boolean;
  error: string | null;
}

export function useWorkspace(): UseWorkspaceReturn {
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectWorkspace = useCallback(async (): Promise<string | null> => {
    console.log("[useWorkspace] selectWorkspace called");
    console.log("[useWorkspace] isTauri:", isTauri());
    console.log("[useWorkspace] window.__TAURI__:", typeof window !== "undefined" && "__TAURI__" in window);
    
    setIsSelecting(true);
    setError(null);

    try {
      if (isTauri()) {
        console.log("[useWorkspace] Using Tauri API");
        // 使用 Tauri Dialog API
        const dialogModule = await import("@tauri-apps/plugin-dialog");
        console.log("[useWorkspace] dialog module loaded:", dialogModule);
        
        const selected = await dialogModule.open({
          directory: true,
          multiple: false,
          title: "选择工作目录",
        });
        
        console.log("[useWorkspace] selected:", selected);

        if (selected && typeof selected === "string") {
          // 创建默认目录结构
          const fsModule = await import("@tauri-apps/plugin-fs");
          const dirs = ["documents", "drafts", "summaries", "published"];
          
          for (const dir of dirs) {
            const dirPath = `${selected}/${dir}`;
            try {
              const dirExists = await fsModule.exists(dirPath);
              if (!dirExists) {
                await fsModule.mkdir(dirPath, { recursive: true });
              }
            } catch (e) {
              console.log("[useWorkspace] Error creating dir:", dir, e);
            }
          }
          
          setIsSelecting(false);
          return selected;
        }
        
        setIsSelecting(false);
        return null;
      } else if (typeof window !== "undefined" && "showDirectoryPicker" in window) {
        console.log("[useWorkspace] Using Browser File System API");
        // 使用浏览器 File System Access API
        const showDirectoryPicker = (window as Window & { showDirectoryPicker?: (options?: { mode?: string }) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
        if (!showDirectoryPicker) {
          throw new Error("showDirectoryPicker not available");
        }
        const handle = await showDirectoryPicker({
          mode: "readwrite",
        });

        // 创建默认目录结构
        const dirs = ["documents", "drafts", "summaries", "published"];
        for (const dir of dirs) {
          try {
            await handle.getDirectoryHandle(dir, { create: true });
          } catch {
            // 目录可能已存在
          }
        }

        setIsSelecting(false);
        return handle.name;
      } else {
        console.log("[useWorkspace] No supported API found");
        setError("您的环境不支持选择文件夹");
        setIsSelecting(false);
        alert("您的环境不支持选择文件夹功能");
        return null;
      }
    } catch (err) {
      // 用户取消选择或其他错误
      console.error("[useWorkspace] Error:", err);
      setIsSelecting(false);
      return null;
    }
  }, []);

  return {
    selectWorkspace,
    isSelecting,
    error,
  };
}
