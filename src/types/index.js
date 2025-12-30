/**
 * FrontendRAFT - Type Definitions
 * 
 * Core type definitions and validators for RAFT protocol
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

/**
 * @typedef {Object} RAFTConfig
 * @property {string} name - API name
 * @property {string} [version='1.0.0'] - API version
 * @property {boolean} [autoRegister=true] - Auto-register on CDN
 * @property {AuthConfig} [auth] - Authentication configuration
 * @property {CacheConfig} [cache] - Cache configuration
 * @property {RateLimitConfig} [rateLimit] - Rate limiting configuration
 */

/**
 * @typedef {Object} AuthConfig
 * @property {string} type - Auth type: 'jwt', 'apikey', 'oauth2', 'none'
 * @property {string} [secret] - JWT secret
 * @property {number} [expiresIn=2592000000] - Token expiration (30 days default)
 */

/**
 * @typedef {Object} CacheConfig
 * @property {boolean} [enabled=true] - Enable caching
 * @property {number} [ttl=300000] - Cache TTL in ms (5 min default)
 * @property {number} [maxSize=50] - Max cached items
 * @property {string} [strategy='lru'] - Cache strategy: 'lru', 'lfu', 'fifo'
 */

/**
 * @typedef {Object} RateLimitConfig
 * @property {number} [windowMs=60000] - Time window in ms
 * @property {number} [maxRequests=100] - Max requests per window
 */

/**
 * @typedef {Object} RouteHandler
 * @property {string} method - HTTP method
 * @property {string} path - Route path
 * @property {Function} handler - Handler function
 * @property {Object} [middleware] - Middleware configuration
 */

/**
 * @typedef {Object} RAFTRequest
 * @property {string} id - Request ID
 * @property {string} method - HTTP method
 * @property {string} path - Request path
 * @property {Object} headers - Request headers
 * @property {Object} [body] - Request body
 * @property {Object} [query] - Query parameters
 * @property {Object} [params] - Route parameters
 * @property {Object} [user] - Authenticated user
 */

/**
 * @typedef {Object} RAFTResponse
 * @property {number} status - HTTP status code
 * @property {Object} [data] - Response data
 * @property {Object} [headers] - Response headers
 * @property {string} [error] - Error message
 */

/**
 * @typedef {Object} StreamConfig
 * @property {string} channel - Stream channel name
 * @property {Function} generator - Async generator function
 * @property {number} [interval=1000] - Stream interval in ms
 */

/**
 * @typedef {Object} QueryOptions
 * @property {string[]} [select] - Fields to select
 * @property {Object} [where] - Filter conditions
 * @property {string[]} [orderBy] - Sort fields
 * @property {number} [limit] - Result limit
 * @property {number} [offset] - Result offset
 */

/**
 * @typedef {Object} CacheEntry
 * @property {string} key - Cache key
 * @property {*} value - Cached value
 * @property {number} timestamp - Creation timestamp
 * @property {number} ttl - Time to live
 * @property {number} hits - Access count
 */

/**
 * @typedef {Object} BatchRequest
 * @property {string} id - Batch ID
 * @property {RAFTRequest[]} requests - Array of requests
 * @property {boolean} [parallel=true] - Execute in parallel
 */

/**
 * @typedef {Object} OptimisticUpdate
 * @property {string} id - Update ID
 * @property {string} entity - Entity type
 * @property {Object} data - Optimistic data
 * @property {Function} rollback - Rollback function
 */

export const RAFT_VERSION = '0.1.0';
export const PROTOCOL_NAME = 'RAFT';
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
export const AUTH_TYPES = ['jwt', 'apikey', 'oauth2', 'none'];
export const CACHE_STRATEGIES = ['lru', 'lfu', 'fifo'];

export const DEFAULT_CONFIG = {
  version: '1.0.0',
  autoRegister: true,
  auth: {
    type: 'jwt',
    expiresIn: 30 * 24 * 60 * 60 * 1000
  },
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000,
    maxSize: 50,
    strategy: 'lru'
  },
  rateLimit: {
    windowMs: 60000,
    maxRequests: 100
  }
};