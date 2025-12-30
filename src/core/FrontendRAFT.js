/**
 * FrontendRAFT - Main Class
 * 
 * Turn browsers into API servers with RAFT protocol
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

import { DEFAULT_CONFIG } from '../types/index.js';
import { Validator } from '../types/validator.js';
import { StorageLayer } from './StorageLayer.js';
import { ComputeLayer } from './ComputeLayer.js';
import { CacheLayer } from './CacheLayer.js';
import { StreamManager } from './StreamManager.js';
import { BatchManager } from './BatchManager.js';
import { OptimisticEngine } from './OptimisticEngine.js';
import { QueryEngine } from './QueryEngine.js';
import { AuthLayer } from './AuthLayer.js';
import { Router } from './Router.js';
import { P2PLayer } from './P2PLayer.js';
import { CDNClient } from './CDNClient.js';

export class FrontendRAFT {
  constructor(config = {}) {
    Validator.validateConfig(config);

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialized = false;

    this.storage = null;
    this.compute = null;
    this.cache = null;
    this.stream = null;
    this.batch = null;
    this.optimistic = null;
    this.query = null;
    this.auth = null;
    this.router = null;
    this.p2p = null;
    this.cdn = null;
  }

  async init() {
    if (this.initialized) {
      console.warn('FrontendRAFT already initialized');
      return;
    }

    console.log('🚀 Initializing FrontendRAFT...');

    this.storage = new StorageLayer(`raft_${this.config.name.toLowerCase().replace(/\s+/g, '_')}`);
    await this.storage.init();

    this.compute = new ComputeLayer();
    await this.compute.init();

    this.cache = new CacheLayer(this.config.cache);

    this.stream = new StreamManager();

    this.batch = new BatchManager({
      batchWindow: 50,
      maxBatchSize: 10,
      enabled: true
    });

    this.optimistic = new OptimisticEngine();

    this.query = new QueryEngine();

    this.auth = new AuthLayer(this.storage, this.config.auth);

    this.router = new Router();

    this.router.use(this.router.cors({
      origins: ['*'],
      credentials: true
    }));

    if (this.config.rateLimit) {
      this.router.use(this.router.rateLimit(this.config.rateLimit));
    }

    this.p2p = new P2PLayer();

    this.cdn = new CDNClient({
      registryUrl: this.config.cdnRegistry
    });

    if (this.config.autoRegister) {
      await this._autoRegister();
    }

    this.initialized = true;

    console.log('✅ FrontendRAFT initialized successfully');
    console.log(`📦 Storage: IndexedDB`);
    console.log(`⚡ Compute: ${this.compute.numWorkers} workers`);
    console.log(`💾 Cache: ${this.cache.strategy.toUpperCase()} (${this.cache.maxSize} items)`);
    
    if (this.cdn.registered) {
      console.log(`🌐 API ID: ${this.cdn.apiId}`);
      console.log(`🔗 Public URL: ${this.cdn.registryUrl}/${this.cdn.apiId}`);
    }

    return this;
  }

  async _autoRegister() {
    try {
      const registration = await this.cdn.register({
        name: this.config.name,
        version: this.config.version,
        endpoints: this.router.getRoutes()
      });

      await this.storage.save('raft:metadata', {
        apiId: registration.apiId,
        publicUrl: registration.publicUrl,
        registeredAt: Date.now()
      });

      this._showBanner(registration);
    } catch (error) {
      console.warn('Auto-registration failed:', error.message);
    }
  }

  _showBanner(registration) {
    const banner = `
╔══════════════════════════════════════════════════════════╗
║                   🚀 FrontendRAFT API                    ║
╠══════════════════════════════════════════════════════════╣
║  Name:       ${this.config.name.padEnd(42)} ║
║  Version:    ${this.config.version.padEnd(42)} ║
║  API ID:     ${registration.apiId.padEnd(42)} ║
║  Public URL: ${(registration.publicUrl || 'N/A').padEnd(42)} ║
╠══════════════════════════════════════════════════════════╣
║  Inspired by CSOP - github.com/Nexus-Studio-CEO/CSOP    ║
╚══════════════════════════════════════════════════════════╝
    `;
    console.log(banner);
  }

  get(path, handler) {
    this.router.get(path, handler);
  }

  post(path, handler) {
    this.router.post(path, handler);
  }

  put(path, handler) {
    this.router.put(path, handler);
  }

  delete(path, handler) {
    this.router.delete(path, handler);
  }

  patch(path, handler) {
    this.router.patch(path, handler);
  }

  use(middleware) {
    this.router.use(middleware);
  }

  async handle(request) {
    if (!this.initialized) {
      throw new Error('FrontendRAFT not initialized. Call init() first.');
    }

    return await this.router.handle(request);
  }

  async executeWithCache(key, fn, ttl) {
    const cached = this.cache.get(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    this.cache.set(key, result, ttl);
    return result;
  }

  async *stream(channel, generator, config) {
    yield* this.stream.createStream(channel, generator, config);
  }

  subscribe(channel, callback) {
    return this.stream.subscribe(channel, callback);
  }

  async batchExecute(requests) {
    const promises = requests.map(req => this.batch.add(req));
    return await Promise.all(promises);
  }

  async optimisticUpdate(entity, optimisticData, actualRequest, options) {
    return await this.optimistic.apply(entity, optimisticData, actualRequest, options);
  }

  queryData(data, options) {
    return this.query.query(data, options);
  }

  async getStats() {
    return {
      initialized: this.initialized,
      api: {
        id: this.cdn.apiId,
        registered: this.cdn.registered,
        routes: this.router.getStats()
      },
      storage: await this.storage.getSize(),
      compute: this.compute.getStats(),
      cache: this.cache.getStats(),
      streams: this.stream.getActiveStreams(),
      batch: this.batch.getStats(),
      optimistic: this.optimistic.getStats(),
      p2p: this.p2p.getStats()
    };
  }

  async destroy() {
    console.log('🛑 Shutting down FrontendRAFT...');

    if (this.cdn && this.cdn.registered) {
      await this.cdn.unregister();
    }

    if (this.compute) {
      await this.compute.terminate();
    }

    if (this.stream) {
      this.stream.stopAll();
    }

    if (this.batch) {
      this.batch.clear();
    }

    if (this.p2p) {
      this.p2p.closeAll();
    }

    this.initialized = false;

    console.log('✅ FrontendRAFT shut down successfully');
  }
}