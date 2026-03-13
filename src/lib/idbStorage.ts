
export const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('testgen-db', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('keyvalue');
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('keyvalue', 'readonly');
        const store = tx.objectStore('keyvalue');
        const getRequest = store.get(name);
        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    });
  },
  setItem: async (name: string, value: string): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('testgen-db', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('keyvalue');
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('keyvalue', 'readwrite');
        const store = tx.objectStore('keyvalue');
        store.put(value, name);
        tx.oncomplete = () => resolve();
      };
      request.onerror = () => resolve();
    });
  },
  removeItem: async (name: string): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('testgen-db', 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('keyvalue', 'readwrite');
        const store = tx.objectStore('keyvalue');
        store.delete(name);
        tx.oncomplete = () => resolve();
      };
    });
  },
};
