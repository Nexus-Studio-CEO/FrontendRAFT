/**
 * FrontendRAFT - Storage Layer
 * 
 * Wrapper around CSOP storage capability.
 * Provides simple interface for data persistence.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

/**
 * Storage Layer
 * High-level wrapper for CSOP storage
 */
export class StorageLayer {
  /**
   * @param {CSOP} csop CSOP instance
   */
  constructor(csop) {
    this.csop = csop;

    console.log('✅ StorageLayer initialized (CSOP powered)');
  }

  /**
   * Save data
   * 
   * @param {string} key Storage key
   * @param {any} data Data to save
   * @returns {Promise<Object>} Result
   * 
   * @example
   * await storage.save('user:123', { name: 'Alice' });
   */
  async save(key, data) {
    try {
      const result = await this.csop.dispatch('storage.save', {
        key,
        data
      });

      return result.data;
    } catch (error) {
      console.error('Storage save error:', error);
      throw error;
    }
  }

  /**
   * Get data
   * 
   * @param {string} key Storage key
   * @returns {Promise<any>} Stored data
   * 
   * @example
   * const user = await storage.get('user:123');
   */
  async get(key) {
    try {
      const result = await this.csop.dispatch('storage.get', {
        key
      });

      return result.data;
    } catch (error) {
      if (error.code === 'KEY_NOT_FOUND') {
        return null;
      }
      console.error('Storage get error:', error);
      throw error;
    }
  }

  /**
   * Delete data
   * 
   * @param {string} key Storage key
   * @returns {Promise<boolean>} Success
   * 
   * @example
   * await storage.delete('user:123');
   */
  async delete(key) {
    try {
      await this.csop.dispatch('storage.delete', {
        key
      });

      return true;
    } catch (error) {
      console.error('Storage delete error:', error);
      throw error;
    }
  }

  /**
   * List keys with prefix
   * 
   * @param {string} prefix Key prefix
   * @returns {Promise<string[]>} List of keys
   * 
   * @example
   * const keys = await storage.list('user:');
   */
  async list(prefix = '') {
    try {
      const result = await this.csop.dispatch('storage.list', {
        prefix
      });

      return result.data;
    } catch (error) {
      console.error('Storage list error:', error);
      return [];
    }
  }

  /**
   * Check if key exists
   * 
   * @param {string} key Storage key
   * @returns {Promise<boolean>} True if exists
   * 
   * @example
   * const exists = await storage.exists('user:123');
   */
  async exists(key) {
    try {
      await this.get(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all data with prefix
   * 
   * @param {string} prefix Key prefix
   * @returns {Promise<number>} Number of deleted keys
   * 
   * @example
   * const count = await storage.clear('cache:');
   */
  async clear(prefix = '') {
    try {
      const keys = await this.list(prefix);
      
      await Promise.all(
        keys.map(key => this.delete(key))
      );

      return keys.length;
    } catch (error) {
      console.error('Storage clear error:', error);
      return 0;
    }
  }
}

export default StorageLayer;