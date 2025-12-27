# FrontendRAFT

**RAFT = Reactive API for Frontend Transformation**

Transform any frontend into a full-featured API server with zero infrastructure cost.

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/Nexus-Studio-CEO/FrontendRAFT)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Based on CSOP](https://img.shields.io/badge/based%20on-CSOP-orange.svg)](https://github.com/Nexus-Studio-CEO/CSOP)

---

## 🚀 Quick Start

```bash
npm install @frontendraft/core
```

```typescript
import { FrontendRAFT } from '@frontendraft/core';

const raft = new FrontendRAFT({
  name: "My API"
});

await raft.init();

raft.get('/hello', async (req) => {
  return { message: 'Hello World!' };
});

const apiId = await raft.publish();
console.log('API available at:', apiId);
```

---

## 🎯 What is RAFT?

RAFT is a **next-generation API protocol** that extends REST with:

- ✅ **Streaming** - Real-time updates without polling
- ✅ **Smart Caching** - Multi-level cache with TTL
- ✅ **Auto-Batching** - Automatic request grouping
- ✅ **Optimistic Updates** - Instant UI feedback
- ✅ **Query Language** - GraphQL-like data fetching

All with **$0 infrastructure cost**.

---

## 💡 Why RAFT?

| Traditional API | FrontendRAFT |
|----------------|--------------|
| Backend + Database + Cloud | Just your frontend |
| $50-500/month | $0/month |
| 2-4 weeks setup | 1-2 days |
| 4+ technologies | 1 import |
| 50-200ms latency | 0-5ms (local) |

---

## 📚 Features

### 1. REST-Compatible Routing

```typescript
raft.get('/users', async (req) => {
  return { users: [...] };
});

raft.post('/users', async (req) => {
  const user = req.body;
  await raft.storage.save(`user:${user.id}`, user);
  return { user };
});

raft.use(async (req, next) => {
  console.log(req.method, req.path);
  return next();
});
```

### 2. JWT Authentication

```typescript
const token = await raft.auth.signup('user@email.com', 'password', {
  plan: 'free',
  quota: 1000
});

raft.use(async (req, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  req.user = await raft.auth.validateToken(token);
  return next();
});
```

### 3. Real-time Streaming

```typescript
// Subscribe
const sub = await raft.stream.subscribe('updates', (data) => {
  console.log('Update:', data);
});

// Broadcast
await raft.stream.broadcast('updates', { message: 'New update!' });

// Async generator
for await (const msg of raft.stream.stream('chat')) {
  console.log('Message:', msg);
}
```

### 4. Smart Caching

```typescript
// Set with TTL
await raft.cache.set('users', data, { ttl: 60000 });

// Get
const users = await raft.cache.get('users');

// Tag-based invalidation
await raft.cache.set('user:123', data, { tags: ['users'] });
await raft.cache.invalidateTag('users');

// Memoization
const cachedFetch = raft.cache.memoize(fetchData, { ttl: 5 * 60 * 1000 });
```

### 5. Auto-Batching

```typescript
// These 3 requests are automatically batched
const [users, posts, comments] = await Promise.all([
  raft.batch.fetch('GET', '/users'),
  raft.batch.fetch('GET', '/posts'),
  raft.batch.fetch('GET', '/comments')
]);

// Result: 1 network request instead of 3
```

### 6. Optimistic Updates

```typescript
await raft.optimistic.update(
  'posts',
  postId,
  { liked: true },
  () => fetch('/api/posts/like', { method: 'POST' }),
  {
    rollbackOnError: true,
    onSuccess: (result) => console.log('Liked!'),
    onError: () => alert('Failed')
  }
);

// UI updates instantly, real request in background
```

### 7. Query Language

```typescript
const users = await raft.query.query('users', {
  select: ['name', 'email'],
  where: {
    age: { $gte: 18, $lte: 65 },
    country: 'USA'
  },
  orderBy: { field: 'name', direction: 'asc' },
  limit: 10,
  offset: 0
});
```

---

## 🎨 React Integration

```typescript
import { useRAFT, useQuery, useStream } from '@frontendraft/core/react';

function App() {
  const { raft, ready } = useRAFT(raftInstance);
  
  const { data: users, loading } = useQuery(raft, 'users', {
    where: { active: true }
  });
  
  const { messages, broadcast } = useStream(raft, 'chat');
  
  if (!ready) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Users: {users.length}</h1>
      <button onClick={() => broadcast({ text: 'Hello!' })}>
        Send Message
      </button>
    </div>
  );
}
```

---

## 🎨 Vue Integration

```typescript
import { useRAFT, useQuery, useStream } from '@frontendraft/core/vue';

export default {
  setup() {
    const { raft, ready } = useRAFT(raftInstance);
    
    const { data: users, loading } = useQuery(raft, 'users', {
      where: { active: true }
    });
    
    const { messages, broadcast } = useStream(raft, 'chat');
    
    return { ready, users, loading, messages, broadcast };
  }
}
```

---

## 📖 Documentation

- [RAFT Protocol Specification](./RAFT_PROTOCOL.md)
- [Getting Started Guide](./GETTING_STARTED.md)
- [Roadmap](./ROADMAP.md)
- [API Reference](#) (coming soon)

---

## 🏗️ Built With

**FrontendRAFT** is built on top of [CSOP](https://github.com/Nexus-Studio-CEO/CSOP) (Client-Side Orchestration Protocol).

CSOP provides:
- Storage (IndexedDB + Turso fallback)
- Compute (Web Workers parallelization)
- Sync (Supabase Realtime)

FrontendRAFT adds:
- REST-compatible API layer
- JWT authentication
- 5 advanced features (streaming, caching, batching, optimistic, query)

---

## 🎯 Use Cases

- ✅ MVP/Prototypes
- ✅ Personal projects
- ✅ Indie maker tools
- ✅ Internal company tools
- ✅ Offline-first apps
- ✅ Real-time dashboards
- ✅ Collaborative editors

---

## 📊 Performance

| Metric | Traditional REST | FrontendRAFT |
|--------|-----------------|--------------|
| Infrastructure Cost | $50-500/month | $0/month |
| Latency (cached) | 50-200ms | 0-5ms |
| Setup Time | 2-4 weeks | 1-2 days |
| Offline Support | Complex | Native |
| Real-time | Polling/WebSocket | Built-in |

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

---

## 📄 License

MIT License - Copyright (c) 2025 DAOUDA Abdoul Anzize - Nexus Studio

---

## 👤 Author

**DAOUDA Abdoul Anzize**  
Founder & CEO - Nexus Studio  
Email: nexusstudio100@gmail.com  
GitHub: [@Nexus-Studio-CEO](https://github.com/Nexus-Studio-CEO)

---

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

**Built with ❤️ by Nexus Studio - Empowering Creators with Zero Infrastructure**