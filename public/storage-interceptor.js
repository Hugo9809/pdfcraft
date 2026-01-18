/**
 * Storage Interceptor
 * 
 * This script is injected into the PDF viewer to:
 * 1. Monitor signature creation and save to IndexedDB
 * 2. Intercept the save action to use OPFS
 * 3. Restore signatures on load
 */

(function initStorageInterceptor() {
    const DB_NAME = 'pdfcraft_signatures';
    const STORE_NAME = 'signatures';
    const DB_VERSION = 1;

    // --- IndexedDB Helpers ---

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject('DB Error');
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    async function getAllSignatures() {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
        });
    }

    // --- UI Fixes ---
    // Ensure native download buttons are visible
    function ensureButtonsVisible() {
        const ids = ['download', 'secondaryDownload'];
        ids.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.style.display = '';
                btn.style.visibility = 'visible';
                btn.classList.remove('hidden', 'hiddenMediumView');
            }
        });

        // Hide the broken extension toolbar button if present
        const customToolbar = document.querySelector('.CustomToolbar');
        if (customToolbar) {
            const buttons = customToolbar.querySelectorAll('li, button');
            buttons.forEach(b => {
                const text = b.textContent?.trim();
                if (text === '保存' || text === 'Save' || text === 'Speichern') {
                    b.style.display = 'none';
                }
            });
        }
    }

    // Run repeatedly
    setInterval(ensureButtonsVisible, 1000);

    // Also observe DOM for dynamic changes
    const observer = new MutationObserver(ensureButtonsVisible);
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // --- Signature Interception ---

    // Hook into PDF.js EventBus to catch annotation changes
    function hookEventBus() {
        const app = window.PDFViewerApplication;

        // Also observe annotationEditorParams changes in localStorage
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function (key, value) {
            if (key === 'pdfjs.preferences') {
                // We can try to parse this and extract ink signatures
                try {
                    const parsed = JSON.parse(value);
                    if (parsed.annotationEditorParams?.inkEditorParams) {
                        // This is where signatures often live
                        // We should persist this entire object to our signature DB if valuable
                    }
                } catch (e) { }
            }
            originalSetItem.apply(this, arguments);
        };

        if (!app || !app.eventBus) {
            setTimeout(hookEventBus, 500);
            return;
        }

        // Attempt to listen to internal editor events if exposed
        // PDF.js doesn't easily expose "signature created" events publicly.
        // So we fallback to a periodic check of the ink editor parameters directly
        // via the app instance if accessible.
    }

    // Restore signatures
    async function restoreSignatures() {
        try {
            const app = window.PDFViewerApplication;
            // Wait for app to be ready
            if (!app || !app.initialized) {
                setTimeout(restoreSignatures, 500);
                return;
            }

            const signatures = await getAllSignatures();
            if (!signatures || signatures.length === 0) return;

            console.log('Restoring signatures:', signatures.length);

            // We need to inject these into the Signature Manager of PDF.js
            // Accessing internal components is tricky but possible via the Application instance
            // The AnnotationEditorUIManager is the key

            // For now, simpler approach:
            // We will expose a global function that the React component can call
            // to populate the signature UI if needed, OR relies on the fact we
            // sync to localStorage 'pdfjs.preferences' before viewer load in the React component.

        } catch (e) {
            console.error('Failed to restore signatures', e);
        }
    }

    // --- Save Interception ---
    // Overwrite the download manager behavior
    function interceptDownload() {
        const app = window.PDFViewerApplication;
        if (!app || !app.downloadManager) {
            setTimeout(interceptDownload, 500);
            return;
        }

        // Helper to send data back to parent window (React app)
        function sendToParent(blob, filename, type = 'PDF_SAVE_DATA') {
            window.parent.postMessage({
                type: type,
                blob: blob,
                filename: filename
            }, '*');
        }

        // Periodic Session Save (every 30 seconds) & on changes
        // This leverages the hijacked download mechanism but sends a specific type
        async function saveSession() {
            try {
                const app = window.PDFViewerApplication;
                if (!app || !app.pdfDocument) return;

                // We need to use the internal save capability
                // Note: This might be heavy for large files. 
                // Ideally we only do this if there are unsaved changes.
                // Check app.pdfDocument.annotationStorage.size > 0 or similar dirty flags

                const data = await app.pdfDocument.saveDocument(app.pdfDocument.annotationStorage);
                const blob = new Blob([data], { type: 'application/pdf' });
                sendToParent(blob, 'session_auto_save.pdf', 'PDF_SESSION_BACKUP');
            } catch (e) {
                console.warn('Auto-save failed', e);
            }
        }

        // Auto-save loop
        setInterval(saveSession, 30000);

        // Hijack the download function
        app.downloadManager.download = function (blob, url, filename) {
            console.log('Intercepted download for:', filename);

            // If we have a blob (data), send it
            if (blob) {
                sendToParent(blob, filename);
                return;
            }

            // If it's a URL, fetch it then send
            if (url) {
                fetch(url)
                    .then(res => res.blob())
                    .then(b => sendToParent(b, filename))
                    .catch(e => console.error('Download fetch failed', e));
            }
        };

        // Also hook the "Save" event from the EventBus to ensure we catch it
        app.eventBus._on('save', async function () {
            console.log('Save event intercepted');
            // Trigger the app's internal save mechanism which calls our hijacked download
            await app.save();
        });
    }

    // Init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            hookEventBus();
            interceptDownload();
            restoreSignatures();
        });
    } else {
        hookEventBus();
        interceptDownload();
        restoreSignatures();
    }

    // Listen for external trigger
    window.addEventListener('message', async (e) => {
        if (e.data?.type === 'TRIGGER_SAVE') {
            const app = window.PDFViewerApplication;
            if (app) {
                await app.save();
            }
        }
    });

})();
