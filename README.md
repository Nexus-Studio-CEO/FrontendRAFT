# 🚀 FrontendRAFT

**RAFT = Reactive API for Frontend Transformation**

Turn browsers into API servers with zero infrastructure cost. FrontendRAFT extends REST with streaming, caching, batching, optimistic updates, and query capabilities.

**Inspired by [CSOP](https://github.com/Nexus-Studio-CEO/CSOP)** (Client-Side Orchestration Protocol)

[![npm version](https://img.shields.io/npm/v/@tryboy869/frontendraft.svg)](https://www.npmjs.com/package/@tryboy869/frontendraft)
[![GitHub release](https://img.shields.io/github/v/release/Nexus-Studio-CEO/FrontendRAFT.svg)](https://github.com/Nexus-Studio-CEO/FrontendRAFT/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Table of Contents

- [What is RAFT?](#what-is-raft)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 What is RAFT?

RAFT is a protocol that transforms browsers into full-fledged API servers. It's **REST++** - maintaining 100% REST compatibility while adding powerful new capabilities:

### REST (What You Know)
- ✅ GET, POST, PUT, DELETE, PATCH
- ✅ Headers (Authorization, CORS)
- ✅ Status codes (200, 404, 500)
- ✅ JSON payloads
- ✅ JWT authentication
- ✅ Rate limiting

### RAFT (What's New)
- 🌊 **Streaming API** - Real-time via async generators
- 💾 **Smart Caching** - Multi-strategy with TTL
- ⚡ **Auto-Batching** - Parallel request optimization
- 🚀 **Optimistic Updates** - Instant UI with rollback
- 🔍 **Query Language** - GraphQL-like data fetching

**Result:** RAFT = REST + Real-time + Performance + Offline-first + $0 infrastructure

---

## ✨ Features

### 1. Streaming API
```javascript
for await (const message of raft.stream('channel', generator)) {
  console.log(message);
}
```

### 2. Smart Caching
```javascript
const data = await raft.executeWithCache('key', fetcher, ttl);
```

### 3. Auto-Batching
```javascript
const results = await raft.batchExecute(requests);
```

### 4. Optimistic Updates
```javascript
await raft.optimisticUpdate(entity, optimisticData, actualRequest);
```

### 5. Query Language
```javascript
const filtered = raft.queryData(data, {
  where: { age: { $gte: 25 } },
  select: ['name', 'email'],
  orderBy: ['-createdAt']
});
```

---

## 📦 Installation

### Method 1: NPM (Recommended)

```bash
npm install @tryboy869/frontendraft
```

```bash
yarn add @tryboy869/frontendraft
```

```bash
pnpm add @tryboy869/frontendraft
```

---

### Method 2: GitHub Packages

```bash
# Configure npm to use GitHub Packages
echo "@Nexus-Studio-CEO:registry=https://npm.pkg.github.com" >> .npmrc

# Install from GitHub
npm install @Nexus-Studio-CEO/frontendraft
```

Or download directly from [GitHub Releases](https://github.com/Nexus-Studio-CEO/FrontendRAFT/releases)

---

### Method 3: CDN (jsDelivr)

```html
<script type="module">
  import { FrontendRAFT } from 'https://cdn.jsdelivr.net/npm/@tryboy869/frontendraft@0.1.2/dist/index.js';
  
  const raft = new FrontendRAFT({ name: 'My API' });
  await raft.init();
</script>
```

**Specific version:**
```html
https://cdn.jsdelivr.net/npm/@tryboy869/frontendraft@0.1.2/dist/index.js
```

**Latest version:**
```html
https://cdn.jsdelivr.net/npm/@tryboy869/frontendraft@latest/dist/index.js
```

---

### Method 4: unpkg CDN

```html
<script type="module">
  import { FrontendRAFT } from 'https://unpkg.com/@tryboy869/frontendraft@0.1.2/dist/index.js';
  
  const raft = new FrontendRAFT({ name: 'My API' });
  await raft.init();
</script>
```

**Specific version:**
```html
https://unpkg.com/@tryboy869/frontendraft@0.1.2/dist/index.js
```

**Latest version:**
```html
https://unpkg.com/@tryboy869/frontendraft@latest/dist/index.js
```

---

### Method 5: Direct Download

Download the latest release:
- [GitHub Releases](https://github.com/Nexus-Studio-CEO/FrontendRAFT/releases/latest)
- [NPM Package](https://www.npmjs.com/package/@tryboy869/frontendraft)

```html
<script type="module">
  import { FrontendRAFT } from './path/to/frontendraft/dist/index.js';
</script>
```

---

## 🚀 Quick Start

### Basic Setup

```javascript
import { FrontendRAFT } from '@tryboy869/frontendraft';

// Create instance
const raft = new FrontendRAFT({
  name: 'My API',
  version: '1.0.0',
  autoRegister: true
});

// Initialize
await raft.init();

// Define routes
raft.get('/hello', async (req) => {
  return { message: 'Hello from RAFT!' };
});

raft.post('/users', async (req) => {
  const user = req.body;
  await raft.storage.save(`user:${user.id}`, user);
  return { success: true, user };
});

// Handle requests
const response = await raft.handle({
  method: 'GET',
  path: '/hello'
});
```

### With Authentication

```javascript
// Sign up
const { user, token } = await raft.auth.signup(
  'user@example.com',
  'password123',
  { plan: 'free', quota: 1000 }
);

// Login
const { user, token } = await raft.auth.login(
  'user@example.com',
  'password123'
);

// Protected route
raft.use(raft.auth.middleware());

raft.get('/profile', async (req) => {
  return { user: req.user };
});
```

---

## 🧠 Core Concepts

### 1. Storage Layer
Persistent storage using IndexedDB:

```javascript
await raft.storage.save('key', data);
const data = await raft.storage.get('key');
await raft.storage.delete('key');
const keys = await raft.storage.list('prefix:');
```

### 2. Compute Layer
Parallel computation with Web Workers:

```javascript
const result = await raft.compute.execute(
  (args) => args.numbers.reduce((a, b) => a + b, 0),
  { numbers: [1, 2, 3, 4, 5] }
);

const batchResults = await raft.compute.batch([
  { fn: task1, args: data1 },
  { fn: task2, args: data2 }
]);
```

### 3. Cache Layer
Intelligent caching with multiple strategies:

```javascript
raft.cache.set('key', value, ttl);
const value = raft.cache.get('key');
raft.cache.delete('key');

// Strategies: 'lru', 'lfu', 'fifo'
const stats = raft.cache.getStats();
```

### 4. Router
Express-like routing:

```javascript
raft.use(middleware);
raft.get('/path', handler);
raft.post('/path', handler);
raft.put('/path', handler);
raft.delete('/path', handler);
raft.patch('/path', handler);

// With parameters
raft.get('/users/:id', async (req) => {
  const userId = req.params.id;
  return { userId };
});
```

### 5. P2P Layer
WebRTC peer-to-peer communication:

```javascript
const peer = await raft.p2p.createPeer('peer-id');
await raft.p2p.createDataChannel('peer-id');
raft.p2p.send('peer-id', { message: 'Hello' });
raft.p2p.broadcast({ type: 'update', data: {...} });
```

---

## 📚 API Reference

See [RAFT_PROTOCOL.md](./docs/RAFT_PROTOCOL.md) for complete protocol specification.

### Main Class: FrontendRAFT

#### Constructor
```javascript
new FrontendRAFT(config)
```

**Config Options:**
- `name` (string, required) - API name
- `version` (string) - API version
- `autoRegister` (boolean) - Auto-register on CDN
- `auth` (object) - Authentication config
- `cache` (object) - Cache config
- `rateLimit` (object) - Rate limiting config

#### Methods

**init()**
```javascript
await raft.init()
```
Initialize all components. Must be called before using the API.

**HTTP Methods**
```javascript
raft.get(path, handler)
raft.post(path, handler)
raft.put(path, handler)
raft.delete(path, handler)
raft.patch(path, handler)
```

**Middleware**
```javascript
raft.use(middleware)
```

**Handle Request**
```javascript
await raft.handle(request)
```

**Streaming**
```javascript
for await (const msg of raft.stream(channel, generator, config)) {
  // Process message
}
```

**Subscribe**
```javascript
const unsubscribe = raft.subscribe(channel, callback)
```

**Cache**
```javascript
await raft.executeWithCache(key, fetcher, ttl)
```

**Batch**
```javascript
await raft.batchExecute(requests)
```

**Optimistic Update**
```javascript
await raft.optimisticUpdate(entity, optimisticData, actualRequest, options)
```

**Query**
```javascript
raft.queryData(data, options)
```

**Stats**
```javascript
await raft.getStats()
```

**Destroy**
```javascript
await raft.destroy()
```

---

## 💡 Examples

### Complete Todo API

```javascript
const raft = new FrontendRAFT({ name: 'Todo API' });
await raft.init();

// Create todo
raft.post('/todos', async (req) => {
  const todo = {
    id: Date.now(),
    ...req.body,
    createdAt: Date.now()
  };
  
  await raft.storage.save(`todo:${todo.id}`, todo);
  return { success: true, todo };
});

// Get all todos
raft.get('/todos', async (req) => {
  const keys = await raft.storage.list('todo:');
  const todos = [];
  
  for (const key of keys) {
    const todo = await raft.storage.get(key);
    todos.push(todo);
  }
  
  return { todos };
});

// Update todo
raft.put('/todos/:id', async (req) => {
  const todoId = req.params.id;
  const updates = req.body;
  
  let todo = await raft.storage.get(`todo:${todoId}`);
  todo = { ...todo, ...updates, updatedAt: Date.now() };
  
  await raft.storage.save(`todo:${todoId}`, todo);
  return { success: true, todo };
});

// Delete todo
raft.delete('/todos/:id', async (req) => {
  const todoId = req.params.id;
  await raft.storage.delete(`todo:${todoId}`);
  return { success: true };
});
```

### Real-time Notifications

```javascript
// Start notification stream
raft.get('/notifications/stream', async (req) => {
  const stream = raft.stream('notifications', async () => {
    return {
      type: 'notification',
      message: 'New update available',
      timestamp: Date.now()
    };
  }, { interval: 5000 });
  
  return { stream: 'started' };
});

// Subscribe to notifications
const unsubscribe = raft.subscribe('notifications', (message) => {
  console.log('Notification:', message);
});
```

### Optimistic UI Updates

```javascript
const currentData = { name: 'John', email: 'john@example.com' };

const result = await raft.optimisticUpdate(
  'user-profile',
  { ...currentData, name: 'Jane' }, // Optimistic
  async () => {
    // Actual API call
    return await fetch('/api/update', {
      method: 'POST',
      body: JSON.stringify({ name: 'Jane' })
    });
  },
  {
    originalData: currentData,
    onOptimistic: (data) => updateUI(data),
    onConfirm: (data) => console.log('Confirmed:', data),
    onRollback: (data) => console.log('Rolled back:', data)
  }
);
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

## 🙏 Credits

**Created by:** DAOUDA Abdoul Anzize (Nexus Studio)

**Inspired by:** [CSOP](https://github.com/Nexus-Studio-CEO/CSOP) - Client-Side Orchestration Protocol

**Learn more:**
- 📖 **GitHub:** https://github.com/Nexus-Studio-CEO/FrontendRAFT
- 📖 **NPM:** https://www.npmjs.com/package/@tryboy869/frontendraft
- 📖 **GitHub Packages:** https://github.com/Nexus-Studio-CEO/FrontendRAFT/packages
- 📖 **RAFT Protocol:** [docs/RAFT_PROTOCOL.md](./docs/RAFT_PROTOCOL.md)
- 📖 **Roadmap:** [docs/ROADMAP.md](./docs/ROADMAP.md)
- 📖 **CSOP:** https://github.com/Nexus-Studio-CEO/CSOP

---

## 🔗 Quick Links

### Installation
- [NPM Package](https://www.npmjs.com/package/@tryboy869/frontendraft)
- [GitHub Releases](https://github.com/Nexus-Studio-CEO/FrontendRAFT/releases)
- [GitHub Packages](https://github.com/Nexus-Studio-CEO?tab=packages)

### CDN Links
- [jsDelivr](https://cdn.jsdelivr.net/npm/@tryboy869/frontendraft@latest/dist/index.js)
- [unpkg](https://unpkg.com/@tryboy869/frontendraft@latest/dist/index.js)

### Documentation
- [Quick Start Guide](./docs/README.md)
- [RAFT Protocol](./docs/RAFT_PROTOCOL.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)
- [Roadmap](./docs/ROADMAP.md)

---

**🚀 Happy building with FrontendRAFT!**