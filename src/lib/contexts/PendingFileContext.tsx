/**
 * Pending File Context
 * 
 * Provides a way to pass a file to a tool when navigating from recent files.
 * The file is stored temporarily and consumed when the tool mounts.
 */

'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface PendingFile {
    file: File;
    toolSlug: string;
    fileName: string;
}

interface PendingFileContextValue {
    pendingFile: PendingFile | null;
    setPendingFile: (file: File, toolSlug: string, fileName: string) => void;
    consumePendingFile: (toolSlug: string) => File | null;
    clearPendingFile: () => void;
}

const PendingFileContext = createContext<PendingFileContextValue | null>(null);

export interface PendingFileProviderProps {
    children: ReactNode;
}

export function PendingFileProvider({ children }: PendingFileProviderProps) {
    const [pendingFile, setPendingFileState] = useState<PendingFile | null>(null);

    const setPendingFile = useCallback((file: File, toolSlug: string, fileName: string) => {
        setPendingFileState({ file, toolSlug, fileName });
    }, []);

    const consumePendingFile = useCallback((toolSlug: string): File | null => {
        if (pendingFile && pendingFile.toolSlug === toolSlug) {
            const file = pendingFile.file;
            setPendingFileState(null);
            return file;
        }
        return null;
    }, [pendingFile]);

    const clearPendingFile = useCallback(() => {
        setPendingFileState(null);
    }, []);

    return (
        <PendingFileContext.Provider value={{ pendingFile, setPendingFile, consumePendingFile, clearPendingFile }}>
            {children}
        </PendingFileContext.Provider>
    );
}

export function usePendingFile(): PendingFileContextValue {
    const context = useContext(PendingFileContext);
    if (!context) {
        throw new Error('usePendingFile must be used within a PendingFileProvider');
    }
    return context;
}

/**
 * Hook to check and consume pending file on tool mount
 */
export function useConsumePendingFile(toolSlug: string): File | null {
    const { consumePendingFile } = usePendingFile();
    const [file, setFile] = useState<File | null>(null);

    React.useEffect(() => {
        const pendingFile = consumePendingFile(toolSlug);
        if (pendingFile) {
            setFile(pendingFile);
        }
    }, [toolSlug, consumePendingFile]);

    return file;
}
