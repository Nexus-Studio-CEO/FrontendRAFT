/**
 * FrontendRAFT - Main Class
 * 
 * Core orchestrator for RAFT protocol (Reactive API for Frontend Transformation)
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

import type { RAFTConfig, CSOPInstance, RouteHandler, Middleware } from '../types';
import { AuthLayer } from './AuthLayer';
import { Router } from './Router';
import { StorageLayer } from './StorageLayer';
import { ComputeLayer } from './ComputeLayer';
import { P2PLayer } from './P2PLayer';
import { CDNClient } from './CDNClient';
import { CacheLayer } from './CacheLayer';
import { StreamManager } from './StreamManager';
import { BatchManager } from './BatchManager';
import { OptimisticEngine } from './OptimisticEngine';
import { QueryEngine } from './QueryEngine';

export class FrontendRAFT {
  private config: RAFTConfig;
  private csop: CSOPInstance | null = null;
  private initialized = false;
  
  public auth: AuthLayer | null = null;
  public router: Router | null = null;
  public storage: StorageLayer | null = null;
  public compute: ComputeLayer | null = null;
  public p2p: P2PLayer | null = null;
  public cdn: CDNClient | null = null;
  public cache: CacheLayer | null = null;
  public stream: StreamManager | null = null;
  public batch: BatchManager | null = null;
  public optimistic: OptimisticEngine | null = null;
  public query: QueryEngine | null = null;
  
  public apiId: string | null = null;
  public publicUrl: string | null = null;

  constructor(config: RAFTConfig) {
    this.config = {
      version: '1.0.0',
      autoRegister: true,
      cdn: { registryUrl: 'https://cdn.frontierapi.io' },
      auth: { tokenExpiry: 30 * 24 * 3600000 },
      cache: { enabled: true, defaultTTL: 5 * 60 * 1000, maxSize: 50 * 1024 * 1024 },
      rateLimit: { windowMs: 60000, maxRequests: 100 },
      cors: { origins: [], methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], credentials: true },
      ...config
    };
  }

  async init(): Promise<void> {
    if (this.initialized) {
      console.warn('FrontendRAFT already initialized');
      return;
    }

    try {
      // @ts-ignore - Dynamic import from CDN
      const { CSOP } = await import('https://cdn.jsdelivr.net/gh/Nexus-Studio-CEO/CSOP@v0.1.0/src/csop.js');
      
      const csopInstance = new CSOP();
      await csopInstance.init();
      this.csop = csopInstance;

      this.storage = new StorageLayer(csopInstance);
      this.compute = new ComputeLayer(csopInstance);
      this.auth = new AuthLayer(csopInstance, this.storage, this.config.auth);
      this.router = new Router(this.auth, this.config.rateLimit, this.config.cors);
      this.p2p = new P2PLayer(csopInstance);
      this.cdn = new CDNClient(csopInstance, this.config.cdn);
      this.cache = new CacheLayer(this.storage, this.config.cache);
      this.stream = new StreamManager(csopInstance);
      this.batch = new BatchManager(this.router);
      this.optimistic = new OptimisticEngine(this.storage, this.cache);
      this.query = new QueryEngine(this.storage);

      if (this.config.autoRegister) await this.autoRegister();

      this.initialized = true;
      this.logBanner();
    } catch (error) {
      console.error('Failed to initialize FrontendRAFT:', error);
      throw new Error('CSOP is required. Make sure it is available.');
    }
  }

  private async autoRegister(): Promise<void> {
    try {
      const existingId = localStorage.getItem('frontendraft:apiId');
      if (existingId) {
        this.apiId = existingId;
        this.publicUrl = localStorage.getItem('frontendraft:publicUrl') || null;
        console.log('✅ API already registered:', this.apiId);
        return;
      }

      this.apiId = `raft_${crypto.randomUUID()}`;
      const result = await this.cdn!.register({
        apiId: this.apiId,
        name: this.config.name,
        version: this.config.version || '1.0.0',
        siteUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
        endpoints: this.router!.getEndpoints()
      });

      this.publicUrl = result.publicUrl;
      localStorage.setItem('frontendraft:apiId', this.apiId);
      localStorage.setItem('frontendraft:publicUrl', this.publicUrl);
      console.log('🚀 API registered:', this.publicUrl);
    } catch (error) {
      console.error('Auto-registration failed:', error);
    }
  }

  get(path: string, handler: RouteHandler): void {
    this.ensureInitialized();
    this.router!.get(path, handler);
  }

  post(path: string, handler: RouteHandler): void {
    this.ensureInitialized();
    this.router!.post(path, handler);
  }

  put(path: string, handler: RouteHandler): void {
    this.ensureInitialized();
    this.router!.put(path, handler);
  }

  delete(path: string, handler: RouteHandler): void {
    this.ensureInitialized();
    this.router!.delete(path, handler);
  }

  patch(path: string, handler: RouteHandler): void {
    this.ensureInitialized();
    this.router!.patch(path, handler);
  }

  use(middleware: Middleware): void {
    this.ensureInitialized();
    this.router!.use(middleware);
  }

  async publish(): Promise<string> {
    this.ensureInitialized();
    if (this.apiId) return this.apiId;
    await this.autoRegister();
    return this.apiId!;
  }

  getMetadata() {
    return {
      apiId: this.apiId,
      name: this.config.name,
      version: this.config.version,
      publicUrl: this.publicUrl,
      endpoints: this.router?.getEndpoints() || []
    };
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('FrontendRAFT not initialized. Call await raft.init() first.');
    }
  }

  private logBanner(): void {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                    🚀 FrontendRAFT v${this.config.version}                  ║
╠════════════════════════════════════════════════════════════╣
║  RAFT = Reactive API for Frontend Transformation          ║
║  Based on CSOP: github.com/Nexus-Studio-CEO/CSOP          ║
╠════════════════════════════════════════════════════════════╣
║  ✅ Storage    (IndexedDB + Cloud)                         ║
║  ✅ Compute    (Web Workers)                               ║
║  ✅ P2P        (WebRTC)                                    ║
║  ✅ Streaming  (Real-time)                                 ║
║  ✅ Caching    (Multi-level)                               ║
║  ✅ Batching   (Auto-optimization)                         ║
║  ✅ Optimistic (Instant UI)                                ║
║  ✅ Query      (GraphQL-like)                              ║
╚════════════════════════════════════════════════════════════╝
    `.trim());

    if (this.apiId) {
      console.log(`\n🎯 API ID: ${this.apiId}`);
      console.log(`🌐 Public URL: ${this.publicUrl}\n`);
    }
  }
}