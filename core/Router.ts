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

import type {
  HTTPMethod,
  RAFTRequest,
  RAFTResponse,
  RouteHandler,
  Middleware,
  RouteDefinition,
  EndpointMetadata,
  RAFTConfig
} from '../types';
import type { AuthLayer } from './AuthLayer';
import { RAFTError, ErrorCodes } from '../types';

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
export class Router {
  private routes: Map<string, RouteDefinition> = new Map();
  private globalMiddleware: Middleware[] = [];
  private auth: AuthLayer;
  private rateLimitMap: Map<string, number[]> = new Map();
  private rateLimitConfig: Required<NonNullable<RAFTConfig['rateLimit']>>;
  private corsConfig: Required<NonNullable<RAFTConfig['cors']>>;

  constructor(
    auth: AuthLayer,
    rateLimitConfig?: RAFTConfig['rateLimit'],
    corsConfig?: RAFTConfig['cors']
  ) {
    this.auth = auth;
    this.rateLimitConfig = {
      windowMs: rateLimitConfig?.windowMs || 60000,
      maxRequests: rateLimitConfig?.maxRequests || 100
    };
    this.corsConfig = {
      origins: corsConfig?.origins || ['*'],
      methods: corsConfig?.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: corsConfig?.credentials ?? true
    };
  }

  /**
   * Register GET route
   */
  get(path: string, handler: RouteHandler, middleware?: Middleware[]): void {
    this.register('GET', path, handler, middleware);
  }

  /**
   * Register POST route
   */
  post(path: string, handler: RouteHandler, middleware?: Middleware[]): void {
    this.register('POST', path, handler, middleware);
  }

  /**
   * Register PUT route
   */
  put(path: string, handler: RouteHandler, middleware?: Middleware[]): void {
    this.register('PUT', path, handler, middleware);
  }

  /**
   * Register DELETE route
   */
  delete(path: string, handler: RouteHandler, middleware?: Middleware[]): void {
    this.register('DELETE', path, handler, middleware);
  }

  /**
   * Register PATCH route
   */
  patch(path: string, handler: RouteHandler, middleware?: Middleware[]): void {
    this.register('PATCH', path, handler, middleware);
  }

  /**
   * Register route
   * @private
   */
  private register(
    method: HTTPMethod,
    path: string,
    handler: RouteHandler,
    middleware?: Middleware[]
  ): void {
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
  use(middleware: Middleware): void {
    this.globalMiddleware.push(middleware);
  }

  /**
   * Handle incoming request
   */
  async handle(request: RAFTRequest): Promise<RAFTResponse> {
    try {
      // CORS preflight
      if (request.method === 'OPTIONS') {
        return this.handleCORS();
      }

      // Rate limiting
      await this.checkRateLimit(request);

      // Find matching route
      const route = this.findRoute(request.method, request.path);
      if (!route) {
        throw new RAFTError(ErrorCodes.NOT_FOUND, `Route not found: ${request.method} ${request.path}`, 404);
      }

      // Extract params
      request.params = this.extractParams(route.path, request.path);

      // Execute middleware chain
      const middlewareChain = [...this.globalMiddleware, ...route.middleware];
      let index = 0;

      const next = async (): Promise<any> => {
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
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Find matching route
   * @private
   */
  private findRoute(method: HTTPMethod, path: string): RouteDefinition | null {
    // Try exact match first
    const exactKey = `${method}:${path}`;
    if (this.routes.has(exactKey)) {
      return this.routes.get(exactKey)!;
    }

    // Try pattern match
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
  private matchPattern(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        continue; // Param, always matches
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
  private extractParams(pattern: string, path: string): Record<string, string> {
    const params: Record<string, string> = {};
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
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
  private async checkRateLimit(request: RAFTRequest): Promise<void> {
    const key = request.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();

    // Get request timestamps for this key
    let timestamps = this.rateLimitMap.get(key) || [];
    
    // Remove old timestamps outside window
    timestamps = timestamps.filter(t => now - t < this.rateLimitConfig.windowMs);

    // Check limit
    if (timestamps.length >= this.rateLimitConfig.maxRequests) {
      throw new RAFTError(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded',
        429
      );
    }

    // Add current timestamp
    timestamps.push(now);
    this.rateLimitMap.set(key, timestamps);
  }

  /**
   * Handle CORS preflight
   * @private
   */
  private handleCORS(): RAFTResponse {
    return {
      status: 204,
      headers: this.getCORSHeaders()
    };
  }

  /**
   * Get CORS headers
   * @private
   */
  private getCORSHeaders(): Record<string, string> {
    return {
      'Access-Control-Allow-Origin': this.corsConfig.origins.join(','),
      'Access-Control-Allow-Methods': this.corsConfig.methods.join(','),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': this.corsConfig.credentials.toString()
    };
  }

  /**
   * Handle errors
   * @private
   */
  private handleError(error: any): RAFTResponse {
    if (error instanceof RAFTError) {
      return {
        status: error.statusCode,
        error: error.message,
        headers: this.getCORSHeaders()
      };
    }

    console.error('Unhandled error:', error);
    return {
      status: 500,
      error: 'Internal server error',
      headers: this.getCORSHeaders()
    };
  }

  /**
   * Get all registered endpoints
   */
  getEndpoints(): EndpointMetadata[] {
    const endpoints: EndpointMetadata[] = [];

    for (const route of this.routes.values()) {
      endpoints.push({
        method: route.method,
        path: route.path,
        requiresAuth: false, // TODO: detect from middleware
        rateLimit: {
          maxRequests: this.rateLimitConfig.maxRequests,
          windowMs: this.rateLimitConfig.windowMs
        }
      });
    }

    return endpoints;
  }
}