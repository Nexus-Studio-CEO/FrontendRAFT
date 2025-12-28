/**
 * FrontendRAFT - Compute Layer
 * 
 * Wrapper around CSOP compute capability.
 * Provides parallel computation via Web Workers.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

/**
 * Compute Layer
 * High-level wrapper for CSOP compute
 */
export class ComputeLayer {
  /**
   * @param {CSOP} csop CSOP instance
   */
  constructor(csop) {
    this.csop = csop;

    console.log('✅ ComputeLayer initialized (CSOP powered)');
  }

  /**
   * Execute single task
   * 
   * @param {string} task Task name
   * @param {Object} data Task data
   * @returns {Promise<any>} Result
   * 
   * @example
   * const result = await compute.execute('fibonacci', { n: 100 });
   */
  async execute(task, data) {
    try {
      const result = await this.csop.dispatch('compute.execute', {
        task,
        data
      });

      return result.data;
    } catch (error) {
      console.error('Compute execute error:', error);
      throw error;
    }
  }

  /**
   * Execute multiple tasks in parallel
   * 
   * @param {Array} tasks Array of task objects
   * @returns {Promise<Array>} Results array
   * 
   * @example
   * const results = await compute.batch([
   *   { task: 'fibonacci', data: { n: 50 } },
   *   { task: 'factorial', data: { n: 10 } }
   * ]);
   */
  async batch(tasks) {
    try {
      const result = await this.csop.dispatch('compute.batch', {
        tasks
      });

      return result.data.results;
    } catch (error) {
      console.error('Compute batch error:', error);
      throw error;
    }
  }

  /**
   * Execute custom function
   * 
   * @param {string} fnString Function body as string
   * @param {Object} args Function arguments
   * @returns {Promise<any>} Result
   * 
   * @example
   * const result = await compute.custom(`
   *   return data.items.filter(x => x.score > 0.5);
   * `, { items: [...] });
   */
  async custom(fnString, args) {
    try {
      const result = await this.csop.dispatch('compute.execute', {
        task: 'custom',
        data: {
          fn: fnString,
          args
        }
      });

      return result.data;
    } catch (error) {
      console.error('Compute custom error:', error);
      throw error;
    }
  }

  /**
   * Process array in parallel chunks
   * 
   * @param {Array} array Input array
   * @param {Function} processor Processing function
   * @param {number} chunkSize Chunk size
   * @returns {Promise<Array>} Processed results
   * 
   * @example
   * const results = await compute.map(bigArray, (item) => item * 2);
   */
  async map(array, processor, chunkSize = 1000) {
    const chunks = [];
    
    // Split array into chunks
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }

    // Process chunks in parallel
    const tasks = chunks.map((chunk, index) => ({
      task: 'custom',
      data: {
        fn: `return data.chunk.map(data.processor)`,
        args: {
          chunk,
          processor: processor.toString()
        }
      }
    }));

    const results = await this.batch(tasks);
    
    // Flatten results
    return results.flat();
  }
}

export default ComputeLayer;