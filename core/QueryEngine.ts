/**
 * FrontendRAFT - Query Engine
 * 
 * GraphQL-like query language for efficient data fetching.
 * RAFT Feature #5: Query Language
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

import type { QueryOptions, QueryResult } from '../types';
import type { StorageLayer } from './StorageLayer';

export class QueryEngine {
  private storage: StorageLayer;

  constructor(storage: StorageLayer) {
    this.storage = storage;
  }

  async query<T = any>(resourceType: string, options?: QueryOptions): Promise<QueryResult<T>> {
    const keys = await this.storage.list(`${resourceType}:`);
    
    let items: T[] = [];
    for (const key of keys) {
      try {
        const item = await this.storage.get<T>(key);
        items.push(item);
      } catch (error) {}
    }

    if (options?.where) {
      items = this.applyFilters(items, options.where);
    }

    const total = items.length;

    if (options?.orderBy) {
      items = this.applySorting(items, options.orderBy);
    }

    if (options?.offset) {
      items = items.slice(options.offset);
    }

    if (options?.limit) {
      items = items.slice(0, options.limit);
    }

    if (options?.select) {
      items = this.applySelection(items, options.select);
    }

    return {
      data: items,
      total,
      hasMore: options?.limit ? total > (options.offset || 0) + options.limit : false
    };
  }

  async findOne<T = any>(resourceType: string, options?: QueryOptions): Promise<T | null> {
    const result = await this.query<T>(resourceType, { ...options, limit: 1 });
    return result.data[0] || null;
  }

  async count(resourceType: string, options?: Pick<QueryOptions, 'where'>): Promise<number> {
    const result = await this.query(resourceType, options);
    return result.total;
  }

  private applyFilters<T>(items: T[], filters: Record<string, any>): T[] {
    return items.filter(item => {
      for (const [key, value] of Object.entries(filters)) {
        if (typeof value === 'object' && value !== null) {
          if ('$gt' in value && !((item as any)[key] > value.$gt)) return false;
          if ('$gte' in value && !((item as any)[key] >= value.$gte)) return false;
          if ('$lt' in value && !((item as any)[key] < value.$lt)) return false;
          if ('$lte' in value && !((item as any)[key] <= value.$lte)) return false;
          if ('$ne' in value && (item as any)[key] === value.$ne) return false;
          if ('$in' in value && !value.$in.includes((item as any)[key])) return false;
          if ('$contains' in value && !(item as any)[key]?.includes(value.$contains)) return false;
        } else {
          if ((item as any)[key] !== value) return false;
        }
      }
      return true;
    });
  }

  private applySorting<T>(items: T[], orderBy: { field: string; direction: 'asc' | 'desc' }): T[] {
    return items.sort((a, b) => {
      const aVal = (a as any)[orderBy.field];
      const bVal = (b as any)[orderBy.field];
      
      if (aVal < bVal) return orderBy.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return orderBy.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private applySelection<T>(items: T[], fields: string[]): T[] {
    return items.map(item => {
      const selected: any = {};
      for (const field of fields) {
        if (field in (item as any)) {
          selected[field] = (item as any)[field];
        }
      }
      return selected as T;
    });
  }

  buildQuery(options: QueryOptions): string {
    const parts: string[] = [];

    if (options.select) {
      parts.push(`select: [${options.select.join(', ')}]`);
    }

    if (options.where) {
      parts.push(`where: ${JSON.stringify(options.where)}`);
    }

    if (options.orderBy) {
      parts.push(`orderBy: ${options.orderBy.field} ${options.orderBy.direction}`);
    }

    if (options.limit) {
      parts.push(`limit: ${options.limit}`);
    }

    if (options.offset) {
      parts.push(`offset: ${options.offset}`);
    }

    return `{ ${parts.join(', ')} }`;
  }
}