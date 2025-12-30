/**
 * FrontendRAFT - Input Validation
 * 
 * Security-focused input validation and sanitization
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

export class Validation {
  static detectSQLInjection(input) {
    if (typeof input !== 'string') return false;
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(--|;|\/\*|\*\/|xp_|sp_)/i,
      /('|('')|;|--|\/\*|\*\/)/i,
      /(\bOR\b|\bAND\b).*=.*=/i,
      /(UNION.*SELECT|SELECT.*FROM.*WHERE)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  static detectXSS(input) {
    if (typeof input !== 'string') return false;
    
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]+src[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<object[^>]*>/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }

  static detectPathTraversal(input) {
    if (typeof input !== 'string') return false;
    
    const pathPatterns = [
      /\.\.\//g,
      /\.\.\\+/g,
      /%2e%2e%2f/gi,
      /%2e%2e\\/gi,
      /\.\.\%2f/gi
    ];
    
    return pathPatterns.some(pattern => pattern.test(input));
  }

  static detectCommandInjection(input) {
    if (typeof input !== 'string') return false;
    
    const cmdPatterns = [
      /[;&|`$()]/,
      /\n|\r/,
      /\${.*}/,
      /\$\(.*\)/
    ];
    
    return cmdPatterns.some(pattern => pattern.test(input));
  }

  static sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') return input;
    
    let sanitized = input;
    
    if (options.trim !== false) {
      sanitized = sanitized.trim();
    }
    
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }
    
    if (options.allowedChars) {
      const regex = new RegExp(`[^${options.allowedChars}]`, 'g');
      sanitized = sanitized.replace(regex, '');
    }
    
    if (options.lowercase) {
      sanitized = sanitized.toLowerCase();
    }
    
    if (options.uppercase) {
      sanitized = sanitized.toUpperCase();
    }
    
    return sanitized;
  }

  static validateSecurityHeaders(headers) {
    const required = [
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];
    
    const missing = [];
    for (const header of required) {
      if (!headers[header]) {
        missing.push(header);
      }
    }
    
    return {
      valid: missing.length === 0,
      missing
    };
  }

  static isValidURL(url) {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  static isValidJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  static rateLimit(key, limit, window) {
    if (!this._rateLimits) {
      this._rateLimits = new Map();
    }
    
    const now = Date.now();
    const windowStart = now - window;
    
    if (!this._rateLimits.has(key)) {
      this._rateLimits.set(key, []);
    }
    
    const requests = this._rateLimits.get(key);
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= limit) {
      return {
        allowed: false,
        retryAfter: recentRequests[0] + window - now
      };
    }
    
    recentRequests.push(now);
    this._rateLimits.set(key, recentRequests);
    
    return {
      allowed: true,
      remaining: limit - recentRequests.length
    };
  }
}