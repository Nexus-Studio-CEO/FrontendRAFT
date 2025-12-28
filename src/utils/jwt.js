/**
 * FrontendRAFT - JWT Utilities
 * 
 * JWT token creation and verification.
 * Simple implementation for frontend use.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

/**
 * Create JWT token
 * 
 * @param {Object} payload Token payload
 * @param {string} secret Signing secret
 * @returns {string} JWT token
 * 
 * @example
 * const token = createJWT({ userId: 123 }, 'secret');
 */
export function createJWT(payload, secret) {
  // Header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  // Create signature
  const signature = sign(`${encodedHeader}.${encodedPayload}`, secret);

  // Return token
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify JWT token
 * 
 * @param {string} token JWT token
 * @param {string} secret Signing secret
 * @returns {Object} Decoded payload
 * 
 * @example
 * const payload = verifyJWT(token, 'secret');
 */
export function verifyJWT(token, secret) {
  const parts = token.split('.');
  
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  // Verify signature
  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`, secret);
  
  if (signature !== expectedSignature) {
    throw new Error('Invalid signature');
  }

  // Decode payload
  const payload = JSON.parse(base64UrlDecode(encodedPayload));

  // Check expiration
  if (payload.exp && Date.now() > payload.exp) {
    throw new Error('Token expired');
  }

  return payload;
}

/**
 * Decode JWT without verification
 * 
 * @param {string} token JWT token
 * @returns {Object} Decoded payload
 */
export function decodeJWT(token) {
  const parts = token.split('.');
  
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const payload = JSON.parse(base64UrlDecode(parts[1]));
  return payload;
}

/**
 * Base64 URL encode
 * @private
 */
function base64UrlEncode(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL decode
 * @private
 */
function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  
  while (str.length % 4) {
    str += '=';
  }
  
  return atob(str);
}

/**
 * Simple HMAC signature
 * @private
 */
function sign(data, secret) {
  // Simple hash for frontend use
  // In production, use crypto.subtle.sign
  const combined = data + secret;
  let hash = 0;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return base64UrlEncode(hash.toString(36));
}

export default {
  createJWT,
  verifyJWT,
  decodeJWT
};