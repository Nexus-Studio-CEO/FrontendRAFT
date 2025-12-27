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

// ============================================================================
// RAFT Configuration
// ============================================================================

export interface RAFTConfig {
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

// ============================================================================
// HTTP Types
// ============================================================================

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export interface HTTPHeaders {
  [key: string]: string;
}

export interface RAFTRequest {
  method: HTTPMethod;
  path: string;
  headers: HTTPHeaders;
  body?: any;
  query?: Record<string, string>;
  params?: Record<string, string>;
  user?: any;
}

export interface RAFTResponse {
  status: number;
  data?: any;
  error?: string;
  headers?: HTTPHeaders;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserData {
  id: string;
  email: string;
  passwordHash: string;
  plan: 'free' | 'pro' | 'enterprise';
  quota: number;
  usedQuota: number;
  createdAt: number;
  metadata?: Record<string, any>;
}

export interface TokenPayload {
  userId: string;
  email: string;
  plan: string;
  apiId: string;
  exp: number;
}

// ============================================================================
// Router Types
// ============================================================================

export type RouteHandler = (req: RAFTRequest) => Promise<any> | any;

export type Middleware = (
  req: RAFTRequest,
  next: () => Promise<any>
) => Promise<any>;

export interface RouteDefinition {
  method: HTTPMethod;
  path: string;
  handler: RouteHandler;
  middleware?: Middleware[];
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  revalidate?: boolean;
}

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  tags: string[];
  size: number;
}

export type CacheStrategy = 'memory' | 'indexeddb' | 'hybrid';

// ============================================================================
// Streaming Types
// ============================================================================

export interface StreamOptions {
  channel: string;
  filter?: (data: any) => boolean;
}

export type StreamCallback = (data: any) => void;

export interface StreamSubscription {
  channel: string;
  callback: StreamCallback;
  unsubscribe: () => Promise<void>;
}

// ============================================================================
// Batching Types
// ============================================================================

export interface BatchRequest {
  id: string;
  method: HTTPMethod;
  path: string;
  body?: any;
}

export interface BatchResponse {
  id: string;
  status: number;
  data?: any;
  error?: string;
}

export interface BatchOptions {
  maxBatchSize?: number;
  batchWindowMs?: number;
}

// ============================================================================
// Optimistic Updates Types
// ============================================================================

export interface OptimisticUpdate {
  id: string;
  operation: 'create' | 'update' | 'delete';
  resourceType: string;
  resourceId: string;
  optimisticData: any;
  actualRequest: () => Promise<any>;
  rollback: () => Promise<void>;
  timestamp: number;
}

export interface OptimisticOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  rollbackOnError?: boolean;
}

// ============================================================================
// Query Language Types
// ============================================================================

export interface QueryOptions {
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

export interface QueryResult<T = any> {
  data: T[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// P2P Types
// ============================================================================

export interface P2PConfig {
  enabled?: boolean;
  signaling?: {
    url: string;
  };
}

export interface P2PMessage {
  type: 'request' | 'response' | 'broadcast';
  requestId?: string;
  apiId: string;
  data: any;
  timestamp: number;
}

// ============================================================================
// CDN Registry Types
// ============================================================================

export interface APIMetadata {
  apiId: string;
  name: string;
  version: string;
  siteUrl: string;
  p2pAddress?: string;
  endpoints: EndpointMetadata[];
  registeredAt: number;
  status: 'online' | 'offline';
}

export interface EndpointMetadata {
  method: HTTPMethod;
  path: string;
  description?: string;
  requiresAuth: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

// ============================================================================
// CSOP Integration Types
// ============================================================================

export interface CSOPInstance {
  dispatch: (action: string, payload: any, options?: any) => Promise<any>;
  init: () => Promise<void>;
  getCapability?: (name: string) => any;
}

// ============================================================================
// Error Types
// ============================================================================

export class RAFTError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'RAFTError';
  }
}

export const ErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;