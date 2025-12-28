/**
 * FrontendRAFT - Authentication Layer
 * 
 * JWT-based authentication with signup, login, and token validation.
 * Stores user data via CSOP storage.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

import { createJWT, verifyJWT } from '../utils/jwt.js';
import { hash, compare } from '../utils/crypto.js';

/**
 * Authentication Layer
 * Handles user registration, login, and token management
 */
export class AuthLayer {
  /**
   * @param {StorageLayer} storage CSOP storage layer
   */
  constructor(storage) {
    this.storage = storage;
    this.jwtSecret = this._getOrCreateSecret();

    console.log('✅ AuthLayer initialized');
  }

  /**
   * Register new user
   * 
   * @param {string} email User email
   * @param {string} password User password
   * @param {Object} config User configuration
   * @returns {Promise<Object>} { userId, token }
   * 
   * @example
   * const { token } = await auth.signup('user@mail.com', 'pass123', {
   *   plan: 'free',
   *   quota: 1000
   * });
   */
  async signup(email, password, config = {}) {
    // Validate email
    if (!this._isValidEmail(email)) {
      throw new Error('Invalid email address');
    }

    // Check if user exists
    const existingUser = await this._findUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create user
    const userId = `user_${crypto.randomUUID().replace(/-/g, '')}`;
    const passwordHash = await hash(password);

    const user = {
      id: userId,
      email,
      passwordHash,
      plan: config.plan || 'free',
      quota: config.quota || 1000,
      usedQuota: 0,
      createdAt: Date.now(),
      lastLogin: Date.now()
    };

    // Save user
    await this.storage.save(`user:${userId}`, user);
    await this.storage.save(`email:${email}`, { userId });

    // Generate token
    const token = await this._generateToken(user);

    console.log('✅ User registered:', email);

    return {
      userId,
      email,
      token,
      plan: user.plan,
      quota: user.quota
    };
  }

  /**
   * Login existing user
   * 
   * @param {string} email User email
   * @param {string} password User password
   * @returns {Promise<Object>} { userId, token }
   * 
   * @example
   * const { token } = await auth.login('user@mail.com', 'pass123');
   */
  async login(email, password) {
    // Find user
    const user = await this._findUserByEmail(email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await compare(password, user.passwordHash);
    
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.lastLogin = Date.now();
    await this.storage.save(`user:${user.id}`, user);

    // Generate token
    const token = await this._generateToken(user);

    console.log('✅ User logged in:', email);

    return {
      userId: user.id,
      email: user.email,
      token,
      plan: user.plan,
      quota: user.quota
    };
  }

  /**
   * Validate JWT token
   * 
   * @param {string} token JWT token
   * @returns {Promise<Object>} User data
   * 
   * @example
   * const user = await auth.validateToken(token);
   */
  async validateToken(token) {
    try {
      // Verify JWT
      const payload = await verifyJWT(token, this.jwtSecret);

      // Load user from storage
      const user = await this.storage.get(`user:${payload.userId}`);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Check quota
      if (user.usedQuota >= user.quota) {
        throw new Error('Quota exceeded');
      }

      return {
        userId: user.id,
        email: user.email,
        plan: user.plan,
        quota: user.quota,
        usedQuota: user.usedQuota
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Increment user quota usage
   * 
   * @param {string} userId User ID
   * @returns {Promise<number>} New usage count
   */
  async incrementQuota(userId) {
    const user = await this.storage.get(`user:${userId}`);
    
    if (!user) {
      throw new Error('User not found');
    }

    user.usedQuota++;
    await this.storage.save(`user:${userId}`, user);

    return user.usedQuota;
  }

  /**
   * Reset user quota (monthly reset)
   * 
   * @param {string} userId User ID
   */
  async resetQuota(userId) {
    const user = await this.storage.get(`user:${userId}`);
    
    if (!user) {
      throw new Error('User not found');
    }

    user.usedQuota = 0;
    await this.storage.save(`user:${userId}`, user);

    console.log('✅ Quota reset for user:', userId);
  }

  /**
   * Update user plan
   * 
   * @param {string} userId User ID
   * @param {string} plan New plan
   * @param {number} quota New quota
   */
  async updatePlan(userId, plan, quota) {
    const user = await this.storage.get(`user:${userId}`);
    
    if (!user) {
      throw new Error('User not found');
    }

    user.plan = plan;
    user.quota = quota;
    await this.storage.save(`user:${userId}`, user);

    console.log('✅ Plan updated for user:', userId, plan);
  }

  /**
   * Generate JWT token
   * @private
   */
  async _generateToken(user) {
    return createJWT({
      userId: user.id,
      email: user.email,
      plan: user.plan,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    }, this.jwtSecret);
  }

  /**
   * Find user by email
   * @private
   */
  async _findUserByEmail(email) {
    try {
      const emailRecord = await this.storage.get(`email:${email}`);
      if (!emailRecord) return null;

      const user = await this.storage.get(`user:${emailRecord.userId}`);
      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate email format
   * @private
   */
  _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Get or create JWT secret
   * @private
   */
  _getOrCreateSecret() {
    let secret = localStorage.getItem('frontendraft_jwt_secret');
    
    if (!secret) {
      secret = crypto.randomUUID() + crypto.randomUUID();
      localStorage.setItem('frontendraft_jwt_secret', secret);
    }

    return secret;
  }
}

export default AuthLayer;