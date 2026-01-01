/**
 * FrontendRAFT - Auth Layer
 * 
 * JWT authentication and user management
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

class AuthLayer {
    constructor() {
        this.users = new Map();
        this.tokens = new Map();
        this.secret = 'frontendraft_secret_' + Date.now();
        this.tokenExpiry = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Generate JWT token (simple implementation)
     * @param {object} payload - Token payload
     * @returns {string} JWT token
     */
    generateToken(payload) {
        const header = { alg: 'HS256', typ: 'JWT' };
        const now = Date.now();
        
        const tokenPayload = {
            ...payload,
            iat: now,
            exp: now + this.tokenExpiry
        };
        
        const encodedHeader = btoa(JSON.stringify(header));
        const encodedPayload = btoa(JSON.stringify(tokenPayload));
        const signature = this._sign(`${encodedHeader}.${encodedPayload}`);
        
        const token = `${encodedHeader}.${encodedPayload}.${signature}`;
        
        this.tokens.set(token, tokenPayload);
        Logger.info(`AuthLayer: Generated token for user ${payload.userId}`);
        
        return token;
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token
     * @returns {object|null} Decoded payload or null if invalid
     */
    verifyToken(token) {
        if (!token) return null;
        
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            
            const [header, payload, signature] = parts;
            const expectedSignature = this._sign(`${header}.${payload}`);
            
            if (signature !== expectedSignature) {
                Logger.warn('AuthLayer: Invalid token signature');
                return null;
            }
            
            const decoded = JSON.parse(atob(payload));
            
            if (Date.now() > decoded.exp) {
                Logger.warn('AuthLayer: Token expired');
                this.tokens.delete(token);
                return null;
            }
            
            return decoded;
            
        } catch (error) {
            Logger.error(`AuthLayer: Token verification failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Sign data (simple HMAC simulation)
     */
    _sign(data) {
        return btoa(data + this.secret).substring(0, 43);
    }

    /**
     * Hash password (simple implementation)
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + this.secret);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Register new user
     * @param {object} userData - User data { email, password, name }
     * @returns {Promise<object>} User object with token
     */
    async signup(userData) {
        const { email, password, name } = userData;
        
        if (this.users.has(email)) {
            throw new Error('User already exists');
        }
        
        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const passwordHash = await this.hashPassword(password);
        
        const user = {
            id: userId,
            email,
            name: name || email.split('@')[0],
            passwordHash,
            createdAt: Date.now()
        };
        
        this.users.set(email, user);
        
        const token = this.generateToken({
            userId: user.id,
            email: user.email
        });
        
        Logger.info(`AuthLayer: User registered: ${email}`);
        
        return {
            user: { id: user.id, email: user.email, name: user.name },
            token
        };
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<object>} User object with token
     */
    async login(email, password) {
        const user = this.users.get(email);
        
        if (!user) {
            throw new Error('User not found');
        }
        
        const passwordHash = await this.hashPassword(password);
        
        if (passwordHash !== user.passwordHash) {
            throw new Error('Invalid password');
        }
        
        const token = this.generateToken({
            userId: user.id,
            email: user.email
        });
        
        Logger.info(`AuthLayer: User logged in: ${email}`);
        
        return {
            user: { id: user.id, email: user.email, name: user.name },
            token
        };
    }

    /**
     * Logout user (invalidate token)
     */
    logout(token) {
        this.tokens.delete(token);
        Logger.info('AuthLayer: User logged out');
    }

    /**
     * Get user from token
     */
    getUserFromToken(token) {
        const decoded = this.verifyToken(token);
        if (!decoded) return null;
        
        const user = this.users.get(decoded.email);
        if (!user) return null;
        
        return {
            id: user.id,
            email: user.email,
            name: user.name
        };
    }

    /**
     * Validate API key (alternative auth method)
     */
    validateAPIKey(apiKey, validKeys = []) {
        return validKeys.includes(apiKey);
    }

    /**
     * Extract token from Authorization header
     */
    extractToken(authHeader) {
        if (!authHeader) return null;
        
        if (authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        
        return authHeader;
    }

    /**
     * Middleware for authentication
     */
    createAuthMiddleware(options = {}) {
        const { strategy = 'jwt', required = true } = options;
        
        return async (request) => {
            const authHeader = request.headers?.authorization || request.headers?.Authorization;
            
            if (!authHeader && required) {
                throw new Error('Authorization header required');
            }
            
            if (!authHeader) {
                return request;
            }
            
            if (strategy === 'jwt') {
                const token = this.extractToken(authHeader);
                const user = this.getUserFromToken(token);
                
                if (!user && required) {
                    throw new Error('Invalid or expired token');
                }
                
                request.user = user;
            } else if (strategy === 'apikey') {
                const apiKey = authHeader.replace('ApiKey ', '');
                const valid = this.validateAPIKey(apiKey, options.validKeys || []);
                
                if (!valid && required) {
                    throw new Error('Invalid API key');
                }
                
                request.authenticated = valid;
            }
            
            return request;
        };
    }

    /**
     * Refresh token
     */
    refreshToken(oldToken) {
        const decoded = this.verifyToken(oldToken);
        if (!decoded) {
            throw new Error('Invalid token');
        }
        
        this.tokens.delete(oldToken);
        
        return this.generateToken({
            userId: decoded.userId,
            email: decoded.email
        });
    }
}

// Global instance
window.AuthLayer = new AuthLayer();