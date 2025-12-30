/**
 * FrontendRAFT - Main Export
 * 
 * RAFT = Reactive API for Frontend Transformation
 * Turn browsers into API servers with zero infrastructure cost
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 * 
 * @example
 * import { FrontendRAFT } from '@nexusstudio/frontendraft';
 * 
 * const raft = new FrontendRAFT({ name: 'My API' });
 * await raft.init();
 * 
 * raft.get('/hello', async (req) => {
 *   return { message: 'Hello from RAFT!' };
 * });
 */

export { FrontendRAFT } from './core/FrontendRAFT.js';

export { StorageLayer } from './core/StorageLayer.js';
export { ComputeLayer } from './core/ComputeLayer.js';
export { CacheLayer } from './core/CacheLayer.js';
export { StreamManager } from './core/StreamManager.js';
export { BatchManager } from './core/BatchManager.js';
export { OptimisticEngine } from './core/OptimisticEngine.js';
export { QueryEngine } from './core/QueryEngine.js';
export { AuthLayer } from './core/AuthLayer.js';
export { Router } from './core/Router.js';
export { P2PLayer } from './core/P2PLayer.js';
export { CDNClient } from './core/CDNClient.js';

export { Crypto } from './utils/crypto.js';
export { JWT } from './utils/jwt.js';
export { Validation } from './utils/validation.js';
export { Validator } from './types/validator.js';

export * from './types/index.js';

export const VERSION = '0.1.0';
export const PROTOCOL = 'RAFT';
export const CREDITS = {
  author: 'DAOUDA Abdoul Anzize',
  company: 'Nexus Studio',
  inspiration: 'CSOP - Client-Side Orchestration Protocol',
  csop_repo: 'https://github.com/Nexus-Studio-CEO/CSOP',
  raft_repo: 'https://github.com/Nexus-Studio-CEO/FrontendRAFT'
};

console.log(`
╔═══════════════════════════════════════════════════════════╗
║              🚀 FrontendRAFT v${VERSION}                     ║
║     Reactive API for Frontend Transformation              ║
╠═══════════════════════════════════════════════════════════╣
║  Inspired by CSOP (Client-Side Orchestration Protocol)    ║
║  Created by: ${CREDITS.author}                    ║
║  Company: ${CREDITS.company}                                   ║
╠═══════════════════════════════════════════════════════════╣
║  Features:                                                 ║
║  ✅ Streaming API (real-time)                             ║
║  ✅ Smart Caching (LRU/LFU/FIFO)                          ║
║  ✅ Auto-Batching (performance)                           ║
║  ✅ Optimistic Updates (instant UI)                       ║
║  ✅ Query Language (GraphQL-like)                         ║
╠═══════════════════════════════════════════════════════════╣
║  Learn more:                                               ║
║  📖 CSOP: ${CREDITS.csop_repo.padEnd(41)} ║
║  📖 RAFT: ${CREDITS.raft_repo.padEnd(41)} ║
╚═══════════════════════════════════════════════════════════╝
`);

export default FrontendRAFT;