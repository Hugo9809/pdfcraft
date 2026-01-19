/**
 * RecentFilesDropdown Component
 * Requirements: 10.4
 * 
 * Displays recent files history in a dropdown menu
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, X, Trash2, FileText, ChevronDown } from 'lucide-react';
import { useRecentFiles } from '@/lib/hooks/useRecentFiles';
import { formatFileSize, formatDate, type RecentFile } from '@/lib/storage/recent-files';
import { loadFileFromOPFS } from '@/lib/storage/file-system';
import { usePendingFile } from '@/lib/contexts/PendingFileContext';
import { Button } from '@/components/ui/Button';
import { type Locale } from '@/lib/i18n/config';

export interface RecentFilesDropdownProps {
  locale: Locale;
  translations: {
    title: string;
    empty: string;
    clearAll: string;
    processedWith: string;
  };
}

export const RecentFilesDropdown: React.FC<RecentFilesDropdownProps> = ({
  locale,
  translations,
}) => {
  const router = useRouter();
  const { recentFiles, removeFile, clearAll, isLoading } = useRecentFiles();
  const { setPendingFile } = usePendingFile();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Focus item when focusedIndex changes
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  const handleButtonKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      }
      if (recentFiles.length > 0) {
        setFocusedIndex(0);
      }
    }
  }, [isOpen, recentFiles.length]);

  const handleItemKeyDown = useCallback((event: React.KeyboardEvent, _index: number) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => (prev < recentFiles.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : recentFiles.length - 1));
        break;
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setFocusedIndex(recentFiles.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  }, [recentFiles.length]);

  /**
   * Handle clicking on a recent file
   * Loads the file from OPFS if available and navigates to the tool
   */
  const handleFileClick = useCallback(async (file: RecentFile) => {
    console.log('handleFileClick called with file:', file);
    setLoadingFileId(file.id);

    try {
      if (file.storagePath) {
        console.log('Loading file from OPFS:', file.storagePath);
        // Load file from OPFS
        const blob = await loadFileFromOPFS(file.storagePath);
        console.log('File loaded from OPFS, size:', blob.size);
        // Convert Blob to File with proper name
        const loadedFile = new File([blob], file.name, { type: blob.type || 'application/pdf' });
        // Set as pending file for the tool to consume
        // Open in the original tool that was used with this file
        const targetTool = file.toolUsed;
        setPendingFile(loadedFile, targetTool, file.name);

        setIsOpen(false);
        setFocusedIndex(-1);
        setLoadingFileId(null);

        // Navigate to the appropriate tool
        console.log('Navigating to tool:', targetTool);
        router.push(`/${locale}/tools/${targetTool}`);
      } else {
        console.log('No storagePath for file, just navigating to tool');
        setIsOpen(false);
        setFocusedIndex(-1);
        setLoadingFileId(null);
        router.push(`/${locale}/tools/${file.toolUsed}`);
      }
    } catch (error) {
      console.error('Failed to load file from OPFS:', error);
      setIsOpen(false);
      setFocusedIndex(-1);
      setLoadingFileId(null);
      // Navigate to tool anyway
      router.push(`/${locale}/tools/${file.toolUsed}`);
    }
  }, [locale, router, setPendingFile]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && recentFiles.length > 0) {
            setFocusedIndex(0);
          } else {
            setFocusedIndex(-1);
          }
        }}
        onKeyDown={handleButtonKeyDown}
        aria-label={translations.title}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-1"
      >
        <Clock className="h-4 w-4" aria-hidden="true" />
        {recentFiles.length > 0 && (
          <span className="text-xs bg-[hsl(var(--color-primary))] text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {recentFiles.length}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </Button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-auto rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] shadow-lg z-50"
          role="menu"
          aria-label={translations.title}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--color-border))]">
            <h3 className="font-medium text-sm text-[hsl(var(--color-foreground))]">
              {translations.title}
            </h3>
            {recentFiles.length > 0 && (
              <button
                onClick={() => {
                  clearAll();
                  setIsOpen(false);
                }}
                className="text-xs text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-destructive))] transition-colors flex items-center gap-1"
                aria-label={translations.clearAll}
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                {translations.clearAll}
              </button>
            )}
          </div>

          {/* Content */}
          {recentFiles.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[hsl(var(--color-muted-foreground))]">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
              {translations.empty}
            </div>
          ) : (
            <ul className="py-2" role="list">
              {recentFiles.map((file, index) => (
                <li
                  key={file.id}
                  className="group px-4 py-2 hover:bg-[hsl(var(--color-muted))] transition-colors"
                  role="menuitem"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      ref={(el) => { itemRefs.current[index] = el; }}
                      onClick={() => handleFileClick(file)}
                      className="flex-1 min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-ring))] rounded-sm"
                      tabIndex={focusedIndex === index ? 0 : -1}
                      onKeyDown={(e) => handleItemKeyDown(e, index)}
                      disabled={loadingFileId === file.id}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[hsl(var(--color-primary))] flex-shrink-0" aria-hidden="true" />
                        <span className="text-sm font-medium text-[hsl(var(--color-foreground))] truncate">
                          {file.name}
                        </span>
                        {loadingFileId === file.id && (
                          <span className="text-xs text-[hsl(var(--color-muted-foreground))]">Loading...</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[hsl(var(--color-muted-foreground))]">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.processedAt)}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-[hsl(var(--color-muted-foreground))]">
                        {translations.processedWith} {file.toolName || file.toolUsed}
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-destructive))] focus:text-[hsl(var(--color-destructive))] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-ring))] rounded-sm"
                      aria-label={`Remove ${file.name}`}
                      tabIndex={-1}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default RecentFilesDropdown;

