/**
 * FrontendRAFT - CDN Registry Client
 * 
 * Handles registration and discovery via CDN registry.
 * Publishes API metadata for consumer access.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

/**
 * CDN Registry Client
 * Publishes and discovers APIs via CDN
 */
export class CDNClient {
  /**
   * @param {string} cdnUrl CDN registry URL
   * @param {P2PLayer} p2p P2P layer for connectivity
   */
  constructor(cdnUrl, p2p) {
    this.cdnUrl = cdnUrl;
    this.p2p = p2p;

    console.log('✅ CDNClient initialized');
  }

  /**
   * Register API with CDN
   * 
   * @param {Object} metadata API metadata
   * @returns {Promise<Object>} Registration result
   * 
   * @example
   * const result = await cdn.register({
   *   apiId: 'raft_abc123',
   *   name: 'My API',
   *   endpoints: [...]
   * });
   */
  async register(metadata) {
    try {
      const response = await fetch(`${this.cdnUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });

      if (!response.ok) {
        throw new Error(`CDN registration failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('✅ API registered with CDN:', result);

      return result;
    } catch (error) {
      console.error('CDN registration error:', error);
      throw error;
    }
  }

  /**
   * Discover API by ID
   * 
   * @param {string} apiId API identifier
   * @returns {Promise<Object>} API metadata
   * 
   * @example
   * const api = await cdn.discover('raft_abc123');
   */
  async discover(apiId) {
    try {
      const response = await fetch(`${this.cdnUrl}/discover/${apiId}`);

      if (!response.ok) {
        throw new Error(`API not found: ${apiId}`);
      }

      const metadata = await response.json();
      
      return metadata;
    } catch (error) {
      console.error('CDN discovery error:', error);
      throw error;
    }
  }

  /**
   * Send heartbeat to CDN
   * 
   * @param {string} apiId API identifier
   * @returns {Promise<void>}
   */
  async heartbeat(apiId) {
    try {
      await fetch(`${this.cdnUrl}/heartbeat/${apiId}`, {
        method: 'POST'
      });
    } catch (error) {
      console.warn('Heartbeat failed:', error);
    }
  }

  /**
   * List available APIs
   * 
   * @param {Object} filters Search filters
   * @returns {Promise<Array>} List of APIs
   * 
   * @example
   * const apis = await cdn.list({ category: 'data' });
   */
  async list(filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const response = await fetch(`${this.cdnUrl}/list?${queryString}`);

      if (!response.ok) {
        throw new Error('Failed to list APIs');
      }

      const apis = await response.json();
      
      return apis;
    } catch (error) {
      console.error('CDN list error:', error);
      return [];
    }
  }
}

export default CDNClient;