# RAFT Protocol Specification

**RAFT = Reactive API for Frontend Transformation**

Version: 0.1.0  
Date: December 28, 2025  
Author: DAOUDA Abdoul Anzize (Nexus Studio)

---

## 📖 Table of Contents

1. [What is RAFT?](#what-is-raft)
2. [RAFT vs REST](#raft-vs-rest)
3. [Core Features](#core-features)
4. [Protocol Specification](#protocol-specification)
5. [Use Cases](#use-cases)
6. [When to Use RAFT](#when-to-use-raft)

---

## 🎯 What is RAFT?

### Definition

RAFT is a next-generation API protocol that **extends REST** with reactive capabilities. It maintains 100% backward compatibility with REST while adding five superpowers for modern web applications.

### Analogy

Think of RAFT as **REST on steroids**:

- **REST** = HTTP with structure (GET, POST, status codes)
- **RAFT** = REST + Real-time + Performance + Offline-first

### Problem Solved

Traditional REST APIs have limitations:
- ❌ No real-time updates (requires polling)
- ❌ No built-in caching strategy
- ❌ Multiple requests = multiple round-trips
- ❌ UI blocks waiting for server
- ❌ Fetches entire resources (over-fetching)

RAFT solves all of these:
- ✅ Real-time streaming built-in
- ✅ Intelligent multi-strategy caching
- ✅ Automatic request batching
- ✅ Optimistic updates (instant UI)
- ✅ GraphQL-like precise data fetching

---

## 🔄 RAFT vs REST

### Similarities (100% Compatible)

| Feature | REST | RAFT | Notes |
|---------|------|------|-------|
| HTTP Methods | ✅ GET, POST, PUT, DELETE | ✅ GET, POST, PUT, DELETE | Identical |
| Status Codes | ✅ 200, 404, 500, etc. | ✅ 200, 404, 500, etc. | Identical |
| Headers | ✅ Authorization, CORS | ✅ Authorization, CORS | Identical |
| JSON Payloads | ✅ request/response | ✅ request/response | Identical |
| Authentication | ✅ JWT, OAuth, API Keys | ✅ JWT, OAuth, API Keys | Identical |
| Rate Limiting | ✅ Token bucket | ✅ Token bucket | Identical |

**Verdict:** Every REST API is a valid RAFT API.

---

### Differences (New Capabilities)

| Feature | REST | RAFT | Impact |
|---------|------|------|--------|
| **Real-time** | ❌ Polling required | ✅ Async generators | No more `setInterval()` |
| **Caching** | ⚠️ Manual (headers) | ✅ Built-in (LRU/LFU/FIFO) | Automatic performance |
| **Batching** | ❌ Manual | ✅ Auto-batching | Latency / N requests |
| **Optimistic UI** | ❌ Manual | ✅ Built-in rollback | Instant UX |
| **Query Language** | ❌ Fixed endpoints | ✅ GraphQL-like | No over-fetching |
| **Infrastructure** | 💰 Server required | ✅ Browser-only | $0/month |

**Verdict:** RAFT = REST++ with zero breaking changes.

---

### Side-by-Side Comparison

#### REST: Polling for Real-time

```javascript
// ❌ REST: Manual polling (inefficient)
setInterval(async () => {
  const response = await fetch('/api/notifications');
  const data = await response.json();
  updateUI(data);
}, 5000); // Check every 5 seconds
```

#### RAFT: Native Streaming

```javascript
// ✅ RAFT: Native streaming (efficient)
for await (const notification of raft.stream('notifications', fetchNew)) {
  updateUI(notification);
} // Pushes only when data changes
```

---

#### REST: Manual Caching

```javascript
// ❌ REST: Manual cache management
let cache = {};

async function fetchWithCache(key) {
  if (cache[key] && Date.now() - cache[key].time < 60000) {
    return cache[key].data;
  }
  
  const response = await fetch(`/api/${key}`);
  const data = await response.json();
  
  cache[key] = { data, time: Date.now() };
  return data;
}
```

#### RAFT: Built-in Smart Caching

```javascript
// ✅ RAFT: Automatic caching
const data = await raft.executeWithCache(
  'key', 
  async () => fetch('/api/data'),
  60000 // TTL
);
// Automatically handles: TTL, eviction, strategies
```

---

#### REST: Multiple Round-trips

```javascript
// ❌ REST: 3 separate requests (3x latency)
const user = await fetch('/api/user/1');
const posts = await fetch('/api/posts?userId=1');
const comments = await fetch('/api/comments?userId=1');

// Total latency: 300ms + 300ms + 300ms = 900ms
```

#### RAFT: Auto-batching

```javascript
// ✅ RAFT: Batched in single window
const results = await raft.batchExecute([
  { handler: () => fetch('/api/user/1') },
  { handler: () => fetch('/api/posts?userId=1') },
  { handler: () => fetch('/api/comments?userId=1') }
]);

// Total latency: max(300ms, 300ms, 300ms) = 300ms
// 3x faster!
```

---

#### REST: Blocking UI

```javascript
// ❌ REST: UI waits for server
async function likePost(postId) {
  showSpinner(); // UI blocked
  
  const response = await fetch(`/api/posts/${postId}/like`, {
    method: 'POST'
  });
  
  if (response.ok) {
    updateUI(); // Only after server confirms
  }
  
  hideSpinner(); // 300-500ms wait
}
```

#### RAFT: Optimistic Updates

```javascript
// ✅ RAFT: Instant UI, rollback if fails
await raft.optimisticUpdate(
  'post-likes',
  { liked: true, count: currentCount + 1 }, // Instant UI
  async () => fetch(`/api/posts/${postId}/like`, { method: 'POST' }),
  {
    onOptimistic: (data) => updateUI(data), // Instant!
    onRollback: (original) => updateUI(original) // If fails
  }
);
// UI updates in <10ms, confirms in background
```

---

#### REST: Over-fetching

```javascript
// ❌ REST: Fetches entire user object (wasteful)
const user = await fetch('/api/users/1');
// Returns: { id, name, email, bio, avatar, preferences, settings, ... }
// But you only need: name and email
```

#### RAFT: Query Language

```javascript
// ✅ RAFT: Fetch only what you need
const user = raft.queryData(allUsers, {
  where: { id: 1 },
  select: ['name', 'email']
});
// Returns: { name: "Alice", email: "alice@example.com" }
// 90% less data transferred
```

---

## 🚀 Core Features

### Feature #1: Streaming API

**Problem:** REST requires polling for real-time data.

**Solution:** RAFT uses async generators for push-based updates.

#### Basic Example

```javascript
// Create stream
async function* generateData() {
  let count = 0;
  while (true) {
    yield { count: ++count, timestamp: Date.now() };
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Consume stream
for await (const message of raft.stream('channel', generateData)) {
  console.log(message); // New data every second
}
```

#### Advanced: Multiple Subscribers

```javascript
// Producer: Single stream
raft.stream('stock-prices', async () => {
  return { symbol: 'AAPL', price: Math.random() * 200 };
}, { interval: 1000 });

// Consumer 1: Dashboard
raft.subscribe('stock-prices', (data) => {
  updateDashboard(data);
});

// Consumer 2: Alerts
raft.subscribe('stock-prices', (data) => {
  if (data.price > threshold) sendAlert();
});
```

#### Performance

```
REST Polling (5s interval):
- Requests/hour: 720
- Empty responses: ~650 (90%)
- Bandwidth wasted: High

RAFT Streaming:
- Requests/hour: 1 (connection)
- Updates: Only when data changes
- Bandwidth saved: 99%
```

---

### Feature #2: Smart Caching

**Problem:** Manual cache management is error-prone.

**Solution:** Built-in multi-strategy caching with TTL.

#### Strategies

**LRU (Least Recently Used)**
```javascript
const cache = new CacheLayer({ strategy: 'lru', maxSize: 50 });
cache.set('key1', value1);
cache.set('key2', value2);
// ... 50 items
cache.set('key51', value51); // Evicts least recently accessed
```

**LFU (Least Frequently Used)**
```javascript
const cache = new CacheLayer({ strategy: 'lfu', maxSize: 50 });
// Evicts items with lowest access count
```

**FIFO (First In, First Out)**
```javascript
const cache = new CacheLayer({ strategy: 'fifo', maxSize: 50 });
// Evicts oldest items first
```

#### TTL (Time To Live)

```javascript
// Global TTL
const cache = new CacheLayer({ ttl: 60000 }); // 1 minute

// Per-item TTL
cache.set('key', value, 300000); // 5 minutes
```

#### Hit Rate Optimization

```javascript
const stats = cache.getStats();
console.log(stats.hitRate); // "85.5%"

// If hit rate < 80%, consider:
// 1. Increase maxSize
// 2. Increase TTL
// 3. Preload common data (warmup)
cache.warmup({ key1: value1, key2: value2 });
```

---

### Feature #3: Auto-Batching

**Problem:** Parallel requests create waterfall latency.

**Solution:** Automatic batching within time window.

#### Configuration

```javascript
const batch = new BatchManager({
  batchWindow: 50, // ms
  maxBatchSize: 10,
  enabled: true
});
```

#### How It Works

```
Time:    0ms      10ms     30ms     50ms     60ms
Request: R1       R2       R3       FLUSH    R4
         |--------|--------|--------|        |
              Batch Window (50ms)            New batch
              
Batches: [R1, R2, R3] executed together
         R4 starts new batch
```

#### Performance Gain

```javascript
// Without batching
const r1 = await fetch('/api/user'); // 100ms
const r2 = await fetch('/api/posts'); // 100ms
const r3 = await fetch('/api/comments'); // 100ms
// Total: 300ms

// With batching
const [r1, r2, r3] = await raft.batchExecute([
  { handler: () => fetch('/api/user') },
  { handler: () => fetch('/api/posts') },
  { handler: () => fetch('/api/comments') }
]);
// Total: 100ms (3x faster)
```

#### Deduplication

```javascript
// Automatically removes duplicate requests
await raft.batch.executeDeduplicated([
  { method: 'GET', path: '/api/user/1' },
  { method: 'GET', path: '/api/user/1' }, // Duplicate
  { method: 'GET', path: '/api/user/1' }  // Duplicate
]);
// Only 1 actual request made
```

---

### Feature #4: Optimistic Updates

**Problem:** UI feels slow waiting for server confirmation.

**Solution:** Update UI immediately, rollback if fails.

#### Basic Pattern

```javascript
await raft.optimisticUpdate(
  'entity-name',
  optimisticData, // UI shows this immediately
  actualRequest,  // Background server call
  {
    originalData: currentData,
    onOptimistic: (data) => {
      // Update UI instantly (<10ms)
      updateUIImmediately(data);
    },
    onConfirm: (serverData) => {
      // Server confirmed (300ms later)
      console.log('Success:', serverData);
    },
    onRollback: (original) => {
      // Server failed, revert UI
      updateUIImmediately(original);
      showError('Update failed');
    }
  }
);
```

#### Real-world Example: Like Button

```javascript
const likeButton = document.getElementById('like');
let isLiked = false;
let likeCount = 42;

likeButton.addEventListener('click', async () => {
  await raft.optimisticUpdate(
    'post-like',
    { liked: !isLiked, count: likeCount + (isLiked ? -1 : 1) },
    async () => {
      return await fetch('/api/posts/123/like', {
        method: isLiked ? 'DELETE' : 'POST'
      });
    },
    {
      originalData: { liked: isLiked, count: likeCount },
      onOptimistic: (data) => {
        // UI updates instantly
        isLiked = data.liked;
        likeCount = data.count;
        likeButton.textContent = `❤️ ${likeCount}`;
        likeButton.classList.toggle('active');
      },
      onRollback: (original) => {
        // Rollback on failure
        isLiked = original.liked;
        likeCount = original.count;
        likeButton.textContent = `❤️ ${likeCount}`;
        likeButton.classList.remove('active');
      }
    }
  );
});

// Result: Button feels instant (10ms) vs blocking (300ms)
```

#### Success Rate

```javascript
const stats = raft.optimistic.getStats();
console.log({
  pending: stats.pending,      // Currently in-flight
  rolledBack: stats.rolledBack // Failed and reverted
});

// Typical: 95-99% success rate
```

---

### Feature #5: Query Language

**Problem:** REST endpoints return fixed data structures (over-fetching).

**Solution:** GraphQL-like filtering, selecting, and sorting.

#### Operators

**Comparison**
```javascript
where: {
  age: { $eq: 25 },        // Equal
  age: { $ne: 25 },        // Not equal
  age: { $gt: 25 },        // Greater than
  age: { $gte: 25 },       // Greater than or equal
  age: { $lt: 25 },        // Less than
  age: { $lte: 25 }        // Less than or equal
}
```

**Arrays**
```javascript
where: {
  status: { $in: ['active', 'pending'] },     // In array
  status: { $nin: ['deleted', 'archived'] }   // Not in array
}
```

**Strings**
```javascript
where: {
  name: { $contains: 'Alice' },      // Contains substring
  name: { $startsWith: 'A' },        // Starts with
  name: { $endsWith: 'e' }           // Ends with
}
```

#### Complete Example

```javascript
const users = [
  { id: 1, name: 'Alice', age: 25, city: 'Paris', status: 'active' },
  { id: 2, name: 'Bob', age: 30, city: 'London', status: 'active' },
  { id: 3, name: 'Charlie', age: 25, city: 'Paris', status: 'inactive' },
  { id: 4, name: 'Diana', age: 28, city: 'Tokyo', status: 'active' }
];

const result = raft.queryData(users, {
  where: {
    age: { $gte: 25 },
    city: 'Paris',
    status: 'active'
  },
  select: ['name', 'age'],
  orderBy: ['-age', 'name'], // Sort by age desc, then name asc
  limit: 10,
  offset: 0
});

// Result: [{ name: 'Alice', age: 25 }]
```

#### Aggregations

```javascript
const stats = raft.query.aggregate(users, {
  totalUsers: { $count: true },
  avgAge: { $avg: 'age' },
  minAge: { $min: 'age' },
  maxAge: { $max: 'age' },
  totalAge: { $sum: 'age' }
});

// Result: { totalUsers: 4, avgAge: 27, minAge: 25, maxAge: 30, totalAge: 108 }
```

#### Group By

```javascript
const grouped = raft.query.groupBy(users, 'city');

// Result:
// {
//   'Paris': [{ id: 1, ... }, { id: 3, ... }],
//   'London': [{ id: 2, ... }],
//   'Tokyo': [{ id: 4, ... }]
// }
```

#### Joins

```javascript
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
];

const posts = [
  { id: 101, userId: 1, title: 'Post 1' },
  { id: 102, userId: 1, title: 'Post 2' },
  { id: 103, userId: 2, title: 'Post 3' }
];

const result = raft.query.join(users, posts, 'id', 'userId', 'inner');

// Result:
// [
//   { id: 1, name: 'Alice', userId: 1, title: 'Post 1' },
//   { id: 1, name: 'Alice', userId: 1, title: 'Post 2' },
//   { id: 2, name: 'Bob', userId: 2, title: 'Post 3' }
// ]
```

---

## 📐 Protocol Specification

### Message Format

#### Request
```javascript
{
  id: "req_123_1672444800000",
  method: "GET|POST|PUT|DELETE|PATCH",
  path: "/resource/:id",
  headers: {
    "authorization": "Bearer token",
    "content-type": "application/json"
  },
  body: { /* ... */ },
  query: { /* ... */ },
  params: { /* ... */ }
}
```

#### Response
```javascript
{
  status: 200,
  data: { /* ... */ },
  headers: {
    "content-type": "application/json"
  },
  timestamp: 1672444800000
}
```

### Authentication

**JWT (Recommended)**
```javascript
// Generate token
const token = await raft.auth.generateToken({
  userId: 123,
  email: 'user@example.com',
  plan: 'pro'
});

// Validate token
const validation = await raft.auth.validateToken(token);
if (validation.valid) {
  console.log('User:', validation.user);
}
```

**API Key**
```javascript
// Configure
const raft = new FrontendRAFT({
  auth: { type: 'apikey' }
});

// Use in headers
headers: {
  'X-API-Key': 'secret_key_here'
}
```

### Rate Limiting

```javascript
// Configure
const raft = new FrontendRAFT({
  rateLimit: {
    windowMs: 60000,    // 1 minute
    maxRequests: 100    // 100 requests/min
  }
});

// Automatic enforcement
// 101st request in window → 429 Too Many Requests
```

### CORS

```javascript
// Configure
raft.router.use(raft.router.cors({
  origins: ['https://example.com', 'https://app.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

---

## 🎯 Use Cases

### When to Use RAFT

✅ **Perfect For:**
- Real-time dashboards
- Collaborative apps (docs, whiteboards)
- Offline-first applications
- MVP/prototypes ($0 infrastructure)
- Internal tools
- Personal projects
- Data-heavy SPAs

⚠️ **Consider Alternatives For:**
- Banking/financial transactions
- High-security requirements (HIPAA, PCI-DSS)
- > 10,000 concurrent users
- Compliance-heavy industries
- Legacy system integration

### Real-world Examples

**1. Collaborative Todo App**
```javascript
// Real-time sync across devices
raft.subscribe('todos', (update) => {
  renderTodos(update.data);
});

// Optimistic UI for instant feel
await raft.optimisticUpdate('todo', newTodo, saveTodoToServer);
```

**2. Analytics Dashboard**
```javascript
// Streaming metrics
for await (const metrics of raft.stream('analytics', fetchMetrics)) {
  updateCharts(metrics);
}

// Query for filtering
const filtered = raft.queryData(metrics, {
  where: { date: { $gte: startDate } },
  orderBy: ['-value']
});
```

**3. Social Feed**
```javascript
// Smart caching for performance
const posts = await raft.executeWithCache('feed', fetchPosts, 30000);

// Optimistic likes
await raft.optimisticUpdate('post-like', { liked: true }, likePost);
```

---

## 🎓 Learning Path

### Beginner
1. Read [Quick Start](./README.md#quick-start)
2. Run [Basic Example](../examples/basic-example.html)
3. Build simple CRUD API

### Intermediate
1. Implement authentication
2. Add caching strategy
3. Use streaming for real-time

### Advanced
1. Implement P2P communication
2. Build collaborative app
3. Optimize with batching + optimistic updates

---

## 🔗 Resources

- **CSOP (Inspiration):** https://github.com/Nexus-Studio-CEO/CSOP
- **GitHub:** https://github.com/Nexus-Studio-CEO/FrontendRAFT
- **Roadmap:** [ROADMAP.md](./ROADMAP.md)
- **Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**Created by DAOUDA Abdoul Anzize (Nexus Studio)**  
**Inspired by CSOP - Client-Side Orchestration Protocol**