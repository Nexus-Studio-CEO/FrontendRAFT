/**
 * FrontendRAFT - Storage Layer
 * 
 * IndexedDB wrapper for persistent storage (inspired by CSOP storage capability)
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

export class StorageLayer {
  constructor(dbName = 'frontendraft') {
    this.dbName = dbName;
    this.db = null;
    this.storeName = 'raft_store';
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async save(key, data) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const item = {
        key,
        data,
        timestamp: Date.now(),
        size: JSON.stringify(data).length
      };

      const request = store.put(item);

      request.onsuccess = () => resolve({ key, size: item.size });
      request.onerror = () => reject(request.error);
    });
  }

  async get(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          reject(new Error(`Key not found: ${key}`));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve({ key, deleted: true });
      request.onerror = () => reject(request.error);
    });
  }

  async list(prefix = '') {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = request.result.filter(key => key.startsWith(prefix));
        resolve(keys);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clear() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve({ cleared: true });
      request.onerror = () => reject(request.error);
    });
  }

  async getSize() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const totalSize = request.result.reduce((sum, item) => sum + item.size, 0);
        resolve({
          items: request.result.length,
          bytes: totalSize,
          kb: (totalSize / 1024).toFixed(2),
          mb: (totalSize / 1024 / 1024).toFixed(2)
        });
      };
      request.onerror = () => reject(request.error);
    });
  }
}