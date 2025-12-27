/**
 * FrontendRAFT - Main Export
 * 
 * RAFT = Reactive API for Frontend Transformation
 * Transform any frontend into a full-featured API server with zero infrastructure.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 * 
 * @example
 * ```typescript
 * import { FrontendRAFT } from '@frontendraft/core';
 * 
 * const raft = new FrontendRAFT({
 *   name: "My API",
 *   autoRegister: true
 * });
 * 
 * await raft.init();
 * 
 * raft.get('/users', async (req) => {
 *   return { users: [...] };
 * });
 * 
 * const apiId = await raft.publish();
 * console.log('API available at:', apiId);
 * ```
 */

// Core exports
export { FrontendRAFT } from './core/FrontendRAFT';
export { AuthLayer } from './core/AuthLayer';
export { Router } from './core/Router';
export { StorageLayer } from './core/StorageLayer';
export { ComputeLayer } from './core/ComputeLayer';
export { P2PLayer } from './core/P2PLayer';
export { CDNClient } from './core/CDNClient';
export { CacheLayer } from './core/CacheLayer';
export { StreamManager } from './core/StreamManager';
export { BatchManager } from './core/BatchManager';
export { OptimisticEngine } from './core/OptimisticEngine';
export { QueryEngine } from './core/QueryEngine';

// Type exports
export type {
  RAFTConfig,
  HTTPMethod,
  HTTPHeaders,
  RAFTRequest,
  RAFTResponse,
  UserCredentials,
  UserData,
  TokenPayload,
  RouteHandler,
  Middleware,
  RouteDefinition,
  CacheOptions,
  CacheEntry,
  CacheStrategy,
  StreamOptions,
  StreamCallback,
  StreamSubscription,
  BatchRequest,
  BatchResponse,
  BatchOptions,
  OptimisticUpdate,
  OptimisticOptions,
  QueryOptions,
  QueryResult,
  P2PConfig,
  P2PMessage,
  APIMetadata,
  EndpointMetadata,
  CSOPInstance
} from './types';

export { RAFTError, ErrorCodes } from './types';

// Utility exports
export * as jwt from './utils/jwt';
export * as crypto from './utils/crypto';
export * as validation from './utils/validation';

// Plugin exports
export * as react from './plugins/react';
export * as vue from './plugins/vue';

// Credits
console.log(`
╔════════════════════════════════════════════════════════════╗
║                    FrontendRAFT v0.1.0                     ║
╠════════════════════════════════════════════════════════════╣
║  RAFT = Reactive API for Frontend Transformation          ║
║                                                            ║
║  Created by: DAOUDA Abdoul Anzize                         ║
║  Organization: Nexus Studio                               ║
║                                                            ║
║  Built on top of CSOP (Client-Side Orchestration)         ║
║  CSOP: github.com/Nexus-Studio-CEO/CSOP                   ║
║                                                            ║
║  FrontendRAFT: github.com/Nexus-Studio-CEO/FrontendRAFT   ║
╚════════════════════════════════════════════════════════════╝
`);