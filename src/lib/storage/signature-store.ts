/**
 * Signature Storage using IndexedDB
 * 
 * persist user signatures (SVG strings or base64 images)
 * so they are available across different PDF sessions.
 */

export interface StoredSignature {
    id: string;
    type: 'svg' | 'image';
    data: string; // SVG string or Base64 data URL
    createdAt: number;
    width?: number; // Optional metadata for aspect ratio
    height?: number;
}

const DB_NAME = 'pdfcraft_signatures';
const STORE_NAME = 'signatures';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            reject(new Error('IndexedDB not supported'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(new Error('Failed to open signature database'));

        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

export async function saveSignature(signature: Omit<StoredSignature, 'id' | 'createdAt'>): Promise<string> {
    const db = await openDB();
    const id = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const entry: StoredSignature = {
        ...signature,
        id,
        createdAt: Date.now()
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.add(entry);

        req.onsuccess = () => resolve(id);
        req.onerror = () => reject(new Error('Failed to save signature'));
        tx.oncomplete = () => db.close();
    });
}

export async function getAllSignatures(): Promise<StoredSignature[]> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
            const signatures = req.result as StoredSignature[];
            // Sort by newest first
            signatures.sort((a, b) => b.createdAt - a.createdAt);
            resolve(signatures);
        };
        req.onerror = () => reject(new Error('Failed to load signatures'));
        tx.oncomplete = () => db.close();
    });
}

export async function deleteSignature(id: string): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(new Error('Failed to delete signature'));
        tx.oncomplete = () => db.close();
    });
}
