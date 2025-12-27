/**
 * FrontendRAFT - JWT Utilities
 * 
 * Helper functions for JWT token operations.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

export function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

export function parseJWT(token: string): any {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(base64UrlDecode(payload));
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = parseJWT(token);
    return Date.now() > payload.exp;
  } catch {
    return true;
  }
}

export function getTokenExpiryDate(token: string): Date | null {
  try {
    const payload = parseJWT(token);
    return new Date(payload.exp);
  } catch {
    return null;
  }
}