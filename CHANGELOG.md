# Changelog

All notable changes to FrontendRAFT will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2025-12-28

### Added
- 🎉 Initial release of FrontendRAFT
- ⚡ Core RAFT protocol implementation
- 💾 Storage Layer with IndexedDB
- 🔧 Compute Layer with Web Workers parallelization
- 📦 Cache Layer with LRU/LFU/FIFO strategies
- 🌊 Stream Manager for real-time async generators
- ⚡ Batch Manager for automatic request batching
- 🚀 Optimistic Engine for instant UI updates
- 🔍 Query Engine with GraphQL-like syntax
- 🔐 Auth Layer with JWT authentication
- 🛣️ Router with Express-like API
- 🔗 P2P Layer for WebRTC communication
- 🌐 CDN Client for API registration
- ⚛️ React plugin with hooks
- 💚 Vue 3 plugin with composables
- 🔒 Security validation (SQL injection, XSS, path traversal)
- 📚 Complete documentation (README, RAFT_PROTOCOL, ROADMAP, CONTRIBUTING)
- 🎨 Basic HTML example
- 🧪 Type definitions and validators
- 🛠️ Crypto utilities (hashing, encryption, JWT)
- 📝 JSDoc documentation for all public APIs

### Features

#### Streaming API
- Async generator-based streaming
- Channel subscription system
- Multiple subscriber support
- Configurable intervals

#### Smart Caching
- LRU (Least Recently Used) strategy
- LFU (Least Frequently Used) strategy
- FIFO (First In, First Out) strategy
- TTL (Time To Live) support
- Hit rate tracking
- Cache warmup capability

#### Auto-Batching
- Automatic request batching within time windows
- Configurable batch size and window
- Request deduplication
- Priority management

#### Optimistic Updates
- Instant UI updates
- Automatic rollback on failure
- Snapshot/restore capability
- Success/failure callbacks

#### Query Language
- WHERE clause with operators ($eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $contains, $startsWith, $endsWith)
- SELECT for field projection
- ORDER BY for sorting
- LIMIT and OFFSET for pagination
- Aggregations (count, sum, avg, min, max)
- GROUP BY for data grouping
- JOIN support (inner, left)

### Technical Details
- **Language:** JavaScript (ES2020)
- **Module System:** ES Modules
- **Browser APIs:** IndexedDB, Web Workers, WebRTC, Crypto API
- **Bundle Size:** ~50KB minified
- **Dependencies:** Zero runtime dependencies

### Credits
- **Author:** DAOUDA Abdoul Anzize
- **Company:** Nexus Studio
- **Inspiration:** CSOP (Client-Side Orchestration Protocol)
- **License:** MIT

---

## [Unreleased]

### Planned for v0.2.0
- Predictive prefetching with ML
- Row-level security policies
- Delta updates for bandwidth optimization
- Contract testing and versioning
- Edge Service Workers support

See [ROADMAP.md](docs/ROADMAP.md) for full future plans.

---

[0.1.0]: https://github.com/Nexus-Studio-CEO/FrontendRAFT/releases/tag/v0.1.0
[Unreleased]: https://github.com/Nexus-Studio-CEO/FrontendRAFT/compare/v0.1.0...HEAD