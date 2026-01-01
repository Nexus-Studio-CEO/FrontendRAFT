# ⚡ FrontendRAFT

**Reactive API for Frontend Transformation**

Build and deploy decentralized APIs directly from your browser. Zero infrastructure, zero cost, infinite possibilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](CHANGELOG.md)
[![Based on CSOP](https://img.shields.io/badge/based%20on-CSOP-purple.svg)](https://github.com/Nexus-Studio-CEO/CSOP)

---

## 🎯 What is RAFT?

**RAFT (Reactive API for Frontend Transformation)** is a next-generation protocol that extends REST with real-time capabilities, intelligent caching, and zero-infrastructure deployment.

### The Problem

Creating APIs traditionally requires:
- Backend server ($50-500/month)
- Database hosting ($20-100/month)
- DevOps expertise (weeks of learning)
- Complex deployment pipelines (hours of setup)

### The Solution

FrontendRAFT enables you to:
- ✅ Build APIs in your browser (no server needed)
- ✅ Deploy in one click (to decentralized CDN)
- ✅ Scale automatically (P2P + edge caching)
- ✅ Pay nothing ($0/month infrastructure)

---

## 🚀 Quick Start

### 1. Open the Platform

Download `index.html` and open in your browser. That's it!

Or visit: `https://frontendraft.dev` _(coming soon)_

### 2. Create Your First API

**No-Code Mode:**
1. Click "➕ New API"
2. Add endpoints visually
3. Configure auth strategy
4. Click "Deploy"

**Code Mode:**
```javascript
// Switch to code mode
router.get('/hello', async (req) => {
    return {
        message: 'Hello from FrontendRAFT!',
        timestamp: Date.now()
    };
});
```

### 3. Deploy & Share

```
Your API is live at:
https://raft-cdn.io/api_abc123

Share with anyone instantly!
```

---

## ✨ Features

### 5 Core RAFT Features (v0.1.0)

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Streaming** | Real-time data via async generators | No polling needed |
| **Smart Caching** | Multi-level with TTL | 10x faster responses |
| **Auto-Batching** | Groups parallel requests | N requests → 1 network call |
| **Optimistic Updates** | Instant UI with rollback | Better UX |
| **Query Language** | GraphQL-like syntax | Fetch exact data needed |

### Platform Features

- 🎨 **3 Build Modes**: No-code → Low-code → Code
- 📊 **Real-time Logs**: Platform-wide + per-project
- 💾 **Local Storage**: IndexedDB for persistence
- 🌐 **P2P First**: WebRTC for low latency
- 🔒 **Auth Built-in**: JWT & API keys
- 📱 **Mobile-First**: Responsive design

---

## 📖 Documentation

- [RAFT Protocol Spec](docs/RAFT_PROTOCOL.md) - Core protocol details
- [Getting Started Guide](docs/GETTING_STARTED.md) - Step-by-step tutorial
- [Roadmap](docs/ROADMAP.md) - Future features
- [Contributing](docs/CONTRIBUTING.md) - How to contribute

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│     FrontendRAFT Platform (HTML)   │
├─────────────────────────────────────┤
│  Visual Builder | Code Editor      │
│  Deploy Manager | Logger            │
├─────────────────────────────────────┤
│         RAFT Core Engine            │
│  ┌───────────┬──────────┬─────────┐ │
│  │ Streaming │ Caching  │Batching │ │
│  ├───────────┼──────────┼─────────┤ │
│  │Optimistic │  Query   │  Auth   │ │
│  └───────────┴──────────┴─────────┘ │
├─────────────────────────────────────┤
│   Browser APIs (IndexedDB, WebRTC) │
└─────────────────────────────────────┘
```

---

## 🎓 Examples

### Example 1: Simple Todo API

```javascript
// GET /todos - List all
router.get('/todos', async (req) => {
    const todos = await CacheLayer.getOrSet('todos', async () => {
        return [
            { id: 1, title: 'Learn RAFT', done: false },
            { id: 2, title: 'Build API', done: true }
        ];
    });
    return { todos };
});

// POST /todos - Create new
router.post('/todos', async (req) => {
    const todo = {
        id: Date.now(),
        title: req.body.title,
        done: false
    };
    
    // Optimistic update
    return await OptimisticEngine.execute(
        () => { /* Update UI */ },
        async () => { /* Save to storage */ return todo; },
        () => { /* Rollback UI */ }
    );
});
```

### Example 2: Real-time Chat

```javascript
// Streaming messages
router.get('/messages/stream', async (req) => {
    const stream = StreamManager.createStream('chat', null);
    
    stream.subscribe((message) => {
        // Send to client
    });
    
    return { stream: stream.id };
});

// Send message
router.post('/messages', async (req) => {
    await StreamManager.push(streamId, {
        user: req.user.name,
        text: req.body.text,
        timestamp: Date.now()
    });
    
    return { success: true };
});
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repo
git clone https://github.com/Nexus-Studio-CEO/FrontendRAFT.git

# Open in browser
open index.html

# Or use live server
npx live-server
```

---

## 🗺️ Roadmap

### v0.2.0 (Q1 2026)
- 🔮 Predictive Prefetching (ML-based)
- 🔐 Row-Level Security
- 📦 Delta Updates (compression)

### v1.0.0 (Q2 2026)
- ⚡ Edge Service Workers
- 🧪 Contract Testing
- 📊 Analytics Dashboard

See full [ROADMAP.md](docs/ROADMAP.md)

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

## 🙏 Credits

**Created by:** DAOUDA Abdoul Anzize  
**Company:** Nexus Studio  
**Contact:** nexusstudio100@gmail.com

**Based on CSOP:** [https://github.com/Nexus-Studio-CEO/CSOP](https://github.com/Nexus-Studio-CEO/CSOP)

---

## 🌟 Star Us!

If you find FrontendRAFT useful, please star this repo! It helps others discover the project.

---

**Built with ❤️ using Browser APIs**