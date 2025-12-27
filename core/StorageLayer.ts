/**
 * FrontendRAFT - Storage Layer
 * 
 * Wrapper around CSOP storage capability (IndexedDB + Turso fallback)
 * Provides simple key-value interface for all RAFT data persistence.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

import type { CSOPInstance } from '../types';

/**
 * Storage layer wrapping CSOP storage
 * 
 * @example
 * ```typescript
 * await storage.save('user:123', { name: 'Alice' });
 * const user = await storage.get('user:123');
 * await storage.delete('user:123');
 * ```
 */
export class StorageLayer {
  private csop: CSOPInstance;

  constructor(csop: CSOPInstance) {
    this.csop = csop;
  }

  /**
   * Save data to storage
   */
  async save(key: string, data: any): Promise<void> {
    try {
      await this.csop.dispatch('storage.save', {
        key,
        data
      });
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get data from storage
   */
  async get<T = any>(key: string): Promise<T> {
    try {
      const result = await this.csop.dispatch('storage.get', { key });
      return result.data as T;
    } catch (error) {
      throw new Error(`Key not found: ${key}`);
    }
  }

  /**
   * Delete data from storage
   */
  async delete(key: string): Promise<void> {
    try {
      await this.csop.dispatch('storage.delete', { key });
    } catch (error) {
      console.error(`Failed to delete ${key}:`, error);
    }
  }

  /**
   * List all keys with optional prefix
   */
  async list(prefix?: string): Promise<string[]> {
    try {
      const result = await this.csop.dispatch('storage.list', { prefix });
      return result.data || [];
    } catch (error) {
      console.error('Failed to list keys:', error);
      return [];
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.get(key);
      return true;
    } catch {
      return false;
    }
  }
}