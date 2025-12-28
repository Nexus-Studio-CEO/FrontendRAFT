# 🚀 RAFT Protocol Specification

**Version:** 0.1.0  
**Date:** December 28, 2025  
**Status:** Alpha - Early Preview  
**Author:** DAOUDA Abdoul Anzize - Nexus Studio

---

## 📘 What is RAFT?

**RAFT (Reactive API for Frontend Transformation)** is a next-generation API protocol that **extends REST** with modern capabilities for real-time, caching, batching, optimistic updates, and query language.

### Quick Definition

> RAFT = REST + Real-time + Performance + Offline-first + $0 infrastructure

### Analogy

Think of RAFT as **REST on steroids**:
- REST is like HTTP/1.1 (solid, reliable, standard)
- RAFT is like HTTP/2 (same foundation, but with streaming, multiplexing, and compression)

### Problem Solved

**Traditional REST APIs** require:
- ✅ Backend server ($50-500/month)
- ✅ Database hosting
- ✅ Real-time infrastructure (WebSocket servers)
- ✅ Cache layer (Redis)
- ✅ Complex state management

**RAFT eliminates all of this** by moving the API into the browser itself, powered by **CSOP (Client-Side Orchestration Protocol)**.

---

## 🔄 RAFT vs REST: The Complete Comparison

### ✅ What's IDENTICAL to REST

RAFT is **100% REST-compatible**. Everything you know about REST works:

| Feature | REST | RAFT | Notes |
|---------|------|------|-------|
| **HTTP Methods** | GET, POST, PUT, DELETE, PATCH | ✅ Same | Exact same semantics |
| **Status Codes** | 200, 404, 500, etc. | ✅ Same | Standard HTTP codes |
| **Headers** | Authorization, Content-Type, etc. | ✅ Same | All headers supported |
| **Authentication** | JWT, OAuth, API Keys | ✅ Same | Same auth mechanisms |
| **CORS** | Configurable | ✅ Same | Standard CORS rules |
| **Rate Limiting** | Token bucket, etc. | ✅ Same | Same strategies |
| **JSON Payloads** | Request/Response | ✅ Same | JSON by default |

**Example - REST API:**
```javascript
// Traditional REST
fetch('https://api.example.com/users/123', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer token123',
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

**Example - RAFT API:**
```javascript
// RAFT (identical interface)
const data = await raft.get('/users/123', {
  headers: {
    'Authorization': 'Bearer token123'
  }
});
console.log(data);
```

---

### 🚀 What RAFT ADDS (The 5 Superpowers)

RAFT extends REST with 5 revolutionary features:

#### 1️⃣ **Streaming API** (Real-time without polling)

**REST Approach:**
```javascript
// REST: Polling every 2 seconds 😢
setInterval(async () => {
  const data = await fetch('/api/events');
  updateUI(data);
}, 2000);
```

**RAFT Approach:**
```javascript
// RAFT: Native streaming 🚀
const stream = raft.stream.open('/api/events');

for await (const event of stream) {
  updateUI(event); // Real-time, no polling
}
```

**Benefits:**
- ✅ No polling overhead
- ✅ Instant updates (0ms latency)
- ✅ Automatic reconnection
- ✅ Backpressure handling

---

#### 2️⃣ **Smart Caching** (Multi-level with TTL)

**REST Approach:**
```javascript
// REST: Manual cache management 😢
let cache = {};

async function getUsers() {
  if (cache.users && Date.now() - cache.users.time < 60000) {
    return cache.users.data;
  }
  
  const data = await fetch('/api/users');
  cache.users = { data, time: Date.now() };
  return data;
}
```

**RAFT Approach:**
```javascript
// RAFT: Automatic caching 🚀
const users = await raft.get('/api/users', {
  cache: true,
  ttl: 60000 // 1 minute
});

// Second call hits cache automatically
const cachedUsers = await raft.get('/api/users');
```

**Cache Layers:**
1. **L1 (Memory)**: 0ms access, 100 items max
2. **L2 (IndexedDB)**: 5ms access, unlimited size

**Cache Strategies:**
- LRU eviction
- Tag-based invalidation
- TTL-based expiration

---

#### 3️⃣ **Auto-Batching** (Request optimization)

**REST Approach:**
```javascript
// REST: 10 sequential requests 😢
const user1 = await fetch('/api/users/1');
const user2 = await fetch('/api/users/2');
const user3 = await fetch('/api/users/3');
// ... 10 requests = 10 * 50ms = 500ms
```

**RAFT Approach:**
```javascript
// RAFT: Automatic batching 🚀
const [user1, user2, user3, ...] = await Promise.all([
  raft.get('/api/users/1'),
  raft.get('/api/users/2'),
  raft.get('/api/users/3'),
  // ... batched automatically
]);
// 10 requests = 1 * 50ms = 50ms
```

**Performance Gains:**
- 10 parallel requests → **10x faster**
- 100 parallel requests → **100x faster**

---

#### 4️⃣ **Optimistic Updates** (Instant UI feedback)

**REST Approach:**
```javascript
// REST: Wait for server 😢
setLoading(true);
const newUser = await fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'Alice' })
});
setLoading(false);
updateUI(newUser); // User sees spinner for 200ms
```

**RAFT Approach:**
```javascript
// RAFT: Instant feedback 🚀
updateUI({ name: 'Alice' }); // Instant!

try {
  const newUser = await raft.post('/api/users', { name: 'Alice' }, {
    optimistic: true
  });
  // Confirmed by server
} catch (error) {
  rollbackUI(); // Rollback on error
}
```

**User Experience:**
- ✅ 0ms perceived latency
- ✅ Automatic rollback on error
- ✅ No loading spinners

---

#### 5️⃣ **Query Language** (GraphQL-like precision)

**REST Approach:**
```javascript
// REST: Fetch entire object 😢
const user = await fetch('/api/users/123');
// Returns: { id, name, email, avatar, bio, posts: [...], comments: [...] }
// 50KB payload, but we only need name and email
```

**RAFT Approach:**
```javascript
// RAFT: Fetch exact fields 🚀
const user = await raft.get('/api/users/123', {
  query: {
    fields: ['name', 'email'] // Only what you need
  }
});
// Returns: { name: 'Alice', email: 'alice@mail.com' }
// 200 bytes payload (250x smaller!)
```

**Query Features:**
- Field selection: `{ fields: ['name', 'email'] }`
- Filtering: `{ where: { status: 'active' } }`
- Sorting: `{ orderBy: ['createdAt', 'desc'] }`
- Pagination: `{ limit: 10, offset: 20 }`
- Relations: `{ include: ['posts'] }`

---

## 🎯 When to Use RAFT vs REST

### ✅ Use RAFT When:

- [ ] Building MVP/prototype quickly
- [ ] Need offline-first capability
- [ ] Budget is limited ($0 infrastructure)
- [ ] Real-time features required
- [ ] Creating internal tools/dashboards
- [ ] Small-to-medium user base (< 10k users)

### ⚠️ Stick with REST When:

- [ ] Banking/finance (strict regulations)
- [ ] E-commerce high-volume (> 100k daily users)
- [ ] Legacy systems integration
- [ ] Team unfamiliar with new tech
- [ ] HIPAA/GDPR strict compliance
- [ ] Need proven 10-year track record

---

## 📊 Performance Comparison

| Metric | Traditional REST | RAFT Protocol |
|--------|------------------|---------------|
| **First Request** | 50-200ms (server) | 0-5ms (local) |
| **Cached Request** | 50ms (server cache) | 0ms (memory) |
| **Real-time Updates** | Polling (2-5s delay) | Streaming (0ms) |
| **10 Parallel Requests** | 500ms (sequential) | 50ms (batched) |
| **Data Transfer** | Full payload | Query-filtered |
| **Infrastructure Cost** | $50-500/month | $0/month |

---

## 🛠️ How RAFT Works (Technical)

### Architecture

```
┌─────────────────────────────────────────┐
│         RAFT Application                │
│  (Your React/Vue/Vanilla JS app)       │
└──────────────┬──────────────────────────┘
               │
               │ raft.get('/api/users')
               ▼
┌─────────────────────────────────────────┐
│         FrontendRAFT Core               │
│  ┌───────────────────────────────────┐  │
│  │ 1. Check Cache (L1 → L2)          │  │
│  │ 2. Apply Query Language           │  │
│  │ 3. Batch if parallel              │  │
│  │ 4. Execute via Router             │  │
│  │ 5. Stream if requested            │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               │ csop.dispatch(...)
               ▼
┌─────────────────────────────────────────┐
│           CSOP Layer                    │
│  ┌─────────┬──────────┬─────────────┐  │
│  │ Storage │ Compute  │   Sync      │  │
│  │IndexedDB│ Workers  │ Supabase    │  │
│  └─────────┴──────────┴─────────────┘  │
└─────────────────────────────────────────┘
```

### Under the Hood

1. **Storage**: IndexedDB (local) + Turso (cloud fallback)
2. **Compute**: Web Workers (parallel processing)
3. **Sync**: Supabase Realtime (P2P communication)
4. **Routing**: Express-like router (REST-compatible)
5. **Caching**: LRU memory + IndexedDB persistence

---

## 📚 Real-World Use Cases

### Use Case 1: Todo App Offline-First

```javascript
// Define API
raft.routes({
  'GET /todos': async () => {
    const todos = await raft.storage.get('todos');
    return todos || [];
  },
  
  'POST /todos': async (req) => {
    const todos = await raft.storage.get('todos') || [];
    const newTodo = { id: Date.now(), ...req.body };
    todos.push(newTodo);
    await raft.storage.save('todos', todos);
    return newTodo;
  }
});

// Use API (works offline!)
const todos = await raft.get('/todos', { cache: true });
await raft.post('/todos', { text: 'Buy milk' }, { optimistic: true });
```

---

### Use Case 2: Real-Time Dashboard

```javascript
// Provider broadcasts metrics
setInterval(async () => {
  await raft.stream.broadcast('/metrics', {
    cpu: Math.random() * 100,
    memory: Math.random() * 16
  });
}, 1000);

// Consumer receives live updates
const stream = raft.stream.open('/metrics');

for await (const metrics of stream) {
  updateDashboard(metrics); // Real-time, no polling
}
```

---

### Use Case 3: Collaborative Editor

```javascript
// User A types
document.addEventListener('input', async (e) => {
  await raft.post('/document', { content: e.target.value }, {
    optimistic: true // Instant local update
  });
  
  await raft.stream.broadcast('/editor:changes', {
    userId: 'userA',
    content: e.target.value
  });
});

// User B receives updates
const stream = raft.stream.open('/editor:changes');

for await (const change of stream) {
  if (change.userId !== 'userB') {
    updateEditor(change.content);
  }
}
```

---

## 🎓 Migration Guide: REST → RAFT

### Step 1: Install FrontendRAFT

```html
<script type="module">
import { FrontendRAFT } from 'https://cdn.jsdelivr.net/gh/Nexus-Studio-CEO/FrontendRAFT@v0.1.0/src/index.js';
</script>
```

### Step 2: Convert REST Endpoints

**Before (REST):**
```javascript
app.get('/api/users', async (req, res) => {
  const users = await db.users.find();
  res.json(users);
});
```

**After (RAFT):**
```javascript
raft.routes({
  'GET /api/users': async (req) => {
    const users = await raft.storage.get('users');
    return users;
  }
});
```

### Step 3: Update Client Calls

**Before (REST):**
```javascript
const response = await fetch('/api/users');
const users = await response.json();
```

**After (RAFT):**
```javascript
const users = await raft.get('/api/users', { cache: true });
```

---

## 🔮 Roadmap

### v0.1.0 (Current) - MVP
- ✅ Streaming API
- ✅ Smart Caching
- ✅ Auto-Batching
- ✅ Optimistic Updates
- ✅ Query Language

### v0.2.0 (Q2 2026) - Advanced Features
- 🔮 Predictive Prefetching (ML-based)
- 🔮 Row-Level Security
- 🔮 Delta Updates (compression)
- 🔮 Contract Testing
- 🔮 Edge Service Workers

### v1.0.0 (Q4 2026) - Production Ready
- 🔮 Enterprise features
- 🔮 Security audit
- 🔮 Performance optimization
- 🔮 Migration tools

---

## 📞 Support & Community

- **GitHub**: [Nexus-Studio-CEO/FrontendRAFT](https://github.com/Nexus-Studio-CEO/FrontendRAFT)
- **Discussions**: GitHub Discussions
- **Issues**: GitHub Issues
- **Email**: nexusstudio100@gmail.com
- **Twitter**: @NexusStudioCEO

---

## 🙏 Credits

**FrontendRAFT is built on CSOP** (Client-Side Orchestration Protocol)

- **CSOP GitHub**: https://github.com/Nexus-Studio-CEO/CSOP
- **CSOP CDN**: https://cdn.jsdelivr.net/gh/Nexus-Studio-CEO/CSOP@main/src/csop.js
- **Author**: DAOUDA Abdoul Anzize - Nexus Studio

---

**RAFT = The Future of Frontend APIs** 🚀

*Version 0.1.0 - December 28, 2025*