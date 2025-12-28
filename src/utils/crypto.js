/**
 * FrontendRAFT - Cryptography Utilities
 * 
 * Password hashing, encryption, and decryption utilities.
 * Uses Web Crypto API for security.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

/**
 * Hash password
 * 
 * @param {string} password Plain password
 * @returns {Promise<string>} Hashed password
 * 
 * @example
 * const hashed = await hash('mypassword');
 */
export async function hash(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Compare password with hash
 * 
 * @param {string} password Plain password
 * @param {string} hashed Hashed password
 * @returns {Promise<boolean>} True if match
 * 
 * @example
 * const isValid = await compare('mypassword', hashed);
 */
export async function compare(password, hashed) {
  const passwordHash = await hash(password);
  return passwordHash === hashed;
}

/**
 * Generate random key
 * 
 * @param {number} length Key length
 * @returns {string} Random key
 * 
 * @example
 * const key = generateKey(32);
 */
export function generateKey(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt data (AES-GCM)
 * 
 * @param {string} data Data to encrypt
 * @param {string} key Encryption key
 * @returns {Promise<string>} Encrypted data (base64)
 * 
 * @example
 * const encrypted = await encrypt('secret data', key);
 */
export async function encrypt(data, key) {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  
  // Derive key from string
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('frontendraft-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    encodedData
  );
  
  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Return base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data (AES-GCM)
 * 
 * @param {string} encryptedData Encrypted data (base64)
 * @param {string} key Encryption key
 * @returns {Promise<string>} Decrypted data
 * 
 * @example
 * const decrypted = await decrypt(encrypted, key);
 */
export async function decrypt(encryptedData, key) {
  const encoder = new TextEncoder();
  
  // Decode base64
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  // Derive key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('frontendraft-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    encrypted
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export default {
  hash,
  compare,
  generateKey,
  encrypt,
  decrypt
};