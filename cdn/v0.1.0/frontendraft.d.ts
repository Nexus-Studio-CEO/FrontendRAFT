var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var index_exports = {};
__export(index_exports, {
  AuthLayer: () => AuthLayer$1,
  BatchManager: () => BatchManager$1,
  CDNClient: () => CDNClient$1,
  CacheLayer: () => CacheLayer$1,
  ComputeLayer: () => ComputeLayer$1,
  ErrorCodes: () => ErrorCodes$1,
  FrontendRAFT: () => FrontendRAFT$1,
  OptimisticEngine: () => OptimisticEngine$1,
  P2PLayer: () => P2PLayer$1,
  QueryEngine: () => QueryEngine$1,
  RAFTError: () => RAFTError$1,
  Router: () => Router$1,
  StorageLayer: () => StorageLayer$1,
  StreamManager: () => StreamManager$1,
  crypto: () => crypto_exports,
  jwt: () => jwt_exports,
  react: () => react_exports,
  validation: () => validation_exports,
  vue: () => vue_exports
});
module.exports = __toCommonJS(index_exports);

// core/AuthLayer.ts
var AuthLayer$1 = class AuthLayer {
  constructor(csop, storage, config) {
    this.csop = csop;
    this.storage = storage;
    this.secret = config?.jwtSecret || this.generateSecret();
    this.tokenExpiry = config?.tokenExpiry || 30 * 24 * 36e5;
  }
  /**
   * Create new user account
   */
  async signup(email, password, options) {
    const existingUser = await this.storage.exists(`user:${email}`);
    if (existingUser) {
      throw new Error("User already exists");
    }
    const userId = crypto.randomUUID();
    const passwordHash = await this.hashPassword(password);
    const userData = {
      id: userId,
      email,
      passwordHash,
      plan: options?.plan || "free",
      quota: options?.quota || 1e3,
      usedQuota: 0,
      createdAt: Date.now()
    };
    await this.storage.save(`user:${userId}`, userData);
    await this.storage.save(`user:email:${email}`, userId);
    return this.generateToken({
      userId,
      email,
      plan: userData.plan,
      apiId: "",
      // Will be set by FrontendRAFT
      exp: Date.now() + this.tokenExpiry
    });
  }
  /**
   * Login existing user
   */
  async login(email, password) {
    const userId = await this.storage.get(`user:email:${email}`);
    const user = await this.storage.get(`user:${userId}`);
    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }
    return this.generateToken({
      userId: user.id,
      email: user.email,
      plan: user.plan,
      apiId: "",
      exp: Date.now() + this.tokenExpiry
    });
  }
  /**
   * Validate JWT token
   */
  async validateToken(token) {
    try {
      const payload = this.decodeToken(token);
      if (!payload.exp || Date.now() > payload.exp) {
        throw new Error("Token expired");
      }
      const [header, payloadPart, signature] = token.split(".");
      const expectedSignature = this.sign(`${header}.${payloadPart}`);
      if (signature !== expectedSignature) {
        throw new Error("Invalid token signature");
      }
      const user = await this.storage.get(`user:${payload.userId}`);
      if (!user || !user.id || user.id !== payload.userId) {
        throw new Error("User not found or token mismatch");
      }
      return user;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
  /**
   * Generate JWT token
   */
  generateToken(payload) {
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
  /**
   * Decode JWT token
   * @private
   */
  decodeToken(token) {
    const [header, payload, signature] = token.split(".");
    const expectedSignature = this.sign(`${header}.${payload}`);
    if (signature !== expectedSignature) {
      throw new Error("Invalid signature");
    }
    return JSON.parse(this.base64UrlDecode(payload));
  }
  /**
   * Hash password
   * @private
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + this.secret);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Verify password
   * @private
   */
  async verifyPassword(password, hash) {
    const newHash = await this.hashPassword(password);
    return newHash === hash;
  }
  /**
   * Sign data with secret
   * @private
   */
  sign(data) {
    const combined = data + this.secret;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  /**
   * Base64 URL encode
   * @private
   */
  base64UrlEncode(str) {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }
  /**
   * Base64 URL decode
   * @private
   */
  base64UrlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) {
      str += "=";
    }
    return atob(str);
  }
  /**
   * Generate random secret
   * @private
   */
  generateSecret() {
    return crypto.randomUUID() + crypto.randomUUID();
  }
  /**
   * Update user quota
   */
  async incrementQuota(userId) {
    const user = await this.storage.get(`user:${userId}`);
    user.usedQuota++;
    await this.storage.save(`user:${userId}`, user);
  }
  /**
   * Check if user has quota available
   */
  async hasQuotaAvailable(userId) {
    const user = await this.storage.get(`user:${userId}`);
    return user.usedQuota < user.quota;
  }
};

// types/index.ts
var RAFTError$1 = class RAFTError extends Error {
  constructor(code, message, statusCode = 500, details) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = "RAFTError";
  }
};
var ErrorCodes$1 = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR"
};

// core/Router.ts
var Router$1 = class Router {
  constructor(auth, rateLimitConfig, corsConfig) {
    this.routes = /* @__PURE__ */ new Map();
    this.globalMiddleware = [];
    this.rateLimitMap = /* @__PURE__ */ new Map();
    this.auth = auth;
    this.rateLimitConfig = {
      windowMs: rateLimitConfig?.windowMs || 6e4,
      maxRequests: rateLimitConfig?.maxRequests || 100
    };
    this.corsConfig = {
      origins: corsConfig?.origins || [],
      methods: corsConfig?.methods || ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: corsConfig?.credentials ?? true
    };
  }
  /**
   * Register GET route
   */
  get(path, handler, middleware) {
    this.register("GET", path, handler, middleware);
  }
  /**
   * Register POST route
   */
  post(path, handler, middleware) {
    this.register("POST", path, handler, middleware);
  }
  /**
   * Register PUT route
   */
  put(path, handler, middleware) {
    this.register("PUT", path, handler, middleware);
  }
  /**
   * Register DELETE route
   */
  delete(path, handler, middleware) {
    this.register("DELETE", path, handler, middleware);
  }
  /**
   * Register PATCH route
   */
  patch(path, handler, middleware) {
    this.register("PATCH", path, handler, middleware);
  }
  /**
   * Register route
   * @private
   */
  register(method, path, handler, middleware) {
    const key = `${method}:${path}`;
    this.routes.set(key, {
      method,
      path,
      handler,
      middleware: middleware || []
    });
  }
  /**
   * Add global middleware
   */
  use(middleware) {
    this.globalMiddleware.push(middleware);
  }
  /**
   * Handle incoming request
   */
  async handle(request) {
    try {
      if (request.method === "OPTIONS") {
        return this.handleCORS();
      }
      await this.checkRateLimit(request);
      const route = this.findRoute(request.method, request.path);
      if (!route) {
        throw new RAFTError$1(ErrorCodes$1.NOT_FOUND, `Route not found: ${request.method} ${request.path}`, 404);
      }
      request.params = this.extractParams(route.path, request.path);
      const middlewareChain = [...this.globalMiddleware, ...route.middleware || []];
      let index = 0;
      const next = async () => {
        if (index < middlewareChain.length) {
          const middleware = middlewareChain[index++];
          return middleware(request, next);
        } else {
          return route.handler(request);
        }
      };
      const result = await next();
      return {
        status: 200,
        data: result,
        headers: this.getCORSHeaders()
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
  /**
   * Find matching route
   * @private
   */
  findRoute(method, path) {
    const exactKey = `${method}:${path}`;
    if (this.routes.has(exactKey)) {
      return this.routes.get(exactKey);
    }
    for (const [key, route] of this.routes.entries()) {
      if (route.method !== method) continue;
      if (this.matchPattern(route.path, path)) {
        return route;
      }
    }
    return null;
  }
  /**
   * Match route pattern (supports :param)
   * @private
   */
  matchPattern(pattern, path) {
    const patternParts = pattern.split("/");
    const pathParts = path.split("/");
    if (patternParts.length !== pathParts.length) {
      return false;
    }
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(":")) {
        continue;
      }
      if (patternParts[i] !== pathParts[i]) {
        return false;
      }
    }
    return true;
  }
  /**
   * Extract route parameters
   * @private
   */
  extractParams(pattern, path) {
    const params = {};
    const patternParts = pattern.split("/");
    const pathParts = path.split("/");
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(":")) {
        const paramName = patternParts[i].substring(1);
        params[paramName] = pathParts[i];
      }
    }
    return params;
  }
  /**
   * Check rate limit
   * @private
   */
  async checkRateLimit(request) {
    const key = request.headers["x-forwarded-for"] || "unknown";
    const now = Date.now();
    let timestamps = this.rateLimitMap.get(key) || [];
    timestamps = timestamps.filter((t) => now - t < this.rateLimitConfig.windowMs);
    if (timestamps.length >= this.rateLimitConfig.maxRequests) {
      throw new RAFTError$1(
        ErrorCodes$1.RATE_LIMIT_EXCEEDED,
        "Rate limit exceeded",
        429
      );
    }
    timestamps.push(now);
    this.rateLimitMap.set(key, timestamps);
  }
  /**
   * Handle CORS preflight
   * @private
   */
  handleCORS() {
    return {
      status: 204,
      headers: this.getCORSHeaders()
    };
  }
  /**
   * Get CORS headers
   * @private
   */
  getCORSHeaders() {
    const allowedOrigins = this.corsConfig.origins.length > 0 ? this.corsConfig.origins.join(",") : "*";
    return {
      "Access-Control-Allow-Origin": allowedOrigins,
      "Access-Control-Allow-Methods": this.corsConfig.methods.join(","),
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": this.corsConfig.credentials.toString()
    };
  }
  /**
   * Handle errors
   * @private
   */
  handleError(error) {
    if (error instanceof RAFTError$1) {
      return {
        status: error.statusCode,
        error: error.message,
        headers: this.getCORSHeaders()
      };
    }
    console.error("Unhandled error:", error);
    return {
      status: 500,
      error: "Internal server error",
      headers: this.getCORSHeaders()
    };
  }
  /**
   * Get all registered endpoints
   */
  getEndpoints() {
    const endpoints = [];
    for (const route of this.routes.values()) {
      endpoints.push({
        method: route.method,
        path: route.path,
        requiresAuth: false,
        // TODO: detect from middleware
        rateLimit: {
          maxRequests: this.rateLimitConfig.maxRequests,
          windowMs: this.rateLimitConfig.windowMs
        }
      });
    }
    return endpoints;
  }
};

// core/StorageLayer.ts
var StorageLayer$1 = class StorageLayer {
  constructor(csop) {
    this.csop = csop;
  }
  /**
   * Save data to storage
   */
  async save(key, data) {
    try {
      await this.csop.dispatch("storage.save", {
        key,
        data
      });
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      throw error;
    }
  }
  /**
   * Get data from storage
   */
  async get(key) {
    try {
      const result = await this.csop.dispatch("storage.get", { key });
      return result.data;
    } catch (error) {
      throw new Error(`Key not found: ${key}`);
    }
  }
  /**
   * Delete data from storage
   */
  async delete(key) {
    try {
      await this.csop.dispatch("storage.delete", { key });
    } catch (error) {
      console.error(`Failed to delete ${key}:`, error);
    }
  }
  /**
   * List all keys with optional prefix
   */
  async list(prefix) {
    try {
      const result = await this.csop.dispatch("storage.list", { prefix });
      return result.data || [];
    } catch (error) {
      console.error("Failed to list keys:", error);
      return [];
    }
  }
  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      await this.get(key);
      return true;
    } catch {
      return false;
    }
  }
};

// core/ComputeLayer.ts
var ComputeLayer$1 = class ComputeLayer {
  constructor(csop) {
    this.csop = csop;
  }
  /**
   * Execute computation task
   */
  async execute(task, data) {
    try {
      const result = await this.csop.dispatch("compute.execute", {
        task,
        data
      });
      return result.data;
    } catch (error) {
      console.error("Compute execution failed:", error);
      throw error;
    }
  }
  /**
   * Execute batch of tasks in parallel
   */
  async batch(tasks) {
    try {
      const result = await this.csop.dispatch("compute.batch", { tasks });
      return result.data.results || [];
    } catch (error) {
      console.error("Batch compute failed:", error);
      throw error;
    }
  }
  /**
   * Execute custom function
   */
  async executeFunction(fn, args) {
    return this.execute("custom", {
      fn,
      args
    });
  }
};

// core/P2PLayer.ts
var P2PLayer$1 = class P2PLayer {
  constructor(csop) {
    this.connections = /* @__PURE__ */ new Map();
    this.csop = csop;
    this.peerId = `peer_${crypto.randomUUID()}`;
  }
  async setupConnection(apiId) {
    await this.csop.dispatch("sync.subscribe", {
      channel: `p2p:${apiId}`,
      callback: (message) => {
        this.handleMessage(message);
      }
    });
  }
  async sendRequest(apiId, request) {
    const requestId = crypto.randomUUID();
    await this.csop.dispatch("sync.broadcast", {
      event: `p2p:${apiId}`,
      data: {
        type: "request",
        requestId,
        apiId,
        data: request,
        timestamp: Date.now()
      }
    });
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 5e3);
      const checkResponse = (msg) => {
        if (msg.requestId === requestId && msg.type === "response") {
          clearTimeout(timeout);
          resolve(msg.data);
        }
      };
      this.connections.set(requestId, checkResponse);
    });
  }
  handleMessage(message) {
    const handler = this.connections.get(message.requestId || "");
    if (handler) {
      handler(message);
      this.connections.delete(message.requestId);
    }
  }
  getPeerId() {
    return this.peerId;
  }
};

// core/CDNClient.ts
var CDNClient$1 = class CDNClient {
  constructor(csop, config) {
    this.csop = csop;
    this.registryUrl = config?.registryUrl || "https://cdn.frontierapi.io";
  }
  async register(metadata) {
    const fullMetadata = {
      ...metadata,
      registeredAt: Date.now(),
      status: "online"
    };
    try {
      const response = await fetch(`${this.registryUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullMetadata)
      });
      if (!response.ok) {
        throw new Error("Registration failed");
      }
      const result = await response.json();
      return {
        publicUrl: `${this.registryUrl}/${metadata.apiId}`
      };
    } catch (error) {
      console.error("CDN registration failed:", error);
      return {
        publicUrl: `${this.registryUrl}/${metadata.apiId}`
      };
    }
  }
  async heartbeat(apiId) {
    try {
      await fetch(`${this.registryUrl}/heartbeat/${apiId}`, {
        method: "POST"
      });
    } catch (error) {
      console.error("Heartbeat failed:", error);
    }
  }
  async discover(apiId) {
    try {
      const response = await fetch(`${this.registryUrl}/discover/${apiId}`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error("Discovery failed:", error);
      return null;
    }
  }
};

// core/CacheLayer.ts
var CacheLayer$1 = class CacheLayer {
  constructor(storage, config) {
    this.memoryCache = /* @__PURE__ */ new Map();
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
    this.storage = storage;
    this.config = {
      enabled: config?.enabled ?? true,
      defaultTTL: config?.defaultTTL ?? 5 * 60 * 1e3,
      maxSize: config?.maxSize ?? 50 * 1024 * 1024
    };
    this.startCleanupTimer();
  }
  async get(key) {
    if (!this.config.enabled) return null;
    const memEntry = this.memoryCache.get(key);
    if (memEntry && !this.isExpired(memEntry)) {
      this.stats.hits++;
      return memEntry.value;
    }
    try {
      const entry = await this.storage.get(`cache:${key}`);
      if (entry && !this.isExpired(entry)) {
        this.memoryCache.set(key, entry);
        this.stats.hits++;
        return entry.value;
      }
      if (entry) await this.delete(key);
    } catch (error) {
    }
    this.stats.misses++;
    return null;
  }
  async set(key, value, options) {
    if (!this.config.enabled) return;
    const ttl = options?.ttl ?? this.config.defaultTTL;
    const tags = options?.tags ?? [];
    const size = this.estimateSize(value);
    if (size > this.config.maxSize) {
      console.warn(`Cache entry too large: ${size} bytes`);
      return;
    }
    const entry = { key, value, timestamp: Date.now(), ttl, tags, size };
    await this.evictIfNeeded(size);
    this.memoryCache.set(key, entry);
    try {
      await this.storage.save(`cache:${key}`, entry);
    } catch (error) {
      console.error("Failed to cache in storage:", error);
    }
    this.stats.sets++;
  }
  async delete(key) {
    this.memoryCache.delete(key);
    try {
      await this.storage.delete(`cache:${key}`);
    } catch (error) {
    }
  }
  async invalidateTag(tag) {
    const toDelete = [];
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags.includes(tag)) toDelete.push(key);
    }
    for (const key of toDelete) await this.delete(key);
    console.log(`Invalidated ${toDelete.length} entries with tag: ${tag}`);
  }
  async clear() {
    this.memoryCache.clear();
    try {
      const keys = await this.storage.list("cache:");
      for (const key of keys) await this.storage.delete(key);
    } catch (error) {
      console.error("Failed to clear cache storage:", error);
    }
  }
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) * 100;
    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + "%",
      memoryEntries: this.memoryCache.size,
      memorySize: this.getCurrentSize()
    };
  }
  isExpired(entry) {
    return Date.now() - entry.timestamp > entry.ttl;
  }
  estimateSize(value) {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 1e3;
    }
  }
  getCurrentSize() {
    let total = 0;
    for (const entry of this.memoryCache.values()) total += entry.size;
    return total;
  }
  async evictIfNeeded(incomingSize) {
    const currentSize = this.getCurrentSize();
    if (currentSize + incomingSize <= this.config.maxSize) return;
    const entries = Array.from(this.memoryCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    let freedSize = 0;
    for (const [key, entry] of entries) {
      await this.delete(key);
      freedSize += entry.size;
      this.stats.evictions++;
      if (currentSize - freedSize + incomingSize <= this.config.maxSize) break;
    }
  }
  startCleanupTimer() {
    setInterval(() => {
      const toDelete = [];
      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isExpired(entry)) toDelete.push(key);
      }
      for (const key of toDelete) this.delete(key);
    }, 6e4);
  }
  memoize(fn, options) {
    return (async (...args) => {
      const key = `memoized:${fn.name}:${JSON.stringify(args)}`;
      const cached = await this.get(key);
      if (cached !== null) return cached;
      const result = await fn(...args);
      await this.set(key, result, options);
      return result;
    });
  }
};

// core/StreamManager.ts
var StreamManager$1 = class StreamManager {
  constructor(csop) {
    this.subscriptions = /* @__PURE__ */ new Map();
    this.activeStreams = /* @__PURE__ */ new Map();
    this.csop = csop;
  }
  async subscribe(channel, callback, options) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, /* @__PURE__ */ new Set());
      await this.setupChannelListener(channel);
    }
    const callbacks = this.subscriptions.get(channel);
    const wrappedCallback = options?.filter ? (data) => {
      if (options.filter(data)) callback(data);
    } : callback;
    callbacks.add(wrappedCallback);
    return {
      channel,
      callback: wrappedCallback,
      unsubscribe: async () => {
        callbacks.delete(wrappedCallback);
        if (callbacks.size === 0) this.subscriptions.delete(channel);
      }
    };
  }
  async broadcast(channel, data) {
    try {
      await this.csop.dispatch("sync.broadcast", {
        event: `raft:${channel}`,
        data: { timestamp: Date.now(), payload: data }
      });
    } catch (error) {
      console.error(`Failed to broadcast to ${channel}:`, error);
      throw error;
    }
  }
  async *stream(channel, options) {
    const queue = [];
    let resolve = null;
    let ended = false;
    const subscription = await this.subscribe(channel, (data) => {
      if (resolve) {
        resolve(data);
        resolve = null;
      } else {
        queue.push(data);
      }
    }, options);
    try {
      while (!ended) {
        if (queue.length > 0) {
          yield queue.shift();
        } else {
          const data = await new Promise((res) => {
            resolve = res;
          });
          if (data === null) {
            ended = true;
          } else {
            yield data;
          }
        }
      }
    } finally {
      await subscription.unsubscribe();
    }
  }
  async setupChannelListener(channel) {
    try {
      await this.csop.dispatch("sync.subscribe", {
        channel: `raft:${channel}`,
        callback: (message) => {
          const callbacks = this.subscriptions.get(channel);
          if (callbacks) {
            const payload = message.data?.payload || message.data;
            for (const callback of callbacks) {
              try {
                callback(payload);
              } catch (error) {
                console.error("Stream callback error:", error);
              }
            }
          }
        }
      });
      this.activeStreams.set(channel, true);
    } catch (error) {
      console.error(`Failed to setup listener for ${channel}:`, error);
      throw error;
    }
  }
  getActiveSubscriptions() {
    let total = 0;
    for (const callbacks of this.subscriptions.values()) total += callbacks.size;
    return total;
  }
  getActiveChannels() {
    return Array.from(this.subscriptions.keys());
  }
  async closeAll() {
    for (const channel of this.subscriptions.keys()) {
      this.subscriptions.delete(channel);
    }
    this.activeStreams.clear();
  }
};

// core/BatchManager.ts
var BatchManager$1 = class BatchManager {
  constructor(router, options) {
    this.pendingBatch = /* @__PURE__ */ new Map();
    this.batchTimer = null;
    this.stats = { totalRequests: 0, batchedRequests: 0, batches: 0, averageBatchSize: 0 };
    this.router = router;
    this.config = {
      maxBatchSize: options?.maxBatchSize ?? 50,
      batchWindowMs: options?.batchWindowMs ?? 10
    };
  }
  async fetch(method, path, body) {
    this.stats.totalRequests++;
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      this.pendingBatch.set(requestId, {
        request: { id: requestId, method, path, body },
        resolve,
        reject
      });
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.executeBatch(), this.config.batchWindowMs);
      }
      if (this.pendingBatch.size >= this.config.maxBatchSize) {
        if (this.batchTimer) {
          clearTimeout(this.batchTimer);
          this.batchTimer = null;
        }
        this.executeBatch();
      }
    });
  }
  async executeBatch() {
    if (this.pendingBatch.size === 0) return;
    const batch = Array.from(this.pendingBatch.entries());
    this.pendingBatch.clear();
    this.batchTimer = null;
    this.stats.batches++;
    this.stats.batchedRequests += batch.length;
    this.stats.averageBatchSize = this.stats.batchedRequests / this.stats.batches;
    const results = await Promise.allSettled(
      batch.map(
        ([id, item]) => this.router.handle({
          method: item.request.method,
          path: item.request.path,
          headers: {},
          body: item.request.body
        })
      )
    );
    results.forEach((result, index) => {
      const [id, item] = batch[index];
      if (result.status === "fulfilled") {
        item.resolve(result.value.data);
      } else {
        item.reject(result.reason);
      }
    });
  }
  getStats() {
    return {
      ...this.stats,
      efficiency: ((1 - this.stats.batches / this.stats.totalRequests) * 100).toFixed(2) + "%"
    };
  }
  async executeBatchManual(requests) {
    const results = await Promise.allSettled(
      requests.map(
        (req) => this.router.handle({
          method: req.method,
          path: req.path,
          headers: {},
          body: req.body
        })
      )
    );
    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return {
          id: requests[index].id,
          status: result.value.status,
          data: result.value.data
        };
      } else {
        return {
          id: requests[index].id,
          status: 500,
          error: result.reason?.message || "Unknown error"
        };
      }
    });
  }
};

// core/OptimisticEngine.ts
var OptimisticEngine$1 = class OptimisticEngine {
  constructor(storage, cache) {
    this.pendingUpdates = /* @__PURE__ */ new Map();
    this.stats = { total: 0, succeeded: 0, rolledBack: 0 };
    this.storage = storage;
    this.cache = cache;
  }
  async create(resourceType, optimisticData, actualRequest, options) {
    const updateId = crypto.randomUUID();
    const resourceId = optimisticData.id || updateId;
    const update = {
      id: updateId,
      operation: "create",
      resourceType,
      resourceId,
      optimisticData,
      actualRequest,
      rollback: async () => {
        await this.storage.delete(`${resourceType}:${resourceId}`);
        await this.cache.delete(`${resourceType}:${resourceId}`);
      },
      timestamp: Date.now()
    };
    this.pendingUpdates.set(updateId, update);
    this.stats.total++;
    await this.storage.save(`${resourceType}:${resourceId}`, optimisticData);
    await this.cache.set(`${resourceType}:${resourceId}`, optimisticData, { ttl: 6e4 });
    this.executeActualRequest(update, options);
    return optimisticData;
  }
  async update(resourceType, resourceId, optimisticData, actualRequest, options) {
    const updateId = crypto.randomUUID();
    const currentData = await this.storage.get(`${resourceType}:${resourceId}`);
    const mergedData = { ...currentData, ...optimisticData };
    const update = {
      id: updateId,
      operation: "update",
      resourceType,
      resourceId,
      optimisticData: mergedData,
      actualRequest,
      rollback: async () => {
        await this.storage.save(`${resourceType}:${resourceId}`, currentData);
        await this.cache.set(`${resourceType}:${resourceId}`, currentData);
      },
      timestamp: Date.now()
    };
    this.pendingUpdates.set(updateId, update);
    this.stats.total++;
    await this.storage.save(`${resourceType}:${resourceId}`, mergedData);
    await this.cache.set(`${resourceType}:${resourceId}`, mergedData, { ttl: 6e4 });
    this.executeActualRequest(update, options);
    return mergedData;
  }
  async delete(resourceType, resourceId, actualRequest, options) {
    const updateId = crypto.randomUUID();
    const currentData = await this.storage.get(`${resourceType}:${resourceId}`);
    const update = {
      id: updateId,
      operation: "delete",
      resourceType,
      resourceId,
      optimisticData: null,
      actualRequest,
      rollback: async () => {
        await this.storage.save(`${resourceType}:${resourceId}`, currentData);
        await this.cache.set(`${resourceType}:${resourceId}`, currentData);
      },
      timestamp: Date.now()
    };
    this.pendingUpdates.set(updateId, update);
    this.stats.total++;
    await this.storage.delete(`${resourceType}:${resourceId}`);
    await this.cache.delete(`${resourceType}:${resourceId}`);
    this.executeActualRequest(update, options);
  }
  async executeActualRequest(update, options) {
    try {
      const result = await update.actualRequest();
      this.pendingUpdates.delete(update.id);
      this.stats.succeeded++;
      if (update.operation !== "delete") {
        await this.storage.save(`${update.resourceType}:${update.resourceId}`, result);
        await this.cache.set(`${update.resourceType}:${update.resourceId}`, result, { ttl: 6e4 });
      }
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
    } catch (error) {
      console.error("Optimistic update failed:", error);
      if (options?.rollbackOnError !== false) {
        await update.rollback();
        this.stats.rolledBack++;
      }
      this.pendingUpdates.delete(update.id);
      if (options?.onError) {
        options.onError(error);
      }
    }
  }
  getPendingUpdates() {
    return Array.from(this.pendingUpdates.values());
  }
  getStats() {
    return {
      ...this.stats,
      successRate: (this.stats.succeeded / this.stats.total * 100).toFixed(2) + "%",
      rollbackRate: (this.stats.rolledBack / this.stats.total * 100).toFixed(2) + "%"
    };
  }
};

// core/QueryEngine.ts
var QueryEngine$1 = class QueryEngine {
  constructor(storage) {
    this.storage = storage;
  }
  async query(resourceType, options) {
    const keys = await this.storage.list(`${resourceType}:`);
    let items = [];
    for (const key of keys) {
      try {
        const item = await this.storage.get(key);
        items.push(item);
      } catch (error) {
      }
    }
    if (options?.where) {
      items = this.applyFilters(items, options.where);
    }
    const total = items.length;
    if (options?.orderBy) {
      items = this.applySorting(items, options.orderBy);
    }
    if (options?.offset) {
      items = items.slice(options.offset);
    }
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }
    if (options?.select) {
      items = this.applySelection(items, options.select);
    }
    return {
      data: items,
      total,
      hasMore: options?.limit ? total > (options.offset || 0) + options.limit : false
    };
  }
  async findOne(resourceType, options) {
    const result = await this.query(resourceType, { ...options, limit: 1 });
    return result.data[0] || null;
  }
  async count(resourceType, options) {
    const result = await this.query(resourceType, options);
    return result.total;
  }
  applyFilters(items, filters) {
    return items.filter((item) => {
      for (const [key, value] of Object.entries(filters)) {
        if (typeof value === "object" && value !== null) {
          if ("$gt" in value && !(item[key] > value.$gt)) return false;
          if ("$gte" in value && !(item[key] >= value.$gte)) return false;
          if ("$lt" in value && !(item[key] < value.$lt)) return false;
          if ("$lte" in value && !(item[key] <= value.$lte)) return false;
          if ("$ne" in value && item[key] === value.$ne) return false;
          if ("$in" in value && !value.$in.includes(item[key])) return false;
          if ("$contains" in value && !item[key]?.includes(value.$contains)) return false;
        } else {
          if (item[key] !== value) return false;
        }
      }
      return true;
    });
  }
  applySorting(items, orderBy) {
    return items.sort((a, b) => {
      const aVal = a[orderBy.field];
      const bVal = b[orderBy.field];
      if (aVal < bVal) return orderBy.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return orderBy.direction === "asc" ? 1 : -1;
      return 0;
    });
  }
  applySelection(items, fields) {
    return items.map((item) => {
      const selected = {};
      for (const field of fields) {
        if (field in item) {
          selected[field] = item[field];
        }
      }
      return selected;
    });
  }
  buildQuery(options) {
    const parts = [];
    if (options.select) {
      parts.push(`select: [${options.select.join(", ")}]`);
    }
    if (options.where) {
      parts.push(`where: ${JSON.stringify(options.where)}`);
    }
    if (options.orderBy) {
      parts.push(`orderBy: ${options.orderBy.field} ${options.orderBy.direction}`);
    }
    if (options.limit) {
      parts.push(`limit: ${options.limit}`);
    }
    if (options.offset) {
      parts.push(`offset: ${options.offset}`);
    }
    return `{ ${parts.join(", ")} }`;
  }
};

// core/FrontendRAFT.ts
var FrontendRAFT$1 = class FrontendRAFT {
  constructor(config) {
    this.csop = null;
    this.initialized = false;
    this.auth = null;
    this.router = null;
    this.storage = null;
    this.compute = null;
    this.p2p = null;
    this.cdn = null;
    this.cache = null;
    this.stream = null;
    this.batch = null;
    this.optimistic = null;
    this.query = null;
    this.apiId = null;
    this.publicUrl = null;
    this.config = {
      version: "1.0.0",
      autoRegister: true,
      cdn: { registryUrl: "https://cdn.frontierapi.io" },
      auth: { tokenExpiry: 30 * 24 * 36e5 },
      cache: { enabled: true, defaultTTL: 5 * 60 * 1e3, maxSize: 50 * 1024 * 1024 },
      rateLimit: { windowMs: 6e4, maxRequests: 100 },
      cors: { origins: [], methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], credentials: true },
      ...config
    };
  }
  async init() {
    if (this.initialized) {
      console.warn("FrontendRAFT already initialized");
      return;
    }
    try {
      const { CSOP } = await import('https://cdn.jsdelivr.net/gh/Nexus-Studio-CEO/CSOP@v0.1.0/src/csop.js');
      const csopInstance = new CSOP();
      await csopInstance.init();
      this.csop = csopInstance;
      this.storage = new StorageLayer$1(csopInstance);
      this.compute = new ComputeLayer$1(csopInstance);
      this.auth = new AuthLayer$1(csopInstance, this.storage, this.config.auth);
      this.router = new Router$1(this.auth, this.config.rateLimit, this.config.cors);
      this.p2p = new P2PLayer$1(csopInstance);
      this.cdn = new CDNClient$1(csopInstance, this.config.cdn);
      this.cache = new CacheLayer$1(this.storage, this.config.cache);
      this.stream = new StreamManager$1(csopInstance);
      this.batch = new BatchManager$1(this.router);
      this.optimistic = new OptimisticEngine$1(this.storage, this.cache);
      this.query = new QueryEngine$1(this.storage);
      if (this.config.autoRegister) await this.autoRegister();
      this.initialized = true;
      this.logBanner();
    } catch (error) {
      console.error("Failed to initialize FrontendRAFT:", error);
      throw new Error("CSOP is required. Make sure it is available.");
    }
  }
  async autoRegister() {
    try {
      const existingId = localStorage.getItem("frontendraft:apiId");
      if (existingId) {
        this.apiId = existingId;
        this.publicUrl = localStorage.getItem("frontendraft:publicUrl") || null;
        console.log("\u2705 API already registered:", this.apiId);
        return;
      }
      this.apiId = `raft_${crypto.randomUUID()}`;
      const result = await this.cdn.register({
        apiId: this.apiId,
        name: this.config.name,
        version: this.config.version || "1.0.0",
        siteUrl: typeof window !== "undefined" ? window.location.origin : "http://localhost",
        endpoints: this.router.getEndpoints()
      });
      this.publicUrl = result.publicUrl;
      localStorage.setItem("frontendraft:apiId", this.apiId);
      localStorage.setItem("frontendraft:publicUrl", this.publicUrl);
      console.log("\u{1F680} API registered:", this.publicUrl);
    } catch (error) {
      console.error("Auto-registration failed:", error);
    }
  }
  get(path, handler) {
    this.ensureInitialized();
    this.router.get(path, handler);
  }
  post(path, handler) {
    this.ensureInitialized();
    this.router.post(path, handler);
  }
  put(path, handler) {
    this.ensureInitialized();
    this.router.put(path, handler);
  }
  delete(path, handler) {
    this.ensureInitialized();
    this.router.delete(path, handler);
  }
  patch(path, handler) {
    this.ensureInitialized();
    this.router.patch(path, handler);
  }
  use(middleware) {
    this.ensureInitialized();
    this.router.use(middleware);
  }
  async publish() {
    this.ensureInitialized();
    if (this.apiId) return this.apiId;
    await this.autoRegister();
    return this.apiId;
  }
  getMetadata() {
    return {
      apiId: this.apiId,
      name: this.config.name,
      version: this.config.version,
      publicUrl: this.publicUrl,
      endpoints: this.router?.getEndpoints() || []
    };
  }
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error("FrontendRAFT not initialized. Call await raft.init() first.");
    }
  }
  logBanner() {
    console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551                    \u{1F680} FrontendRAFT v${this.config.version}                  \u2551
\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563
\u2551  RAFT = Reactive API for Frontend Transformation          \u2551
\u2551  Based on CSOP: github.com/Nexus-Studio-CEO/CSOP          \u2551
\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563
\u2551  \u2705 Storage    (IndexedDB + Cloud)                         \u2551
\u2551  \u2705 Compute    (Web Workers)                               \u2551
\u2551  \u2705 P2P        (WebRTC)                                    \u2551
\u2551  \u2705 Streaming  (Real-time)                                 \u2551
\u2551  \u2705 Caching    (Multi-level)                               \u2551
\u2551  \u2705 Batching   (Auto-optimization)                         \u2551
\u2551  \u2705 Optimistic (Instant UI)                                \u2551
\u2551  \u2705 Query      (GraphQL-like)                              \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D
    `.trim());
    if (this.apiId) {
      console.log(`
\u{1F3AF} API ID: ${this.apiId}`);
      console.log(`\u{1F310} Public URL: ${this.publicUrl}
`);
    }
  }
};

// utils/jwt.ts
var jwt_exports = {};
__export(jwt_exports, {
  base64UrlDecode: () => base64UrlDecode$1,
  base64UrlEncode: () => base64UrlEncode$1,
  getTokenExpiryDate: () => getTokenExpiryDate$1,
  isTokenExpired: () => isTokenExpired$1,
  parseJWT: () => parseJWT$1
});
function base64UrlEncode$1(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function base64UrlDecode$1(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return atob(str);
}
function parseJWT$1(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(base64UrlDecode$1(payload));
  } catch (error) {
    throw new Error("Invalid JWT token");
  }
}
function isTokenExpired$1(token) {
  try {
    const payload = parseJWT$1(token);
    return Date.now() > payload.exp;
  } catch {
    return true;
  }
}
function getTokenExpiryDate$1(token) {
  try {
    const payload = parseJWT$1(token);
    return new Date(payload.exp);
  } catch {
    return null;
  }
}

// utils/crypto.ts
var crypto_exports = {};
__export(crypto_exports, {
  decrypt: () => decrypt$1,
  encrypt: () => encrypt$1,
  generateRandomString: () => generateRandomString$1,
  generateUUID: () => generateUUID$1,
  hashSHA256: () => hashSHA256$1
});
async function hashSHA256$1(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
function generateUUID$1() {
  return crypto.randomUUID();
}
function generateRandomString$1(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function encrypt$1(data, key) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const keyBuffer = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key.padEnd(32, "0").slice(0, 32)),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    keyBuffer,
    dataBuffer
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}
async function decrypt$1(encryptedData, key) {
  const encoder = new TextEncoder();
  const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const keyBuffer = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key.padEnd(32, "0").slice(0, 32)),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    keyBuffer,
    data
  );
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// utils/validation.ts
var validation_exports = {};
__export(validation_exports, {
  isValidEmail: () => isValidEmail$1,
  isValidPassword: () => isValidPassword$1,
  isValidURL: () => isValidURL$1,
  validateArray: () => validateArray$1,
  validateNumber: () => validateNumber$1,
  validateObject: () => validateObject$1,
  validateRequired: () => validateRequired$1,
  validateString: () => validateString$1
});
function isValidEmail$1(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function isValidURL$1(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
function isValidPassword$1(password, minLength = 8) {
  return password.length >= minLength;
}
function validateRequired$1(value, fieldName) {
  if (value === null || value === void 0 || value === "") {
    throw new Error(`${fieldName} is required`);
  }
}
function validateString$1(value, fieldName, options) {
  validateRequired$1(value, fieldName);
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }
  if (options?.minLength && value.length < options.minLength) {
    throw new Error(`${fieldName} must be at least ${options.minLength} characters`);
  }
  if (options?.maxLength && value.length > options.maxLength) {
    throw new Error(`${fieldName} must be at most ${options.maxLength} characters`);
  }
  if (options?.pattern && !options.pattern.test(value)) {
    throw new Error(`${fieldName} has invalid format`);
  }
}
function validateNumber$1(value, fieldName, options) {
  validateRequired$1(value, fieldName);
  if (typeof value !== "number" || isNaN(value)) {
    throw new Error(`${fieldName} must be a number`);
  }
  if (options?.integer && !Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer`);
  }
  if (options?.min !== void 0 && value < options.min) {
    throw new Error(`${fieldName} must be at least ${options.min}`);
  }
  if (options?.max !== void 0 && value > options.max) {
    throw new Error(`${fieldName} must be at most ${options.max}`);
  }
}
function validateArray$1(value, fieldName, options) {
  validateRequired$1(value, fieldName);
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }
  if (options?.minLength && value.length < options.minLength) {
    throw new Error(`${fieldName} must have at least ${options.minLength} items`);
  }
  if (options?.maxLength && value.length > options.maxLength) {
    throw new Error(`${fieldName} must have at most ${options.maxLength} items`);
  }
  if (options?.itemValidator) {
    value.forEach((item, index) => {
      try {
        options.itemValidator(item);
      } catch (error) {
        throw new Error(`${fieldName}[${index}]: ${error.message}`);
      }
    });
  }
}
function validateObject$1(value, fieldName, schema) {
  validateRequired$1(value, fieldName);
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${fieldName} must be an object`);
  }
  for (const [key, validator] of Object.entries(schema)) {
    try {
      validator(value[key]);
    } catch (error) {
      throw new Error(`${fieldName}.${key}: ${error.message}`);
    }
  }
}

// plugins/react.tsx
var react_exports = {};
__export(react_exports, {
  useCache: () => useCache$2,
  useOptimistic: () => useOptimistic$2,
  useQuery: () => useQuery$2,
  useRAFT: () => useRAFT$2,
  useStream: () => useStream$2
});
var import_react = require("react");
function useRAFT$2(raft) {
  const [ready, setReady] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    raft.init().then(() => setReady(true));
  }, [raft]);
  return { raft, ready };
}
function useQuery$2(raft, resourceType, options) {
  const [data, setData] = (0, import_react.useState)([]);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [error, setError] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await raft.query.query(resourceType, options);
        if (!cancelled) {
          setData(result.data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [raft, resourceType, JSON.stringify(options)]);
  return { data, loading, error };
}
function useOptimistic$2(raft, resourceType) {
  const [data, setData] = (0, import_react.useState)(null);
  const [pending, setPending] = (0, import_react.useState)(false);
  const create = (0, import_react.useCallback)(async (optimisticData, actualRequest) => {
    setPending(true);
    setData(optimisticData);
    try {
      const result = await raft.optimistic.create(
        resourceType,
        optimisticData,
        actualRequest,
        {
          onSuccess: (result2) => setData(result2),
          onError: () => setData(null)
        }
      );
      return result;
    } finally {
      setPending(false);
    }
  }, [raft, resourceType]);
  return { data, pending, create };
}
function useStream$2(raft, channel) {
  const [messages, setMessages] = (0, import_react.useState)([]);
  const [connected, setConnected] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    let subscription;
    const connect = async () => {
      subscription = await raft.stream.subscribe(channel, (data) => {
        setMessages((prev) => [...prev, data]);
      });
      setConnected(true);
    };
    connect();
    return () => {
      if (subscription) {
        subscription.unsubscribe();
        setConnected(false);
      }
    };
  }, [raft, channel]);
  const broadcast = (0, import_react.useCallback)(async (data) => {
    await raft.stream.broadcast(channel, data);
  }, [raft, channel]);
  return { messages, connected, broadcast };
}
function useCache$2(raft, key) {
  const [data, setData] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(true);
  (0, import_react.useEffect)(() => {
    const loadCache = async () => {
      const cached = await raft.cache.get(key);
      setData(cached);
      setLoading(false);
    };
    loadCache();
  }, [raft, key]);
  const setCache = (0, import_react.useCallback)(async (value, options) => {
    await raft.cache.set(key, value, options);
    setData(value);
  }, [raft, key]);
  return { data, loading, setCache };
}

// plugins/vue.ts
var vue_exports = {};
__export(vue_exports, {
  useCache: () => useCache2,
  useOptimistic: () => useOptimistic2,
  useQuery: () => useQuery2,
  useRAFT: () => useRAFT2,
  useStream: () => useStream2
});
function getVue() {
  try {
    return require("vue");
  } catch (e) {
    throw new Error(
      "Vue is not installed. Install it with: npm install vue\nFrontendRAFT Vue plugin requires Vue 3+ as a peer dependency."
    );
  }
}
function useRAFT2(raft) {
  const vue = getVue();
  const ready = vue.ref(false);
  vue.onMounted(async () => {
    await raft.init();
    ready.value = true;
  });
  return { raft, ready };
}
function useQuery2(raft, resourceType, options) {
  const vue = getVue();
  const data = vue.ref([]);
  const loading = vue.ref(true);
  const error = vue.ref(null);
  const fetchData = async () => {
    try {
      loading.value = true;
      const result = await raft.query.query(resourceType, options);
      data.value = result.data;
      error.value = null;
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  };
  vue.onMounted(fetchData);
  return { data, loading, error, refetch: fetchData };
}
function useOptimistic2(raft, resourceType) {
  const vue = getVue();
  const data = vue.ref(null);
  const pending = vue.ref(false);
  const create = async (optimisticData, actualRequest) => {
    pending.value = true;
    data.value = optimisticData;
    try {
      const result = await raft.optimistic.create(
        resourceType,
        optimisticData,
        actualRequest,
        {
          onSuccess: (result2) => {
            data.value = result2;
          },
          onError: () => {
            data.value = null;
          }
        }
      );
      return result;
    } finally {
      pending.value = false;
    }
  };
  return { data, pending, create };
}
function useStream2(raft, channel) {
  const vue = getVue();
  const messages = vue.ref([]);
  const connected = vue.ref(false);
  let subscription;
  vue.onMounted(async () => {
    subscription = await raft.stream.subscribe(channel, (data) => {
      messages.value.push(data);
    });
    connected.value = true;
  });
  vue.onUnmounted(() => {
    if (subscription) {
      subscription.unsubscribe();
      connected.value = false;
    }
  });
  const broadcast = async (data) => {
    await raft.stream.broadcast(channel, data);
  };
  return { messages, connected, broadcast };
}
function useCache2(raft, key) {
  const vue = getVue();
  const data = vue.ref(null);
  const loading = vue.ref(true);
  vue.onMounted(async () => {
    const cached = await raft.cache.get(key);
    data.value = cached;
    loading.value = false;
  });
  const setCache = async (value, options) => {
    await raft.cache.set(key, value, options);
    data.value = value;
  };
  return { data, loading, setCache };
}

/**
 * FrontendRAFT - Core Types
 *
 * Type definitions for the RAFT protocol (Reactive API for Frontend Transformation)
 * RAFT = Reactive API for Frontend Transformation
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */
interface RAFTConfig {
    name: string;
    version?: string;
    autoRegister?: boolean;
    cdn?: {
        registryUrl: string;
    };
    auth?: {
        jwtSecret?: string;
        tokenExpiry?: number;
    };
    cache?: {
        enabled?: boolean;
        defaultTTL?: number;
        maxSize?: number;
    };
    rateLimit?: {
        windowMs?: number;
        maxRequests?: number;
    };
    cors?: {
        origins?: string[];
        methods?: string[];
        credentials?: boolean;
    };
}
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
interface HTTPHeaders {
    [key: string]: string;
}
interface RAFTRequest {
    method: HTTPMethod;
    path: string;
    headers: HTTPHeaders;
    body?: any;
    query?: Record<string, string>;
    params?: Record<string, string>;
    user?: any;
}
interface RAFTResponse {
    status: number;
    data?: any;
    error?: string;
    headers?: HTTPHeaders;
}
interface UserCredentials {
    email: string;
    password: string;
}
interface UserData {
    id: string;
    email: string;
    passwordHash: string;
    plan: 'free' | 'pro' | 'enterprise';
    quota: number;
    usedQuota: number;
    createdAt: number;
    metadata?: Record<string, any>;
}
interface TokenPayload {
    userId: string;
    email: string;
    plan: string;
    apiId: string;
    exp: number;
}
type RouteHandler = (req: RAFTRequest) => Promise<any> | any;
type Middleware = (req: RAFTRequest, next: () => Promise<any>) => Promise<any>;
interface RouteDefinition {
    method: HTTPMethod;
    path: string;
    handler: RouteHandler;
    middleware?: Middleware[];
}
interface CacheOptions {
    ttl?: number;
    tags?: string[];
    revalidate?: boolean;
}
interface CacheEntry {
    key: string;
    value: any;
    timestamp: number;
    ttl: number;
    tags: string[];
    size: number;
}
type CacheStrategy = 'memory' | 'indexeddb' | 'hybrid';
interface StreamOptions {
    channel: string;
    filter?: (data: any) => boolean;
}
type StreamCallback = (data: any) => void;
interface StreamSubscription {
    channel: string;
    callback: StreamCallback;
    unsubscribe: () => Promise<void>;
}
interface BatchRequest {
    id: string;
    method: HTTPMethod;
    path: string;
    body?: any;
}
interface BatchResponse {
    id: string;
    status: number;
    data?: any;
    error?: string;
}
interface BatchOptions {
    maxBatchSize?: number;
    batchWindowMs?: number;
}
interface OptimisticUpdate {
    id: string;
    operation: 'create' | 'update' | 'delete';
    resourceType: string;
    resourceId: string;
    optimisticData: any;
    actualRequest: () => Promise<any>;
    rollback: () => Promise<void>;
    timestamp: number;
}
interface OptimisticOptions {
    onSuccess?: (result: any) => void;
    onError?: (error: any) => void;
    rollbackOnError?: boolean;
}
interface QueryOptions {
    select?: string[];
    where?: Record<string, any>;
    orderBy?: {
        field: string;
        direction: 'asc' | 'desc';
    };
    limit?: number;
    offset?: number;
    include?: string[];
}
interface QueryResult<T = any> {
    data: T[];
    total: number;
    hasMore: boolean;
}
interface P2PConfig {
    enabled?: boolean;
    signaling?: {
        url: string;
    };
}
interface P2PMessage {
    type: 'request' | 'response' | 'broadcast';
    requestId?: string;
    apiId: string;
    data: any;
    timestamp: number;
}
interface APIMetadata {
    apiId: string;
    name: string;
    version: string;
    siteUrl: string;
    p2pAddress?: string;
    endpoints: EndpointMetadata[];
    registeredAt: number;
    status: 'online' | 'offline';
}
interface EndpointMetadata {
    method: HTTPMethod;
    path: string;
    description?: string;
    requiresAuth: boolean;
    rateLimit?: {
        maxRequests: number;
        windowMs: number;
    };
}
interface CSOPInstance {
    dispatch: (action: string, payload: any, options?: any) => Promise<any>;
    init: () => Promise<void>;
    getCapability?: (name: string) => any;
}
declare class RAFTError extends Error {
    code: string;
    statusCode: number;
    details?: any | undefined;
    constructor(code: string, message: string, statusCode?: number, details?: any | undefined);
}
declare const ErrorCodes: {
    readonly AUTH_REQUIRED: "AUTH_REQUIRED";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly QUOTA_EXCEEDED: "QUOTA_EXCEEDED";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};

/**
 * FrontendRAFT - Storage Layer
 *
 * Wrapper around CSOP storage capability (IndexedDB + Turso fallback)
 * Provides simple key-value interface for all RAFT data persistence.
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

/**
 * Storage layer wrapping CSOP storage
 *
 * @example
 * ```typescript
 * await storage.save('user:123', { name: 'Alice' });
 * const user = await storage.get('user:123');
 * await storage.delete('user:123');
 * ```
 */
declare class StorageLayer {
    private csop;
    constructor(csop: CSOPInstance);
    /**
     * Save data to storage
     */
    save(key: string, data: any): Promise<void>;
    /**
     * Get data from storage
     */
    get<T = any>(key: string): Promise<T>;
    /**
     * Delete data from storage
     */
    delete(key: string): Promise<void>;
    /**
     * List all keys with optional prefix
     */
    list(prefix?: string): Promise<string[]>;
    /**
     * Check if key exists
     */
    exists(key: string): Promise<boolean>;
}

/**
 * FrontendRAFT - Authentication Layer
 *
 * JWT-based authentication with user management stored via CSOP.
 * Handles signup, login, token generation and validation.
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

/**
 * Authentication layer with JWT
 *
 * @example
 * ```typescript
 * const token = await auth.signup('user@email.com', 'password123', {
 *   plan: 'free',
 *   quota: 1000
 * });
 *
 * const user = await auth.validateToken(token);
 * ```
 */
declare class AuthLayer {
    private csop;
    private storage;
    private secret;
    private tokenExpiry;
    constructor(csop: CSOPInstance, storage: StorageLayer, config?: {
        jwtSecret?: string;
        tokenExpiry?: number;
    });
    /**
     * Create new user account
     */
    signup(email: string, password: string, options?: {
        plan?: 'free' | 'pro' | 'enterprise';
        quota?: number;
    }): Promise<string>;
    /**
     * Login existing user
     */
    login(email: string, password: string): Promise<string>;
    /**
     * Validate JWT token
     */
    validateToken(token: string): Promise<UserData>;
    /**
     * Generate JWT token
     */
    generateToken(payload: TokenPayload): string;
    /**
     * Decode JWT token
     * @private
     */
    private decodeToken;
    /**
     * Hash password
     * @private
     */
    private hashPassword;
    /**
     * Verify password
     * @private
     */
    private verifyPassword;
    /**
     * Sign data with secret
     * @private
     */
    private sign;
    /**
     * Base64 URL encode
     * @private
     */
    private base64UrlEncode;
    /**
     * Base64 URL decode
     * @private
     */
    private base64UrlDecode;
    /**
     * Generate random secret
     * @private
     */
    private generateSecret;
    /**
     * Update user quota
     */
    incrementQuota(userId: string): Promise<void>;
    /**
     * Check if user has quota available
     */
    hasQuotaAvailable(userId: string): Promise<boolean>;
}

/**
 * FrontendRAFT - Router
 *
 * HTTP-style routing with middleware support, rate limiting, and CORS.
 * Compatible with REST conventions (GET, POST, PUT, DELETE, PATCH).
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

/**
 * HTTP router with middleware
 *
 * @example
 * ```typescript
 * router.get('/users/:id', async (req) => {
 *   return { user: { id: req.params.id } };
 * });
 *
 * router.use(async (req, next) => {
 *   console.log(req.method, req.path);
 *   return next();
 * });
 * ```
 */
declare class Router {
    private routes;
    private globalMiddleware;
    private auth;
    private rateLimitMap;
    private rateLimitConfig;
    private corsConfig;
    constructor(auth: AuthLayer, rateLimitConfig?: RAFTConfig['rateLimit'], corsConfig?: RAFTConfig['cors']);
    /**
     * Register GET route
     */
    get(path: string, handler: RouteHandler, middleware?: Middleware[]): void;
    /**
     * Register POST route
     */
    post(path: string, handler: RouteHandler, middleware?: Middleware[]): void;
    /**
     * Register PUT route
     */
    put(path: string, handler: RouteHandler, middleware?: Middleware[]): void;
    /**
     * Register DELETE route
     */
    delete(path: string, handler: RouteHandler, middleware?: Middleware[]): void;
    /**
     * Register PATCH route
     */
    patch(path: string, handler: RouteHandler, middleware?: Middleware[]): void;
    /**
     * Register route
     * @private
     */
    private register;
    /**
     * Add global middleware
     */
    use(middleware: Middleware): void;
    /**
     * Handle incoming request
     */
    handle(request: RAFTRequest): Promise<RAFTResponse>;
    /**
     * Find matching route
     * @private
     */
    private findRoute;
    /**
     * Match route pattern (supports :param)
     * @private
     */
    private matchPattern;
    /**
     * Extract route parameters
     * @private
     */
    private extractParams;
    /**
     * Check rate limit
     * @private
     */
    private checkRateLimit;
    /**
     * Handle CORS preflight
     * @private
     */
    private handleCORS;
    /**
     * Get CORS headers
     * @private
     */
    private getCORSHeaders;
    /**
     * Handle errors
     * @private
     */
    private handleError;
    /**
     * Get all registered endpoints
     */
    getEndpoints(): EndpointMetadata[];
}

/**
 * FrontendRAFT - Compute Layer
 *
 * Wrapper around CSOP compute capability (Web Workers parallelization)
 * Enables heavy computation without blocking UI.
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

/**
 * Compute layer wrapping CSOP compute
 *
 * @example
 * ```typescript
 * const result = await compute.execute('custom', {
 *   fn: 'return data.items.filter(x => x.score > 0.8)',
 *   args: { items: bigDataset }
 * });
 * ```
 */
declare class ComputeLayer {
    private csop;
    constructor(csop: CSOPInstance);
    /**
     * Execute computation task
     */
    execute(task: string, data: any): Promise<any>;
    /**
     * Execute batch of tasks in parallel
     */
    batch(tasks: Array<{
        task: string;
        data: any;
    }>): Promise<any[]>;
    /**
     * Execute custom function
     */
    executeFunction(fn: string, args: any): Promise<any>;
}

/**
 * FrontendRAFT - P2P Layer
 *
 * WebRTC peer-to-peer communication via CSOP sync.
 * Enables direct browser-to-browser API calls.
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

declare class P2PLayer {
    private csop;
    private peerId;
    private connections;
    constructor(csop: CSOPInstance);
    setupConnection(apiId: string): Promise<void>;
    sendRequest(apiId: string, request: any): Promise<any>;
    private handleMessage;
    getPeerId(): string;
}

/**
 * FrontendRAFT - CDN Client
 *
 * Client for CDN registry communication.
 * Handles API registration and discovery.
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

declare class CDNClient {
    private csop;
    private registryUrl;
    constructor(csop: CSOPInstance, config?: RAFTConfig['cdn']);
    register(metadata: Omit<APIMetadata, 'registeredAt' | 'status'>): Promise<{
        publicUrl: string;
    }>;
    heartbeat(apiId: string): Promise<void>;
    discover(apiId: string): Promise<APIMetadata | null>;
}

/**
 * FrontendRAFT - Smart Caching Layer
 *
 * Multi-level intelligent caching with TTL, tags, and LRU eviction.
 * RAFT Feature #2: Smart Caching
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

declare class CacheLayer {
    private storage;
    private memoryCache;
    private config;
    private stats;
    constructor(storage: StorageLayer, config?: RAFTConfig['cache']);
    get<T = any>(key: string): Promise<T | null>;
    set(key: string, value: any, options?: CacheOptions): Promise<void>;
    delete(key: string): Promise<void>;
    invalidateTag(tag: string): Promise<void>;
    clear(): Promise<void>;
    getStats(): {
        hitRate: string;
        memoryEntries: number;
        memorySize: number;
        hits: number;
        misses: number;
        sets: number;
        evictions: number;
    };
    private isExpired;
    private estimateSize;
    private getCurrentSize;
    private evictIfNeeded;
    private startCleanupTimer;
    memoize<T extends (...args: any[]) => Promise<any>>(fn: T, options?: CacheOptions): T;
}

/**
 * FrontendRAFT - Streaming Manager
 *
 * Real-time streaming via async generators and CSOP sync.
 * RAFT Feature #1: Streaming API
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

declare class StreamManager {
    private csop;
    private subscriptions;
    private activeStreams;
    constructor(csop: CSOPInstance);
    subscribe(channel: string, callback: StreamCallback, options?: Omit<StreamOptions, 'channel'>): Promise<StreamSubscription>;
    broadcast(channel: string, data: any): Promise<void>;
    stream(channel: string, options?: Omit<StreamOptions, 'channel'>): AsyncGenerator<any, void, unknown>;
    private setupChannelListener;
    getActiveSubscriptions(): number;
    getActiveChannels(): string[];
    closeAll(): Promise<void>;
}

/**
 * FrontendRAFT - Batch Manager
 *
 * Automatic request batching to reduce network overhead.
 * RAFT Feature #3: Auto-Batching
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

declare class BatchManager {
    private router;
    private pendingBatch;
    private batchTimer;
    private config;
    private stats;
    constructor(router: Router, options?: BatchOptions);
    fetch(method: HTTPMethod, path: string, body?: any): Promise<any>;
    private executeBatch;
    getStats(): {
        efficiency: string;
        totalRequests: number;
        batchedRequests: number;
        batches: number;
        averageBatchSize: number;
    };
    executeBatchManual(requests: BatchRequest[]): Promise<BatchResponse[]>;
}

/**
 * FrontendRAFT - Optimistic Engine
 *
 * Optimistic updates for instant UI feedback with automatic rollback.
 * RAFT Feature #4: Optimistic Updates
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

declare class OptimisticEngine {
    private storage;
    private cache;
    private pendingUpdates;
    private stats;
    constructor(storage: StorageLayer, cache: CacheLayer);
    create<T>(resourceType: string, optimisticData: T, actualRequest: () => Promise<T>, options?: OptimisticOptions): Promise<T>;
    update<T>(resourceType: string, resourceId: string, optimisticData: Partial<T>, actualRequest: () => Promise<T>, options?: OptimisticOptions): Promise<T>;
    delete(resourceType: string, resourceId: string, actualRequest: () => Promise<void>, options?: OptimisticOptions): Promise<void>;
    private executeActualRequest;
    getPendingUpdates(): OptimisticUpdate[];
    getStats(): {
        successRate: string;
        rollbackRate: string;
        total: number;
        succeeded: number;
        rolledBack: number;
    };
}

/**
 * FrontendRAFT - Query Engine
 *
 * GraphQL-like query language for efficient data fetching.
 * RAFT Feature #5: Query Language
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

declare class QueryEngine {
    private storage;
    constructor(storage: StorageLayer);
    query<T = any>(resourceType: string, options?: QueryOptions): Promise<QueryResult<T>>;
    findOne<T = any>(resourceType: string, options?: QueryOptions): Promise<T | null>;
    count(resourceType: string, options?: Pick<QueryOptions, 'where'>): Promise<number>;
    private applyFilters;
    private applySorting;
    private applySelection;
    buildQuery(options: QueryOptions): string;
}

declare class FrontendRAFT {
    private config;
    private csop;
    private initialized;
    auth: AuthLayer | null;
    router: Router | null;
    storage: StorageLayer | null;
    compute: ComputeLayer | null;
    p2p: P2PLayer | null;
    cdn: CDNClient | null;
    cache: CacheLayer | null;
    stream: StreamManager | null;
    batch: BatchManager | null;
    optimistic: OptimisticEngine | null;
    query: QueryEngine | null;
    apiId: string | null;
    publicUrl: string | null;
    constructor(config: RAFTConfig);
    init(): Promise<void>;
    private autoRegister;
    get(path: string, handler: RouteHandler): void;
    post(path: string, handler: RouteHandler): void;
    put(path: string, handler: RouteHandler): void;
    delete(path: string, handler: RouteHandler): void;
    patch(path: string, handler: RouteHandler): void;
    use(middleware: Middleware): void;
    publish(): Promise<string>;
    getMetadata(): {
        apiId: string | null;
        name: string;
        version: string | undefined;
        publicUrl: string | null;
        endpoints: undefined[];
    };
    private ensureInitialized;
    private logBanner;
}

/**
 * FrontendRAFT - JWT Utilities
 *
 * Helper functions for JWT token operations.
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */
declare function base64UrlEncode(str: string): string;
declare function base64UrlDecode(str: string): string;
declare function parseJWT(token: string): any;
declare function isTokenExpired(token: string): boolean;
declare function getTokenExpiryDate(token: string): Date | null;

declare const jwt_base64UrlDecode: typeof base64UrlDecode;
declare const jwt_base64UrlEncode: typeof base64UrlEncode;
declare const jwt_getTokenExpiryDate: typeof getTokenExpiryDate;
declare const jwt_isTokenExpired: typeof isTokenExpired;
declare const jwt_parseJWT: typeof parseJWT;
declare namespace jwt {
  export { jwt_base64UrlDecode as base64UrlDecode, jwt_base64UrlEncode as base64UrlEncode, jwt_getTokenExpiryDate as getTokenExpiryDate, jwt_isTokenExpired as isTokenExpired, jwt_parseJWT as parseJWT };
}

/**
 * FrontendRAFT - Crypto Utilities
 *
 * Cryptographic helper functions.
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */
declare function hashSHA256(data: string): Promise<string>;
declare function generateUUID(): string;
declare function generateRandomString(length?: number): string;
declare function encrypt(data: string, key: string): Promise<string>;
declare function decrypt(encryptedData: string, key: string): Promise<string>;

declare const crypto$1_decrypt: typeof decrypt;
declare const crypto$1_encrypt: typeof encrypt;
declare const crypto$1_generateRandomString: typeof generateRandomString;
declare const crypto$1_generateUUID: typeof generateUUID;
declare const crypto$1_hashSHA256: typeof hashSHA256;
declare namespace crypto$1 {
  export { crypto$1_decrypt as decrypt, crypto$1_encrypt as encrypt, crypto$1_generateRandomString as generateRandomString, crypto$1_generateUUID as generateUUID, crypto$1_hashSHA256 as hashSHA256 };
}

/**
 * FrontendRAFT - Validation Utilities
 *
 * Data validation helper functions.
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */
declare function isValidEmail(email: string): boolean;
declare function isValidURL(url: string): boolean;
declare function isValidPassword(password: string, minLength?: number): boolean;
declare function validateRequired(value: any, fieldName: string): void;
declare function validateString(value: any, fieldName: string, options?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
}): void;
declare function validateNumber(value: any, fieldName: string, options?: {
    min?: number;
    max?: number;
    integer?: boolean;
}): void;
declare function validateArray(value: any, fieldName: string, options?: {
    minLength?: number;
    maxLength?: number;
    itemValidator?: (item: any) => void;
}): void;
declare function validateObject(value: any, fieldName: string, schema: Record<string, (val: any) => void>): void;

declare const validation_isValidEmail: typeof isValidEmail;
declare const validation_isValidPassword: typeof isValidPassword;
declare const validation_isValidURL: typeof isValidURL;
declare const validation_validateArray: typeof validateArray;
declare const validation_validateNumber: typeof validateNumber;
declare const validation_validateObject: typeof validateObject;
declare const validation_validateRequired: typeof validateRequired;
declare const validation_validateString: typeof validateString;
declare namespace validation {
  export { validation_isValidEmail as isValidEmail, validation_isValidPassword as isValidPassword, validation_isValidURL as isValidURL, validation_validateArray as validateArray, validation_validateNumber as validateNumber, validation_validateObject as validateObject, validation_validateRequired as validateRequired, validation_validateString as validateString };
}

/**
 * FrontendRAFT - React Plugin
 *
 * React hooks and utilities for FrontendRAFT.
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

declare function useRAFT$1(raft: FrontendRAFT): {
    raft: FrontendRAFT;
    ready: boolean;
};
declare function useQuery$1<T>(raft: FrontendRAFT, resourceType: string, options?: QueryOptions): {
    data: T[];
    loading: boolean;
    error: Error | null;
};
declare function useOptimistic$1<T>(raft: FrontendRAFT, resourceType: string): {
    data: T | null;
    pending: boolean;
    create: (optimisticData: T, actualRequest: () => Promise<T>) => Promise<T>;
};
declare function useStream$1<T>(raft: FrontendRAFT, channel: string): {
    messages: T[];
    connected: boolean;
    broadcast: (data: T) => Promise<void>;
};
declare function useCache$1<T>(raft: FrontendRAFT, key: string): {
    data: T | null;
    loading: boolean;
    setCache: (value: T, options?: any) => Promise<void>;
};

declare namespace react {
  export { useCache$1 as useCache, useOptimistic$1 as useOptimistic, useQuery$1 as useQuery, useRAFT$1 as useRAFT, useStream$1 as useStream };
}

/**
 * FrontendRAFT - Vue Plugin
 *
 * Vue composables for FrontendRAFT.
 * Note: Requires Vue 3+ to be installed separately.
 *
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 *
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

type Ref<T> = {
    value: T;
};
declare function useRAFT(raft: FrontendRAFT): {
    raft: FrontendRAFT;
    ready: Ref<boolean>;
};
declare function useQuery<T>(raft: FrontendRAFT, resourceType: string, options?: QueryOptions): {
    data: Ref<T[]>;
    loading: Ref<boolean>;
    error: Ref<Error | null>;
    refetch: () => Promise<void>;
};
declare function useOptimistic<T>(raft: FrontendRAFT, resourceType: string): {
    data: Ref<T | null>;
    pending: Ref<boolean>;
    create: (optimisticData: T, actualRequest: () => Promise<T>) => Promise<T>;
};
declare function useStream<T>(raft: FrontendRAFT, channel: string): {
    messages: Ref<T[]>;
    connected: Ref<boolean>;
    broadcast: (data: T) => Promise<void>;
};
declare function useCache<T>(raft: FrontendRAFT, key: string): {
    data: Ref<T | null>;
    loading: Ref<boolean>;
    setCache: (value: T, options?: any) => Promise<void>;
};

declare const vue_useCache: typeof useCache;
declare const vue_useOptimistic: typeof useOptimistic;
declare const vue_useQuery: typeof useQuery;
declare const vue_useRAFT: typeof useRAFT;
declare const vue_useStream: typeof useStream;
declare namespace vue {
  export { vue_useCache as useCache, vue_useOptimistic as useOptimistic, vue_useQuery as useQuery, vue_useRAFT as useRAFT, vue_useStream as useStream };
}

export { type APIMetadata, AuthLayer, BatchManager, type BatchOptions, type BatchRequest, type BatchResponse, CDNClient, type CSOPInstance, type CacheEntry, CacheLayer, type CacheOptions, type CacheStrategy, ComputeLayer, type EndpointMetadata, ErrorCodes, FrontendRAFT, type HTTPHeaders, type HTTPMethod, type Middleware, OptimisticEngine, type OptimisticOptions, type OptimisticUpdate, type P2PConfig, P2PLayer, type P2PMessage, QueryEngine, type QueryOptions, type QueryResult, type RAFTConfig, RAFTError, type RAFTRequest, type RAFTResponse, type RouteDefinition, type RouteHandler, Router, StorageLayer, type StreamCallback, StreamManager, type StreamOptions, type StreamSubscription, type TokenPayload, type UserCredentials, type UserData, crypto$1 as crypto, jwt, react, validation, vue };
