# 📝 Changelog

All notable changes to FrontendRAFT will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2025-12-28

### 🎉 Initial Release - MVP

First public alpha release of FrontendRAFT (Reactive API for Frontend Transformation).

### ✨ Added

#### Core Features
- **Streaming API** - Real-time data streams via async generators
- **Smart Caching** - Multi-level cache (L1 memory + L2 IndexedDB) with LRU eviction
- **Auto-Batching** - Automatic request grouping for parallel execution
- **Optimistic Updates** - Instant UI feedback with automatic rollback
- **Query Language** - GraphQL-like field selection, filtering, sorting, pagination

#### Infrastructure
- REST-compatible HTTP routing (GET, POST, PUT, DELETE, PATCH)
- Express-style middleware system
- JWT-based authentication with signup/login
- CORS configuration support
- Token bucket rate limiting
- Path parameter extraction (`/users/:id`)

#### Storage
- CSOP-powered IndexedDB wrapper
- Automatic key-value persistence
- List/filter capabilities
- Error handling and fallbacks

#### Compute
- Web Workers parallelization via CSOP
- Custom function execution
- Batch processing
- Array mapping utilities

#### Sync
- Real-time P2P communication via CSOP/Supabase
- Broadcast/subscribe patterns
- Presence tracking
- Channel management

#### Plugins
- **React** - `useQuery`, `useMutation`, `useStream`, `useAuth` hooks
- **Vue 3** - Composables for all core features
- **RAFTProvider** / `createRAFT` context providers

#### Utilities
- JWT creation and verification
- Password hashing (SHA-256)
- AES-GCM encryption/decryption
- Email/password/token validation
- XSS sanitization
- Schema validation

### 📚 Documentation

- Complete RAFT Protocol specification
- Getting Started guide (15-minute tutorial)
- Comprehensive README with examples
- Roadmap through v1.0.0
- Contributing guidelines
- MIT License

### 🎯 Examples

- Basic notes app (CRUD operations)
- Real-time streaming
- Authentication flow
- React integration
- Vue integration

### 🔧 Technical

- Pure JavaScript (ES modules)
- Zero dependencies (except CSOP peer dependency)
- Browser-native APIs only
- CDN-ready distribution
- < 50KB total bundle size

### 🙏 Credits

- Built on **CSOP v0.2.0** (Client-Side Orchestration Protocol)
- Author: DAOUDA Abdoul Anzize - Nexus Studio
- Contact: nexusstudio100@gmail.com

---

## [Unreleased]

### Planned for v0.2.0 (Q2 2026)

- Predictive prefetching (ML-based)
- Row-level security
- Delta updates (compression)
- Contract testing
- Edge Service Workers

---

## Version History

- **0.1.0** (2025-12-28) - Initial MVP release
- **0.2.0** (Target Q2 2026) - Advanced features
- **0.3.0** (Target Q3 2026) - Enterprise features
- **1.0.0** (Target Q4 2026) - Production ready

---

## Links

- **Repository**: https://github.com/Nexus-Studio-CEO/FrontendRAFT
- **CSOP**: https://github.com/Nexus-Studio-CEO/CSOP
- **Issues**: https://github.com/Nexus-Studio-CEO/FrontendRAFT/issues
- **Discussions**: https://github.com/Nexus-Studio-CEO/FrontendRAFT/discussions

---

**FrontendRAFT - The Future of Frontend APIs** 🚀