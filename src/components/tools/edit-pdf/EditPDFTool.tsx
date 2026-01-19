'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { saveFileToOPFS, loadFileFromOPFS, deleteFileFromOPFS } from '@/lib/storage/file-system';
import { usePendingFile } from '@/lib/contexts/PendingFileContext';
import { useTranslations } from 'next-intl';
import { FileUploader } from '../FileUploader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Maximize2, Minimize2 } from 'lucide-react'; // Added icons

const SESSION_FILE_NAME = 'current_edit_session.pdf';

export interface EditPDFToolProps {
  className?: string;
}

/**
 * EditPDFTool Component
 * 
 * Provides PDF editing capabilities using PDF.js viewer with annotation support.
 * Users can add text, draw, highlight, and add images to PDFs.
 * The PDF.js viewer has built-in save functionality (export button in toolbar).
 */
export function EditPDFTool({ className = '' }: EditPDFToolProps) {
  const t = useTranslations('common');
  const tTools = useTranslations('tools.editPdf');
  const { consumePendingFile } = usePendingFile();

  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for messages from the viewer (Save actions)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Handle Auto-save for persistence
      if (event.data?.type === 'PDF_SESSION_BACKUP') {
        const { blob } = event.data;
        if (blob) {
          saveFileToOPFS(SESSION_FILE_NAME, blob).catch(console.warn);
        }
        return;
      }

      if (event.data?.type === 'PDF_SAVE_DATA') {
        const { blob, filename } = event.data;
        if (blob) {
          try {
            const savedName = filename || `edited_${Date.now()}.pdf`;

            // 1. Save to OPFS for persistence
            await saveFileToOPFS(savedName, blob);
            // Update session file
            await saveFileToOPFS(SESSION_FILE_NAME, blob);

            // 2. Trigger download for user convenience
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = savedName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch (e) {
            console.error('Error handling save message:', e);
            setError('Failed to save file: ' + (e as Error).message);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle Full Screen state changes (body scroll lock only)
  const savedScrollPositionRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isFullScreen) {
      // Save current scroll position before locking (for restoration later)
      savedScrollPositionRef.current = { x: window.scrollX, y: window.scrollY };
      // Lock body scroll - the fixed positioning covers full viewport
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      // Restore scroll position when exiting full-screen
      if (savedScrollPositionRef.current) {
        window.scrollTo(savedScrollPositionRef.current.x, savedScrollPositionRef.current.y);
        savedScrollPositionRef.current = null;
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullScreen]);

  // Expose a global toggle function that the injected button can call
  useEffect(() => {
    // Expose toggle function globally for the iframe to call
    (window as unknown as { __pdfEditorToggleFullScreen?: () => void }).__pdfEditorToggleFullScreen = () => {
      console.log('Global toggle function called');
      setIsFullScreen(prev => !prev);
    };
    return () => {
      delete (window as unknown as { __pdfEditorToggleFullScreen?: () => void }).__pdfEditorToggleFullScreen;
    };
  }, []);

  // Restore session or load pending file
  useEffect(() => {
    const initializeFile = async () => {
      // Only initialize if we don't have a file yet
      if (file) return;

      // First, check if there's a pending file from recent files dropdown
      const pendingFile = consumePendingFile('edit-pdf');
      if (pendingFile) {
        console.log('Loading pending file from recent files:', pendingFile.name);
        setFile(pendingFile);
        setPdfUrl(URL.createObjectURL(pendingFile));
        // Save to session for persistence
        saveFileToOPFS(SESSION_FILE_NAME, pendingFile).catch(console.error);
        return;
      }

      // Otherwise, try to restore from OPFS session
      try {
        const blob = await loadFileFromOPFS(SESSION_FILE_NAME);
        if (blob) {
          const restoredFile = new File([blob], 'restored_document.pdf', { type: blob.type || 'application/pdf' });

          // Configure PDF.js preferences for annotation editor
          try {
            const existingPrefsRaw = localStorage.getItem('pdfjs.preferences');
            const existingPrefs = existingPrefsRaw ? JSON.parse(existingPrefsRaw) : {};
            // Reset editor mode to auto or highlight if desired
            const newPrefs = {
              ...existingPrefs,
              enablePermissions: false,
            };
            localStorage.setItem('pdfjs.preferences', JSON.stringify(newPrefs));
          } catch (e) {
            console.warn('Could not set PDF.js preferences:', e);
          }

          setFile(restoredFile);
          setPdfUrl(URL.createObjectURL(restoredFile));
          console.log('Edit session restored from OPFS');
        }
      } catch (e) {
        // No session to restore, that's fine
        console.log('No existing edit session to restore');
      }
    };
    initializeFile();
  }, [consumePendingFile]);

  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setError(null);
      setPdfUrl(URL.createObjectURL(selectedFile));
      // Initial save for session persistence
      saveFileToOPFS(SESSION_FILE_NAME, selectedFile).catch(console.error);
    }
  }, []);

  const handleUploadError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // Injection logic with retries
  const injectLink = useCallback((attempts = 0) => {
    if (attempts > 10) return; // Max retries

    try {
      const iframe = iframeRef.current;
      if (iframe?.contentDocument) {
        const doc = iframe.contentDocument;

        // 1. Ensure Native PDF.js buttons are visible
        const downloadBtn = doc.getElementById('download');
        const secondaryDownloadBtn = doc.getElementById('secondaryDownload');
        if (downloadBtn) downloadBtn.style.display = 'block';
        if (secondaryDownloadBtn) secondaryDownloadBtn.style.display = 'block';

        // 2. Hide "CustomToolbar" Save button (duplicate)
        const customToolbar = doc.querySelector('.CustomToolbar');
        if (customToolbar) {
          const buttons = customToolbar.querySelectorAll('li, button');
          buttons.forEach((btn: Element) => {
            const text = btn.textContent?.trim();
            if (text === '保存' || text === 'Save' || text === 'Speichern') {
              (btn as HTMLElement).style.display = 'none';
            }
          });
        }

        // 3. Inject "Full Screen" Toggle Button
        const toolbarRight = doc.getElementById('toolbarViewerRight');
        if (toolbarRight && !doc.getElementById('injected-fullscreen-toggle')) {
          const separator = document.createElement('div');
          separator.className = 'verticalToolbarSeparator';

          const toggleBtn = document.createElement('button');
          toggleBtn.id = 'injected-fullscreen-toggle';
          toggleBtn.className = 'toolbarButton';
          toggleBtn.title = 'Toggle Full Screen';
          toggleBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
          `;

          toggleBtn.style.display = 'flex';
          toggleBtn.style.alignItems = 'center';
          toggleBtn.style.width = 'auto';
          toggleBtn.style.padding = '0 8px';

          toggleBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Injected toggle clicked');
            // Call the global toggle function directly on parent window
            const parentWindow = window.parent as unknown as { __pdfEditorToggleFullScreen?: () => void };
            if (parentWindow.__pdfEditorToggleFullScreen) {
              parentWindow.__pdfEditorToggleFullScreen();
            } else {
              console.warn('Global toggle function not found');
            }
          };

          toolbarRight.insertBefore(separator, toolbarRight.firstChild);
          toolbarRight.insertBefore(toggleBtn, toolbarRight.firstChild);
          console.log('Fullscreen toggle injected successfully');
          return; // Success
        } else if (doc.getElementById('injected-fullscreen-toggle')) {
          return; // Already injected
        }
      }
    } catch (e) {
      console.warn('Injection attempt failed:', e);
    }

    // Retry if failed (toolbar might not be ready)
    setTimeout(() => injectLink(attempts + 1), 1000);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setTimeout(() => {
      setIsEditorReady(true);
      injectLink();
    }, 1000);
  }, [injectLink]);

  const handleClear = useCallback(async () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    // Clear session from OPFS
    try {
      await deleteFileFromOPFS(SESSION_FILE_NAME);
    } catch (e) {
      // Ignore - file might not exist
    }
    setFile(null);
    setPdfUrl(null);
    setError(null);
    setIsEditorReady(false);
  }, [pdfUrl]);

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {!file && (
        <FileUploader
          accept={['application/pdf', '.pdf']}
          multiple={false}
          maxFiles={1}
          onFilesSelected={handleFilesSelected}
          onError={handleUploadError}
          label={tTools('uploadLabel')}
          description={tTools('uploadDescription')}
        />
      )}

      {error && (
        <div className="p-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700" role="alert">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {file && pdfUrl && (
        <div className="space-y-4">
          <Card variant="outlined" size="sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                  <path d="M14 2v6h6" fill="white" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--color-foreground))]">{file.name}</p>
                  <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullScreen(true)}
                  title={t('buttons.fullscreen') || 'Full Screen'}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  {t('buttons.clear') || 'Clear'}
                </Button>
              </div>
            </div>
          </Card>

          {/* PDF Viewer iframe */}
          <div className={
            isFullScreen
              ? 'fixed inset-0 z-[9999] w-screen h-screen m-0 border-0 rounded-none flex flex-col bg-white overflow-hidden'
              : 'relative border border-[hsl(var(--color-border))] rounded-[var(--radius-md)] overflow-hidden bg-gray-100'
          }>

            {/* Fallback Exit Button (Safety Net) */}
            {isFullScreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullScreen(false)}
                className="fixed top-2 right-2 z-[10000] bg-white/90 shadow-md backdrop-blur hover:bg-white"
                title={t('buttons.exitFullscreen') || 'Exit Full Screen'}
              >
                <Minimize2 className="w-5 h-5 text-gray-700" />
              </Button>
            )}

            <iframe
              ref={iframeRef}
              src={`/pdfjs-annotation-viewer/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`}
              className={isFullScreen ? 'flex-1 w-full border-0' : 'w-full h-[700px] border-0'}
              title="PDF Editor"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
              onLoad={handleIframeLoad}
            />
            {!isEditorReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--color-primary))] mx-auto mb-2"></div>
                  <p className="text-sm text-[hsl(var(--color-muted-foreground))]">{t('status.loading') || 'Loading...'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                // Trigger save via message
                iframeRef.current?.contentWindow?.postMessage({ type: 'TRIGGER_SAVE' }, '*');
              }}
              disabled={!isEditorReady}
            >
              {t('buttons.save') || 'Save PDF'}
            </Button>
          </div>
        </div >
      )
      }
    </div >
  );
}

export default EditPDFTool;
