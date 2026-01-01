/**
 * FrontendRAFT - Cache Layer
 * 
 * Multi-level intelligent caching system with TTL and invalidation
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

class CacheLayer {
    constructor() {
        this.memoryCache = new Map();
        this.dbName = 'FrontendRAFT_Cache';
        this.storeName = 'cache';
        this.db = null;
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0
        };
    }

    /**
     * Initialize IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                Logger.info('CacheLayer: IndexedDB initialized');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    /**
     * Set cache entry with TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
     * @param {string} level - 'memory' or 'persistent'
     */
    async set(key, value, ttl = 300000, level = 'memory') {
        const entry = {
            value,
            expires: Date.now() + ttl,
            createdAt: Date.now()
        };
        
        if (level === 'memory' || level === 'both') {
            this.memoryCache.set(key, entry);
        }
        
        if (level === 'persistent' || level === 'both') {
            await this._setInDB(key, entry);
        }
        
        this.stats.sets++;
        Logger.info(`CacheLayer: Set "${key}" (TTL: ${ttl}ms, Level: ${level})`);
    }

    /**
     * Get cached value
     * @param {string} key - Cache key
     * @returns {any|null} Cached value or null if expired/missing
     */
    async get(key) {
        // Check memory first
        if (this.memoryCache.has(key)) {
            const entry = this.memoryCache.get(key);
            if (Date.now() < entry.expires) {
                this.stats.hits++;
                Logger.info(`CacheLayer: HIT (memory) "${key}"`);
                return entry.value;
            } else {
                this.memoryCache.delete(key);
            }
        }
        
        // Check IndexedDB
        const dbEntry = await this._getFromDB(key);
        if (dbEntry && Date.now() < dbEntry.expires) {
            this.stats.hits++;
            Logger.info(`CacheLayer: HIT (persistent) "${key}"`);
            // Promote to memory
            this.memoryCache.set(key, dbEntry);
            return dbEntry.value;
        }
        
        this.stats.misses++;
        Logger.info(`CacheLayer: MISS "${key}"`);
        return null;
    }

    /**
     * Invalidate cache entry
     */
    async invalidate(key) {
        this.memoryCache.delete(key);
        await this._deleteFromDB(key);
        Logger.info(`CacheLayer: Invalidated "${key}"`);
    }

    /**
     * Clear all cache
     */
    async clear() {
        this.memoryCache.clear();
        await this._clearDB();
        Logger.info('CacheLayer: All cache cleared');
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;
        
        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            memorySize: this.memoryCache.size
        };
    }

    /**
     * Cache with function execution
     * @param {string} key - Cache key
     * @param {function} fn - Function to execute if cache miss
     * @param {number} ttl - TTL in milliseconds
     */
    async getOrSet(key, fn, ttl = 300000) {
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        
        const value = await fn();
        await this.set(key, value, ttl);
        return value;
    }

    // Private IndexedDB helpers
    async _setInDB(key, entry) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(entry, key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async _getFromDB(key) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async _deleteFromDB(key) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async _clearDB() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Global instance
window.CacheLayer = new CacheLayer();