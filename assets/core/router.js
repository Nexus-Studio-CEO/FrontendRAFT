/**
 * FrontendRAFT - Router
 * 
 * HTTP request routing and endpoint management
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

class Router {
    constructor() {
        this.routes = new Map();
        this.middleware = [];
        this.errorHandlers = [];
    }

    /**
     * Register route
     * @param {string} method - HTTP method (GET, POST, etc.)
     * @param {string} path - Route path
     * @param {function} handler - Route handler function
     */
    register(method, path, handler) {
        const key = `${method.toUpperCase()} ${path}`;
        this.routes.set(key, {
            method,
            path,
            handler,
            pattern: this._pathToRegex(path)
        });
        Logger.info(`Router: Registered ${key}`);
    }

    /**
     * Shorthand route methods
     */
    get(path, handler) {
        this.register('GET', path, handler);
    }

    post(path, handler) {
        this.register('POST', path, handler);
    }

    put(path, handler) {
        this.register('PUT', path, handler);
    }

    delete(path, handler) {
        this.register('DELETE', path, handler);
    }

    patch(path, handler) {
        this.register('PATCH', path, handler);
    }

    /**
     * Add middleware
     * @param {function} fn - Middleware function
     */
    use(fn) {
        this.middleware.push(fn);
        Logger.info('Router: Middleware added');
    }

    /**
     * Add error handler
     */
    catch(fn) {
        this.errorHandlers.push(fn);
    }

    /**
     * Handle incoming request
     * @param {object} request - Request object { method, path, headers, body, query }
     * @returns {Promise<object>} Response object
     */
    async handle(request) {
        try {
            Logger.info(`Router: ${request.method} ${request.path}`);
            
            // Execute middleware
            let req = request;
            for (const mw of this.middleware) {
                req = await mw(req);
            }
            
            // Find matching route
            const route = this._findRoute(req.method, req.path);
            
            if (!route) {
                return this._notFound(req);
            }
            
            // Extract params
            req.params = this._extractParams(route, req.path);
            
            // Execute handler
            const result = await route.handler(req);
            
            return this._formatResponse(result);
            
        } catch (error) {
            return this._handleError(error, request);
        }
    }

    /**
     * Find matching route
     */
    _findRoute(method, path) {
        for (const [key, route] of this.routes) {
            if (route.method.toUpperCase() === method.toUpperCase()) {
                if (route.pattern.test(path)) {
                    return route;
                }
            }
        }
        return null;
    }

    /**
     * Convert path pattern to regex
     * Supports :param syntax
     */
    _pathToRegex(path) {
        const pattern = path
            .replace(/\//g, '\\/')
            .replace(/:(\w+)/g, '(?<$1>[^/]+)');
        return new RegExp(`^${pattern}$`);
    }

    /**
     * Extract URL parameters
     */
    _extractParams(route, path) {
        const match = path.match(route.pattern);
        return match?.groups || {};
    }

    /**
     * Format response
     */
    _formatResponse(result) {
        if (typeof result === 'object' && result.status) {
            return result;
        }
        
        return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: result
        };
    }

    /**
     * Handle 404 Not Found
     */
    _notFound(request) {
        Logger.warn(`Router: 404 Not Found - ${request.method} ${request.path}`);
        return {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
            body: {
                error: 'Not Found',
                message: `Route ${request.method} ${request.path} not found`
            }
        };
    }

    /**
     * Handle errors
     */
    _handleError(error, request) {
        Logger.error(`Router: Error handling ${request.method} ${request.path}: ${error.message}`);
        
        // Execute custom error handlers
        for (const handler of this.errorHandlers) {
            try {
                return handler(error, request);
            } catch (e) {
                // Continue to next handler
            }
        }
        
        // Default error response
        return {
            status: error.status || 500,
            headers: { 'Content-Type': 'application/json' },
            body: {
                error: error.name || 'Internal Server Error',
                message: error.message
            }
        };
    }

    /**
     * Parse query string
     */
    parseQuery(queryString) {
        if (!queryString) return {};
        
        const params = new URLSearchParams(queryString);
        const result = {};
        
        for (const [key, value] of params) {
            result[key] = value;
        }
        
        return result;
    }

    /**
     * Parse request body
     */
    async parseBody(body, contentType) {
        if (!body) return null;
        
        if (contentType?.includes('application/json')) {
            return JSON.parse(body);
        }
        
        if (contentType?.includes('application/x-www-form-urlencoded')) {
            return this.parseQuery(body);
        }
        
        return body;
    }

    /**
     * Get all registered routes
     */
    getRoutes() {
        const routes = [];
        for (const [key, route] of this.routes) {
            routes.push({
                method: route.method,
                path: route.path
            });
        }
        return routes;
    }

    /**
     * Create CORS middleware
     */
    createCORSMiddleware(options = {}) {
        const {
            origin = '*',
            methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            headers = ['Content-Type', 'Authorization'],
            credentials = false
        } = options;
        
        return async (request) => {
            request.cors = {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': methods.join(', '),
                'Access-Control-Allow-Headers': headers.join(', '),
                'Access-Control-Allow-Credentials': credentials.toString()
            };
            return request;
        };
    }

    /**
     * Create rate limiting middleware
     */
    createRateLimitMiddleware(options = {}) {
        const { maxRequests = 100, windowMs = 60000 } = options;
        const requests = new Map();
        
        return async (request) => {
            const key = request.ip || 'anonymous';
            const now = Date.now();
            
            if (!requests.has(key)) {
                requests.set(key, []);
            }
            
            const userRequests = requests.get(key);
            const recentRequests = userRequests.filter(t => now - t < windowMs);
            
            if (recentRequests.length >= maxRequests) {
                throw { status: 429, message: 'Too many requests' };
            }
            
            recentRequests.push(now);
            requests.set(key, recentRequests);
            
            return request;
        };
    }

    /**
     * Clear all routes
     */
    clear() {
        this.routes.clear();
        this.middleware = [];
        this.errorHandlers = [];
        Logger.info('Router: All routes cleared');
    }
}

// Global instance
window.Router = new Router();