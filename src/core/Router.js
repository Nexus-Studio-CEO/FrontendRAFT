/**
 * FrontendRAFT - HTTP Router
 * 
 * Express-like routing with middleware support
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

import { Validator } from '../types/validator.js';

export class Router {
  constructor() {
    this.routes = [];
    this.middlewares = [];
    this.requestCount = 0;
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }

  _addRoute(method, path, handler) {
    this.routes.push({
      method: Validator.validateHTTPMethod(method),
      path: Validator.validatePath(path),
      handler,
      pattern: this._pathToRegex(path)
    });
  }

  get(path, handler) {
    this._addRoute('GET', path, handler);
  }

  post(path, handler) {
    this._addRoute('POST', path, handler);
  }

  put(path, handler) {
    this._addRoute('PUT', path, handler);
  }

  delete(path, handler) {
    this._addRoute('DELETE', path, handler);
  }

  patch(path, handler) {
    this._addRoute('PATCH', path, handler);
  }

  _pathToRegex(path) {
    const paramNames = [];
    const pattern = path
      .replace(/:([^/]+)/g, (match, paramName) => {
        paramNames.push(paramName);
        return '([^/]+)';
      })
      .replace(/\*/g, '.*');

    return {
      regex: new RegExp(`^${pattern}$`),
      paramNames
    };
  }

  _matchRoute(method, path) {
    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = path.match(route.pattern.regex);
      if (match) {
        const params = {};
        route.pattern.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return { route, params };
      }
    }

    return null;
  }

  async handle(request) {
    this.requestCount++;

    const req = {
      id: `req_${this.requestCount}_${Date.now()}`,
      method: Validator.validateHTTPMethod(request.method),
      path: Validator.validatePath(request.path),
      headers: Validator.sanitizeHeaders(request.headers || {}),
      body: request.body,
      query: Validator.sanitizeQuery(request.query || {}),
      params: {},
      startTime: Date.now()
    };

    try {
      for (const middleware of this.middlewares) {
        await this._executeMiddleware(middleware, req);
      }

      const match = this._matchRoute(req.method, req.path);

      if (!match) {
        return this._createResponse(404, { error: 'Route not found' });
      }

      req.params = match.params;

      const result = await match.route.handler(req);

      const responseData = result && typeof result === 'object' && result.status
        ? result
        : { status: 200, data: result };

      return this._createResponse(
        responseData.status,
        responseData.data || responseData,
        responseData.headers
      );

    } catch (error) {
      return this._createResponse(500, {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      req.duration = Date.now() - req.startTime;
    }
  }

  async _executeMiddleware(middleware, req) {
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await middleware(req, next);

    if (!nextCalled) {
      throw new Error('Middleware did not call next()');
    }
  }

  _createResponse(status, data, headers = {}) {
    return {
      status,
      data,
      headers: {
        'content-type': 'application/json',
        ...headers
      },
      timestamp: Date.now()
    };
  }

  getRoutes() {
    return this.routes.map(r => ({
      method: r.method,
      path: r.path
    }));
  }

  getStats() {
    return {
      totalRoutes: this.routes.length,
      totalMiddlewares: this.middlewares.length,
      totalRequests: this.requestCount,
      routes: this.getRoutes()
    };
  }

  cors(options = {}) {
    const defaultOptions = {
      origins: ['*'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization'],
      credentials: false
    };

    const config = { ...defaultOptions, ...options };

    return (req, next) => {
      req.headers['access-control-allow-origin'] = config.origins.join(', ');
      req.headers['access-control-allow-methods'] = config.methods.join(', ');
      req.headers['access-control-allow-headers'] = config.headers.join(', ');
      req.headers['access-control-allow-credentials'] = config.credentials.toString();

      if (req.method === 'OPTIONS') {
        return { status: 204 };
      }

      return next();
    };
  }

  rateLimit(config = {}) {
    const limits = new Map();
    const windowMs = config.windowMs || 60000;
    const maxRequests = config.maxRequests || 100;

    return (req, next) => {
      const key = req.headers['x-forwarded-for'] || req.ip || 'unknown';
      const now = Date.now();

      if (!limits.has(key)) {
        limits.set(key, []);
      }

      const requests = limits.get(key);
      const recentRequests = requests.filter(time => now - time < windowMs);

      if (recentRequests.length >= maxRequests) {
        throw new Error('Rate limit exceeded');
      }

      recentRequests.push(now);
      limits.set(key, recentRequests);

      return next();
    };
  }
}