/**
 * OPFS (Origin Private File System) Wrapper
 * 
 * Provides an interface to save and load large binary files (PDFs)
 * directly to the browser's private file system, bypassing memory limits of localStorage/IndexedDB.
 */

export interface FileEntry {
    name: string;
    size: number;
    lastModified: number;
    type: string;
}

/**
 * Check if OPFS is supported
 */
export async function isOPFSSupported(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage) return false;
    try {
        await navigator.storage.getDirectory();
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Get the root directory handle
 */
async function getRoot(): Promise<FileSystemDirectoryHandle> {
    return await navigator.storage.getDirectory();
}

/**
 * Save a file to OPFS
 */
export async function saveFileToOPFS(name: string, blob: Blob): Promise<void> {
    const root = await getRoot();
    // Get file handle, creating if not exists
    const fileHandle = await root.getFileHandle(name, { create: true });
    // Create a writable stream
    // @ts-ignore - TS types for FileSystemWritableFileStream might be missing in some setups
    const writable = await fileHandle.createWritable();
    // Write the blob
    await writable.write(blob);
    // Close the file
    await writable.close();
}

/**
 * Load a file from OPFS
 */
export async function loadFileFromOPFS(name: string): Promise<Blob> {
    const root = await getRoot();
    const fileHandle = await root.getFileHandle(name);
    const file = await fileHandle.getFile();
    return file;
}

/**
 * Delete a file from OPFS
 */
export async function deleteFileFromOPFS(name: string): Promise<void> {
    const root = await getRoot();
    await root.removeEntry(name);
}

/**
 * List all files in OPFS
 */
export async function listFilesInOPFS(): Promise<FileEntry[]> {
    const root = await getRoot();
    const files: FileEntry[] = [];

    // @ts-ignore - Async iterator for values()
    for await (const handle of root.values()) {
        if (handle.kind === 'file') {
            const fileHandle = handle as FileSystemFileHandle;
            const file = await fileHandle.getFile();
            files.push({
                name: file.name,
                size: file.size,
                lastModified: file.lastModified,
                type: file.type
            });
        }
    }

    return files;
}

/**
 * Store a PDF file specifically for the signature/edit tools
 * Uses a consistent naming convention
 */
export async function storeTempPDF(file: File | Blob): Promise<string> {
    const fileName = `temp_edit_${Date.now()}.pdf`;
    await saveFileToOPFS(fileName, file);
    return fileName;
}
