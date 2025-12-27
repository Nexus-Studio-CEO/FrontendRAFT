/**
 * FrontendRAFT - Compute Layer
 * 
 * Wrapper around CSOP compute capability (Web Workers parallelization)
 * Enables heavy computation without blocking UI.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

import type { CSOPInstance } from '../types';

/**
 * Compute layer wrapping CSOP compute
 * 
 * @example
 * ```typescript
 * const result = await compute.execute('custom', {
 *   fn: 'return data.items.filter(x => x.score > 0.8)',
 *   args: { items: bigDataset }
 * });
 * ```
 */
export class ComputeLayer {
  private csop: CSOPInstance;

  constructor(csop: CSOPInstance) {
    this.csop = csop;
  }

  /**
   * Execute computation task
   */
  async execute(task: string, data: any): Promise<any> {
    try {
      const result = await this.csop.dispatch('compute.execute', {
        task,
        data
      });
      return result.data;
    } catch (error) {
      console.error('Compute execution failed:', error);
      throw error;
    }
  }

  /**
   * Execute batch of tasks in parallel
   */
  async batch(tasks: Array<{ task: string; data: any }>): Promise<any[]> {
    try {
      const result = await this.csop.dispatch('compute.batch', { tasks });
      return result.data.results || [];
    } catch (error) {
      console.error('Batch compute failed:', error);
      throw error;
    }
  }

  /**
   * Execute custom function
   */
  async executeFunction(fn: string, args: any): Promise<any> {
    return this.execute('custom', {
      fn,
      args
    });
  }
}