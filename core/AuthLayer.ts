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

import type { 
  CSOPInstance,
  UserCredentials,
  UserData,
  TokenPayload
} from '../types';
import type { StorageLayer } from './StorageLayer';

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
export class AuthLayer {
  private csop: CSOPInstance;
  private storage: StorageLayer;
  private secret: string;
  private tokenExpiry: number;

  constructor(
    csop: CSOPInstance,
    storage: StorageLayer,
    config?: { jwtSecret?: string; tokenExpiry?: number }
  ) {
    this.csop = csop;
    this.storage = storage;
    this.secret = config?.jwtSecret || this.generateSecret();
    this.tokenExpiry = config?.tokenExpiry || 30 * 24 * 3600000; // 30 days
  }

  /**
   * Create new user account
   */
  async signup(
    email: string,
    password: string,
    options?: { plan?: 'free' | 'pro' | 'enterprise'; quota?: number }
  ): Promise<string> {
    // Check if user exists
    const existingUser = await this.storage.exists(`user:${email}`);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const userId = crypto.randomUUID();
    const passwordHash = await this.hashPassword(password);

    const userData: UserData = {
      id: userId,
      email,
      passwordHash,
      plan: options?.plan || 'free',
      quota: options?.quota || 1000,
      usedQuota: 0,
      createdAt: Date.now()
    };

    // Save user
    await this.storage.save(`user:${userId}`, userData);
    await this.storage.save(`user:email:${email}`, userId);

    // Generate token
    return this.generateToken({
      userId,
      email,
      plan: userData.plan,
      apiId: '', // Will be set by FrontendRAFT
      exp: Date.now() + this.tokenExpiry
    });
  }

  /**
   * Login existing user
   */
  async login(email: string, password: string): Promise<string> {
    // Get user ID from email
    const userId = await this.storage.get<string>(`user:email:${email}`);
    
    // Get user data
    const user = await this.storage.get<UserData>(`user:${userId}`);

    // Verify password
    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    return this.generateToken({
      userId: user.id,
      email: user.email,
      plan: user.plan,
      apiId: '',
      exp: Date.now() + this.tokenExpiry
    });
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<UserData> {
    try {
      const payload = this.decodeToken(token);

      // Check expiration
      if (!payload.exp || Date.now() > payload.exp) {
        throw new Error('Token expired');
      }

      // Verify token signature
      const [header, payloadPart, signature] = token.split('.');
      const expectedSignature = this.sign(`${header}.${payloadPart}`);
      if (signature !== expectedSignature) {
        throw new Error('Invalid token signature');
      }

      // Get user
      const user = await this.storage.get<UserData>(`user:${payload.userId}`);
      
      // Additional validation
      if (!user || !user.id || user.id !== payload.userId) {
        throw new Error('User not found or token mismatch');
      }
      
      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: TokenPayload): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Decode JWT token
   * @private
   */
  private decodeToken(token: string): TokenPayload {
    const [header, payload, signature] = token.split('.');
    
    // Verify signature
    const expectedSignature = this.sign(`${header}.${payload}`);
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    return JSON.parse(this.base64UrlDecode(payload));
  }

  /**
   * Hash password
   * @private
   */
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + this.secret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify password
   * @private
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const newHash = await this.hashPassword(password);
    return newHash === hash;
  }

  /**
   * Sign data with secret
   * @private
   */
  private sign(data: string): string {
    // Simple HMAC-like signature (production should use crypto.subtle.sign)
    const combined = data + this.secret;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Base64 URL encode
   * @private
   */
  private base64UrlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64 URL decode
   * @private
   */
  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return atob(str);
  }

  /**
   * Generate random secret
   * @private
   */
  private generateSecret(): string {
    return crypto.randomUUID() + crypto.randomUUID();
  }

  /**
   * Update user quota
   */
  async incrementQuota(userId: string): Promise<void> {
    const user = await this.storage.get<UserData>(`user:${userId}`);
    user.usedQuota++;
    await this.storage.save(`user:${userId}`, user);
  }

  /**
   * Check if user has quota available
   */
  async hasQuotaAvailable(userId: string): Promise<boolean> {
    const user = await this.storage.get<UserData>(`user:${userId}`);
    return user.usedQuota < user.quota;
  }
}