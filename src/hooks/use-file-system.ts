"use client";

import { useState, useCallback } from "react";
import {
  isFileSystemSupported,
  requestDirectoryAccess,
  verifyPermission,
  readTextFile,
  writeTextFile,
  listDirectory,
  getOrCreateDirectory,
} from "@/lib/file-system";

interface UseFileSystemReturn {
  isSupported: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  directoryName: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  readFile: (path: string) => Promise<string | null>;
  writeFile: (path: string, content: string) => Promise<boolean>;
  listDir: (path?: string) => Promise<Array<{ name: string; kind: "file" | "directory" }>>;
  ensureDirectory: (name: string) => Promise<boolean>;
}

export function useFileSystem(): UseFileSystemReturn {
  const [isSupported] = useState(() => isFileSystemSupported());
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [directoryName, setDirectoryName] = useState<string | null>(null);

  const connect = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("您的浏览器不支持 File System Access API");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const handle = await requestDirectoryAccess();
      
      if (!handle) {
        setIsLoading(false);
        return false; // User cancelled
      }

      const hasPermission = await verifyPermission(handle);
      
      if (!hasPermission) {
        setError("未获得文件夹访问权限");
        setIsLoading(false);
        return false;
      }

      // Create default directory structure
      await getOrCreateDirectory(handle, "documents");
      await getOrCreateDirectory(handle, "summaries");
      await getOrCreateDirectory(handle, "drafts");
      await getOrCreateDirectory(handle, "published");

      setDirectoryHandle(handle);
      setDirectoryName(handle.name);
      setIsConnected(true);
      setIsLoading(false);
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "连接失败";
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  const disconnect = useCallback(() => {
    setDirectoryHandle(null);
    setDirectoryName(null);
    setIsConnected(false);
    setError(null);
  }, []);

  const readFile = useCallback(async (path: string): Promise<string | null> => {
    if (!directoryHandle) {
      setError("未连接到存储文件夹");
      return null;
    }
    return readTextFile(directoryHandle, path);
  }, [directoryHandle]);

  const writeFile = useCallback(async (path: string, content: string): Promise<boolean> => {
    if (!directoryHandle) {
      setError("未连接到存储文件夹");
      return false;
    }
    return writeTextFile(directoryHandle, path, content);
  }, [directoryHandle]);

  const listDir = useCallback(async (path?: string) => {
    if (!directoryHandle) {
      return [];
    }
    return listDirectory(directoryHandle, path);
  }, [directoryHandle]);

  const ensureDirectory = useCallback(async (name: string): Promise<boolean> => {
    if (!directoryHandle) {
      return false;
    }
    try {
      await getOrCreateDirectory(directoryHandle, name);
      return true;
    } catch {
      return false;
    }
  }, [directoryHandle]);

  return {
    isSupported,
    isConnected,
    isLoading,
    error,
    directoryName,
    connect,
    disconnect,
    readFile,
    writeFile,
    listDir,
    ensureDirectory,
  };
}
