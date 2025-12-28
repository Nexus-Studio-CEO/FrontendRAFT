/**
 * FrontendRAFT - Main Entry Point
 * 
 * RAFT = Reactive API for Frontend Transformation
 * The next-generation protocol that extends REST with real-time,
 * caching, batching, optimistic updates, and query capabilities.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 * @license MIT
 */

// Core exports
export { FrontendRAFT } from './core/FrontendRAFT.js';
export { AuthLayer } from './core/AuthLayer.js';
export { Router } from './core/Router.js';
export { StorageLayer } from './core/StorageLayer.js';
export { ComputeLayer } from './core/ComputeLayer.js';
export { P2PLayer } from './core/P2PLayer.js';
export { CDNClient } from './core/CDNClient.js';

// RAFT Protocol Features (MVP v0.1.0)
export { CacheLayer } from './core/CacheLayer.js';
export { StreamManager } from './core/StreamManager.js';
export { BatchManager } from './core/BatchManager.js';
export { OptimisticEngine } from './core/OptimisticEngine.js';
export { QueryEngine } from './core/QueryEngine.js';

// Plugin exports
export { useRAFT, RAFTProvider } from './plugins/react.js';
export { createRAFT } from './plugins/vue.js';

// Utility exports
export { createJWT, verifyJWT } from './utils/jwt.js';
export { hash, encrypt, decrypt } from './utils/crypto.js';
export { validate, validateEmail, validateToken } from './utils/validation.js';

/**
 * Credits & Attribution
 * 
 * FrontendRAFT is built on top of CSOP (Client-Side Orchestration Protocol)
 * CSOP provides the foundational capabilities:
 * - Storage (IndexedDB + Turso)
 * - Compute (Web Workers parallelization)
 * - Sync (Supabase Realtime)
 * 
 * Learn more about CSOP:
 * - GitHub: https://github.com/Nexus-Studio-CEO/CSOP
 * - CDN: https://cdn.jsdelivr.net/gh/Nexus-Studio-CEO/csop@v0.2.0/src/csop.js
 * - Author: DAOUDA Abdoul Anzize (nexusstudio100@gmail.com)
 * 
 * FrontendRAFT extends CSOP with RAFT Protocol features:
 * 1. Streaming API - Real-time data streams
 * 2. Smart Caching - Multi-level cache with TTL
 * 3. Auto-Batching - Request optimization
 * 4. Optimistic Updates - Instant UI feedback
 * 5. Query Language - GraphQL-like data fetching
 */

// Version info
export const VERSION = '0.1.0';
export const CSOP_VERSION = '0.2.0';
export const RELEASE_DATE = 'December 28, 2025';

console.log(`
╔═══════════════════════════════════════════════════════════╗
║            FrontendRAFT v${VERSION}                        ║
║   Reactive API for Frontend Transformation                ║
╠═══════════════════════════════════════════════════════════╣
║  Based on CSOP v${CSOP_VERSION}                               ║
║  https://github.com/Nexus-Studio-CEO/CSOP                 ║
╠═══════════════════════════════════════════════════════════╣
║  Author: DAOUDA Abdoul Anzize - Nexus Studio             ║
║  License: MIT                                             ║
║  Released: ${RELEASE_DATE}                     ║
╚═══════════════════════════════════════════════════════════╝
`);