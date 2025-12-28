/**
 * FrontendRAFT - Main Class
 * 
 * The core orchestrator that combines all RAFT capabilities.
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

import { AuthLayer } from './AuthLayer.js';
import { Router } from './Router.js';
import { StorageLayer } from './StorageLayer.js';
import { ComputeLayer } from './ComputeLayer.js';
import { P2PLayer } from './P2PLayer.js';
import { CDNClient } from './CDNClient.js';
import { CacheLayer } from './CacheLayer.js';
import { StreamManager } from './StreamManager.js';
import { BatchManager } from './BatchManager.js';
import { OptimisticEngine } from './OptimisticEngine.js';
import { QueryEngine } from './QueryEngine.js';

/**
 * FrontendRAFT Main Class
 * 
 * Transforms any website into a RAFT-compliant API with:
 * - REST-compatible endpoints
 * - Real-time streaming
 * - Smart caching
 * - Request batching
 * - Optimistic updates
 * - Query language
 */
export class FrontendRAFT {
  /**
   * @param {Object} config Configuration
   * @param {string} config.name API name
   * @param {string} config.version API version
   * @param {boolean} config.autoRegister Auto-register to CDN
   * @param {string} config.cdnUrl CDN registry URL
   */
  constructor(config = {}) {
    this.config = {
      name: config.name || 'Unnamed RAFT API',
      version: config.version || '1.0.0',
      autoRegister: config.autoRegister !== false,
      cdnUrl: config.cdnUrl || 'https://cdn.frontierapi.io',
      ...config
    };

    this.apiId = null;
    this.csop = null;
    this.initialized = false;

    // Layers
    this.auth = null;
    this.router = null;
    this.storage = null;
    this.compute = null;
    this.p2p = null;
    this.cdn = null;

    // RAFT Features
    this.cache = null;
    this.stream = null;
    this.batch = null;
    this.optimistic = null;
    this.query = null;
  }

  /**
   * Initialize FrontendRAFT
   * Loads CSOP and sets up all capabilities
   */
  async init() {
    if (this.initialized) {
      console.warn('FrontendRAFT already initialized');
      return;
    }

    try {
      console.log('🚀 FrontendRAFT v0.1.0 - Initializing...');

      // 1. Load CSOP dynamically
      await this._loadCSOP();

      // 2. Initialize CSOP
      await this.csop.init();
      console.log('✅ CSOP v0.2.0 loaded and initialized');

      // 3. Initialize all layers
      this.storage = new StorageLayer(this.csop);
      this.compute = new ComputeLayer(this.csop);
      this.p2p = new P2PLayer(this.csop);
      
      this.auth = new AuthLayer(this.storage);
      this.router = new Router(this.storage, this.compute);
      this.cdn = new CDNClient(this.config.cdnUrl, this.p2p);

      // 4. Initialize RAFT features
      this.cache = new CacheLayer(this.storage);
      this.stream = new StreamManager(this.p2p);
      this.batch = new BatchManager(this.router);
      this.optimistic = new OptimisticEngine(this.storage);
      this.query = new QueryEngine(this.storage);

      console.log('✅ All RAFT capabilities initialized');

      // 5. Auto-register if enabled
      if (this.config.autoRegister) {
        await this._autoRegister();
      }

      this.initialized = true;
      console.log('🎉 FrontendRAFT ready!');

      return this;
    } catch (error) {
      console.error('❌ FrontendRAFT initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load CSOP from CDN
   * @private
   */
  async _loadCSOP() {
    try {
      // Import CSOP from CDN
      const module = await import('https://cdn.jsdelivr.net/gh/Nexus-Studio-CEO/CSOP@main/src/csop.js');
      const { CSOP } = module;
      
      this.csop = new CSOP();
      console.log('✅ CSOP module loaded from CDN');
    } catch (error) {
      console.error('❌ Failed to load CSOP:', error);
      throw new Error('CSOP is required. Ensure internet connection or install locally.');
    }
  }

  /**
   * Auto-register API to CDN
   * @private
   */
  async _autoRegister() {
    try {
      // Check if already registered
      const existingId = localStorage.getItem('frontendraft_api_id');
      
      if (existingId) {
        this.apiId = existingId;
        console.log('✅ API already registered:', this.apiId);
        return;
      }

      // Generate new API ID
      this.apiId = `raft_${crypto.randomUUID().replace(/-/g, '')}`;

      // Register with CDN
      const metadata = {
        apiId: this.apiId,
        name: this.config.name,
        version: this.config.version,
        siteUrl: window.location.origin,
        endpoints: this.router.getEndpoints(),
        createdAt: Date.now()
      };

      await this.cdn.register(metadata);

      // Save locally
      localStorage.setItem('frontendraft_api_id', this.apiId);
      localStorage.setItem('frontendraft_metadata', JSON.stringify(metadata));

      console.log(`
╔══════════════════════════════════════════════════════════╗
║          🎉 API Successfully Published!                  ║
╠══════════════════════════════════════════════════════════╣
║  API ID: ${this.apiId}                                    ║
║  Name:   ${this.config.name}                              ║
║  URL:    ${this.config.cdnUrl}/${this.apiId}             ║
╠══════════════════════════════════════════════════════════╣
║  Users can create accounts on your site to get tokens   ║
╚══════════════════════════════════════════════════════════╝
      `);
    } catch (error) {
      console.warn('⚠️ Auto-registration failed:', error.message);
      console.log('API will work locally without CDN registration');
    }
  }

  /**
   * Define API routes
   * 
   * @example
   * raft.routes({
   *   'GET /users': async (req) => ({ users: [...] }),
   *   'POST /users': async (req) => ({ id: 1 })
   * })
   */
  routes(definitions) {
    if (!this.initialized) {
      throw new Error('FrontendRAFT not initialized. Call init() first.');
    }

    Object.entries(definitions).forEach(([route, handler]) => {
      this.router.define(route, handler);
    });

    console.log(`✅ ${Object.keys(definitions).length} routes defined`);
  }

  /**
   * Make an API request (with RAFT features)
   * 
   * @param {string} method HTTP method
   * @param {string} path Endpoint path
   * @param {Object} options Request options
   * @returns {Promise<any>} Response data
   */
  async request(method, path, options = {}) {
    if (!this.initialized) {
      throw new Error('FrontendRAFT not initialized. Call init() first.');
    }

    const {
      headers = {},
      body = null,
      cache = true,
      optimistic = false,
      stream = false,
      query = null
    } = options;

    try {
      // 1. Check cache first (if enabled)
      if (cache && method === 'GET') {
        const cached = await this.cache.get(path);
        if (cached) {
          console.log('✅ Cache HIT:', path);
          return cached;
        }
      }

      // 2. Apply query language (if provided)
      let finalPath = path;
      if (query) {
        finalPath = this.query.applyQuery(path, query);
      }

      // 3. Optimistic update (if enabled)
      if (optimistic && body) {
        this.optimistic.apply(finalPath, body);
      }

      // 4. Stream response (if enabled)
      if (stream) {
        return this.stream.open(finalPath, { method, headers, body });
      }

      // 5. Execute request
      const response = await this.router.handle({
        method,
        path: finalPath,
        headers,
        body
      });

      // 6. Cache response (if GET)
      if (cache && method === 'GET') {
        await this.cache.set(path, response, { ttl: 60000 }); // 1 minute
      }

      return response;
    } catch (error) {
      // Rollback optimistic update on error
      if (optimistic) {
        this.optimistic.rollback(path);
      }
      throw error;
    }
  }

  /**
   * Convenience methods
   */
  async get(path, options = {}) {
    return this.request('GET', path, options);
  }

  async post(path, body, options = {}) {
    return this.request('POST', path, { ...options, body });
  }

  async put(path, body, options = {}) {
    return this.request('PUT', path, { ...options, body });
  }

  async delete(path, options = {}) {
    return this.request('DELETE', path, options);
  }

  /**
   * Get API metadata
   */
  getMetadata() {
    return {
      apiId: this.apiId,
      name: this.config.name,
      version: this.config.version,
      siteUrl: window.location.origin,
      endpoints: this.router.getEndpoints(),
      capabilities: {
        streaming: true,
        caching: true,
        batching: true,
        optimistic: true,
        query: true
      }
    };
  }
}

export default FrontendRAFT;