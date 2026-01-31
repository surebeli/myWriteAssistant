/**
 * File System Access API utilities
 * 用于本地文件存储的工具函数
 */

export interface FileSystemState {
  isSupported: boolean;
  hasPermission: boolean;
  directoryHandle: FileSystemDirectoryHandle | null;
}

/**
 * 检查浏览器是否支持 File System Access API
 */
export function isFileSystemSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "showDirectoryPicker" in window &&
    "FileSystemDirectoryHandle" in window
  );
}

/**
 * 请求目录访问权限
 */
export async function requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemSupported()) {
    console.warn("File System Access API is not supported");
    return null;
  }

  try {
    const handle = await window.showDirectoryPicker({
      id: "myWriteAssistant",
      mode: "readwrite",
      startIn: "documents",
    });
    return handle;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // User cancelled the picker
      return null;
    }
    throw error;
  }
}

/**
 * 验证目录权限
 */
export async function verifyPermission(
  handle: FileSystemDirectoryHandle,
  mode: "read" | "readwrite" = "readwrite"
): Promise<boolean> {
  const options: FileSystemHandlePermissionDescriptor = { mode };
  
  // 检查现有权限
  if ((await handle.queryPermission(options)) === "granted") {
    return true;
  }
  
  // 请求权限
  if ((await handle.requestPermission(options)) === "granted") {
    return true;
  }
  
  return false;
}

/**
 * 在目录中创建或获取子目录
 */
export async function getOrCreateDirectory(
  parentHandle: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemDirectoryHandle> {
  return await parentHandle.getDirectoryHandle(name, { create: true });
}

/**
 * 读取文本文件
 */
export async function readTextFile(
  directoryHandle: FileSystemDirectoryHandle,
  path: string
): Promise<string | null> {
  try {
    const parts = path.split("/");
    let currentHandle: FileSystemDirectoryHandle = directoryHandle;
    
    // Navigate to parent directory
    for (let i = 0; i < parts.length - 1; i++) {
      currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
    }
    
    // Get file
    const fileName = parts[parts.length - 1];
    const fileHandle = await currentHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

/**
 * 写入文本文件
 */
export async function writeTextFile(
  directoryHandle: FileSystemDirectoryHandle,
  path: string,
  content: string
): Promise<boolean> {
  try {
    const parts = path.split("/");
    let currentHandle: FileSystemDirectoryHandle = directoryHandle;
    
    // Create parent directories if needed
    for (let i = 0; i < parts.length - 1; i++) {
      currentHandle = await getOrCreateDirectory(currentHandle, parts[i]);
    }
    
    // Create/overwrite file
    const fileName = parts[parts.length - 1];
    const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    
    return true;
  } catch (error) {
    console.error("Failed to write file:", error);
    return false;
  }
}

/**
 * 列出目录内容
 */
export async function listDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  path?: string
): Promise<Array<{ name: string; kind: "file" | "directory" }>> {
  try {
    let targetHandle = directoryHandle;
    
    if (path) {
      const parts = path.split("/");
      for (const part of parts) {
        targetHandle = await targetHandle.getDirectoryHandle(part);
      }
    }
    
    const entries: Array<{ name: string; kind: "file" | "directory" }> = [];
    for await (const [name, handle] of targetHandle.entries()) {
      entries.push({ name, kind: handle.kind });
    }
    
    return entries.sort((a, b) => {
      // Directories first, then alphabetically
      if (a.kind !== b.kind) {
        return a.kind === "directory" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch {
    return [];
  }
}
