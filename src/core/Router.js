/**
 * FrontendRAFT - HTTP Router
 * 
 * REST-compatible routing with middleware support.
 * Handles GET, POST, PUT, DELETE, PATCH methods.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

/**
 * HTTP Router
 * Express-like routing for FrontendRAFT APIs
 */
export class Router {
  /**
   * @param {StorageLayer} storage CSOP storage layer
   * @param {ComputeLayer} compute CSOP compute layer
   */
  constructor(storage, compute) {
    this.storage = storage;
    this.compute = compute;
    
    // Route registry
    this.routes = new Map();
    
    // Middleware stack
    this.middlewares = [];
    
    // Statistics
    this.stats = {
      requests: 0,
      errors: 0,
      avgDuration: 0
    };

    console.log('✅ Router initialized');
  }

  /**
   * Define a route
   * 
   * @param {string} route Route pattern (e.g., "GET /users/:id")
   * @param {Function} handler Route handler
   * 
   * @example
   * router.define('GET /users/:id', async (req) => {
   *   return { user: { id: req.params.id } };
   * });
   */
  define(route, handler) {
    const [method, path] = route.split(' ');
    const key = `${method.toUpperCase()}:${path}`;
    
    this.routes.set(key, {
      method: method.toUpperCase(),
      path,
      pattern: this._pathToRegex(path),
      handler
    });

    console.log(`📍 Route defined: ${route}`);
  }

  /**
   * Add middleware
   * 
   * @param {Function} middleware Middleware function
   * 
   * @example
   * router.use(async (req, next) => {
   *   console.log('Request:', req.method, req.path);
   *   return next();
   * });
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Handle HTTP request
   * 
   * @param {Object} request Request object
   * @returns {Promise<any>} Response data
   * 
   * @example
   * const response = await router.handle({
   *   method: 'GET',
   *   path: '/users/123',
   *   headers: { 'Authorization': 'Bearer token' },
   *   body: null
   * });
   */
  async handle(request) {
    const startTime = Date.now();
    this.stats.requests++;

    try {
      // Build request context
      const req = {
        method: request.method.toUpperCase(),
        path: request.path,
        headers: request.headers || {},
        body: request.body || null,
        params: {},
        query: this._parseQuery(request.path)
      };

      // Find matching route
      const route = this._findRoute(req.method, req.path);
      
      if (!route) {
        throw {
          status: 404,
          message: `Route not found: ${req.method} ${req.path}`
        };
      }

      // Extract path parameters
      req.params = this._extractParams(route, req.path);

      // Execute middleware chain
      let middlewareIndex = 0;
      const next = async () => {
        if (middlewareIndex < this.middlewares.length) {
          const middleware = this.middlewares[middlewareIndex++];
          return middleware(req, next);
        }
        // Execute route handler
        return route.handler(req);
      };

      const response = await next();

      // Update stats
      const duration = Date.now() - startTime;
      this._updateStats(duration);

      return {
        status: 200,
        data: response,
        duration
      };

    } catch (error) {
      this.stats.errors++;
      
      const duration = Date.now() - startTime;
      this._updateStats(duration);

      throw {
        status: error.status || 500,
        message: error.message || 'Internal server error',
        duration
      };
    }
  }

  /**
   * Convenience methods
   */
  get(path, handler) {
    this.define(`GET ${path}`, handler);
  }

  post(path, handler) {
    this.define(`POST ${path}`, handler);
  }

  put(path, handler) {
    this.define(`PUT ${path}`, handler);
  }

  delete(path, handler) {
    this.define(`DELETE ${path}`, handler);
  }

  patch(path, handler) {
    this.define(`PATCH ${path}`, handler);
  }

  /**
   * Get all defined endpoints
   * 
   * @returns {Array} List of endpoints
   */
  getEndpoints() {
    return Array.from(this.routes.values()).map(route => ({
      method: route.method,
      path: route.path
    }));
  }

  /**
   * Get routing statistics
   * 
   * @returns {Object} Router stats
   */
  getStats() {
    return {
      ...this.stats,
      routes: this.routes.size,
      middlewares: this.middlewares.length
    };
  }

  /**
   * Find matching route
   * @private
   */
  _findRoute(method, path) {
    for (const route of this.routes.values()) {
      if (route.method === method && route.pattern.test(path)) {
        return route;
      }
    }
    return null;
  }

  /**
   * Convert path pattern to regex
   * @private
   */
  _pathToRegex(path) {
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, '(?<$1>[^/]+)');
    
    return new RegExp(`^${pattern}$`);
  }

  /**
   * Extract path parameters
   * @private
   */
  _extractParams(route, path) {
    const match = route.pattern.exec(path);
    return match ? match.groups || {} : {};
  }

  /**
   * Parse query string
   * @private
   */
  _parseQuery(path) {
    const queryIndex = path.indexOf('?');
    if (queryIndex === -1) return {};

    const queryString = path.slice(queryIndex + 1);
    const params = new URLSearchParams(queryString);
    
    const query = {};
    for (const [key, value] of params.entries()) {
      query[key] = value;
    }
    
    return query;
  }

  /**
   * Update statistics
   * @private
   */
  _updateStats(duration) {
    const totalDuration = this.stats.avgDuration * (this.stats.requests - 1) + duration;
    this.stats.avgDuration = Math.round(totalDuration / this.stats.requests);
  }
}

export default Router;