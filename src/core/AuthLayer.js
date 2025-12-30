/**
 * FrontendRAFT - Authentication Layer
 * 
 * JWT authentication with signup/login/validation
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

import { JWT } from '../utils/jwt.js';
import { Crypto } from '../utils/crypto.js';
import { Validator } from '../types/validator.js';

export class AuthLayer {
  constructor(storage, config = {}) {
    this.storage = storage;
    this.type = config.type || 'jwt';
    this.secret = config.secret || Crypto.generateToken(32);
    this.expiresIn = config.expiresIn || 30 * 24 * 60 * 60 * 1000;
  }

  async signup(email, password, metadata = {}) {
    if (!Validator.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const userId = Crypto.generateUUID();
    const passwordHash = await Crypto.hashPassword(password);

    const user = {
      id: userId,
      email,
      passwordHash,
      ...metadata,
      createdAt: Date.now(),
      lastLogin: null
    };

    await this.storage.save(`user:${userId}`, user);
    await this.storage.save(`email:${email}`, { userId });

    const token = await this.generateToken({
      userId,
      email,
      ...metadata
    });

    return {
      user: this._sanitizeUser(user),
      token
    };
  }

  async login(email, password) {
    if (!Validator.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    let emailMapping;
    try {
      emailMapping = await this.storage.get(`email:${email}`);
    } catch {
      throw new Error('Invalid credentials');
    }

    let user;
    try {
      user = await this.storage.get(`user:${emailMapping.userId}`);
    } catch {
      throw new Error('Invalid credentials');
    }

    const isValid = await Crypto.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    user.lastLogin = Date.now();
    await this.storage.save(`user:${user.id}`, user);

    const token = await this.generateToken({
      userId: user.id,
      email: user.email,
      plan: user.plan
    });

    return {
      user: this._sanitizeUser(user),
      token
    };
  }

  async generateToken(payload) {
    if (this.type === 'jwt') {
      return await JWT.sign(payload, this.secret, {
        expiresIn: this.expiresIn
      });
    } else if (this.type === 'apikey') {
      return Crypto.generateToken(32);
    }
    throw new Error(`Unsupported auth type: ${this.type}`);
  }

  async validateToken(token) {
    if (this.type === 'jwt') {
      try {
        const payload = await JWT.verify(token, this.secret);
        
        let user;
        try {
          user = await this.storage.get(`user:${payload.userId}`);
        } catch {
          throw new Error('User not found');
        }

        return {
          valid: true,
          user: this._sanitizeUser(user),
          payload
        };
      } catch (error) {
        return {
          valid: false,
          error: error.message
        };
      }
    } else if (this.type === 'apikey') {
      return {
        valid: token && token.length === 64,
        payload: { apikey: token }
      };
    }

    return { valid: false, error: 'Unsupported auth type' };
  }

  async refreshToken(oldToken) {
    const validation = await this.validateToken(oldToken);
    
    if (!validation.valid) {
      throw new Error('Invalid token');
    }

    return await this.generateToken({
      userId: validation.user.id,
      email: validation.user.email,
      plan: validation.user.plan
    });
  }

  async getUserByToken(token) {
    const validation = await this.validateToken(token);
    
    if (!validation.valid) {
      throw new Error('Invalid token');
    }

    return validation.user;
  }

  async updateUser(userId, updates) {
    let user;
    try {
      user = await this.storage.get(`user:${userId}`);
    } catch {
      throw new Error('User not found');
    }

    if (updates.password) {
      updates.passwordHash = await Crypto.hashPassword(updates.password);
      delete updates.password;
    }

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: Date.now()
    };

    await this.storage.save(`user:${userId}`, updatedUser);

    return this._sanitizeUser(updatedUser);
  }

  async deleteUser(userId) {
    let user;
    try {
      user = await this.storage.get(`user:${userId}`);
    } catch {
      throw new Error('User not found');
    }

    await this.storage.delete(`user:${userId}`);
    await this.storage.delete(`email:${user.email}`);

    return { deleted: true, userId };
  }

  _sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  middleware() {
    return async (req, next) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        throw new Error('Missing authorization header');
      }

      const token = authHeader.replace(/^Bearer\s+/i, '');
      const validation = await this.validateToken(token);

      if (!validation.valid) {
        throw new Error(`Authentication failed: ${validation.error}`);
      }

      req.user = validation.user;
      req.token = token;

      return next ? next() : undefined;
    };
  }
}