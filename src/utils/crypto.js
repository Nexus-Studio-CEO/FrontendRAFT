/**
 * FrontendRAFT - Cryptography Utilities
 * 
 * Encryption, hashing, and secure random generation
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

export class Crypto {
  static async hash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async hashPassword(password) {
    const salt = this.generateSalt();
    const combined = password + salt;
    const hashed = await this.hash(combined);
    return `${salt}:${hashed}`;
  }

  static async verifyPassword(password, hashedPassword) {
    const [salt, hash] = hashedPassword.split(':');
    const combined = password + salt;
    const computedHash = await this.hash(combined);
    return computedHash === hash;
  }

  static generateSalt(length = 16) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static generateUUID() {
    return crypto.randomUUID();
  }

  static generateToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static async encrypt(data, key) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const keyBuffer = encoder.encode(key);
    const keyHash = await crypto.subtle.digest('SHA-256', keyBuffer);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyHash,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBuffer
    );
    
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const result = new Uint8Array(iv.length + encryptedArray.length);
    result.set(iv);
    result.set(encryptedArray, iv.length);
    
    return Array.from(result, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static async decrypt(encryptedHex, key) {
    const encryptedArray = new Uint8Array(
      encryptedHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );
    
    const iv = encryptedArray.slice(0, 12);
    const data = encryptedArray.slice(12);
    
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(key);
    const keyHash = await crypto.subtle.digest('SHA-256', keyBuffer);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyHash,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  static base64Encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  static base64Decode(str) {
    return decodeURIComponent(escape(atob(str)));
  }

  static constantTimeCompare(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}