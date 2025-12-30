/**
 * FrontendRAFT - Type Validators
 * 
 * Runtime type validation and sanitization
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

import { HTTP_METHODS, AUTH_TYPES, CACHE_STRATEGIES } from './index.js';

export class Validator {
  static isString(value) {
    return typeof value === 'string';
  }

  static isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
  }

  static isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  static isFunction(value) {
    return typeof value === 'function';
  }

  static isArray(value) {
    return Array.isArray(value);
  }

  static validateHTTPMethod(method) {
    if (!this.isString(method)) {
      throw new Error('HTTP method must be a string');
    }
    const upperMethod = method.toUpperCase();
    if (!HTTP_METHODS.includes(upperMethod)) {
      throw new Error(`Invalid HTTP method: ${method}. Allowed: ${HTTP_METHODS.join(', ')}`);
    }
    return upperMethod;
  }

  static validatePath(path) {
    if (!this.isString(path)) {
      throw new Error('Path must be a string');
    }
    if (!path.startsWith('/')) {
      throw new Error('Path must start with /');
    }
    return path;
  }

  static validateAuthType(type) {
    if (!this.isString(type)) {
      throw new Error('Auth type must be a string');
    }
    if (!AUTH_TYPES.includes(type)) {
      throw new Error(`Invalid auth type: ${type}. Allowed: ${AUTH_TYPES.join(', ')}`);
    }
    return type;
  }

  static validateCacheStrategy(strategy) {
    if (!this.isString(strategy)) {
      throw new Error('Cache strategy must be a string');
    }
    if (!CACHE_STRATEGIES.includes(strategy)) {
      throw new Error(`Invalid cache strategy: ${strategy}. Allowed: ${CACHE_STRATEGIES.join(', ')}`);
    }
    return strategy;
  }

  static validateConfig(config) {
    if (!this.isObject(config)) {
      throw new Error('Config must be an object');
    }

    if (!config.name || !this.isString(config.name)) {
      throw new Error('Config.name is required and must be a string');
    }

    if (config.auth && config.auth.type) {
      this.validateAuthType(config.auth.type);
    }

    if (config.cache && config.cache.strategy) {
      this.validateCacheStrategy(config.cache.strategy);
    }

    return true;
  }

  static sanitizeHeaders(headers) {
    if (!this.isObject(headers)) {
      return {};
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(headers)) {
      if (this.isString(key) && (this.isString(value) || this.isNumber(value))) {
        sanitized[key.toLowerCase()] = String(value);
      }
    }
    return sanitized;
  }

  static sanitizeQuery(query) {
    if (!this.isObject(query)) {
      return {};
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(query)) {
      if (this.isString(key)) {
        sanitized[key] = String(value);
      }
    }
    return sanitized;
  }

  static validateEmail(email) {
    if (!this.isString(email)) {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static sanitizeSQL(input) {
    if (!this.isString(input)) {
      return '';
    }
    return input.replace(/['";]/g, '');
  }

  static validateJWT(token) {
    if (!this.isString(token)) {
      return false;
    }
    const parts = token.split('.');
    return parts.length === 3;
  }

  static sanitizeHTML(html) {
    if (!this.isString(html)) {
      return '';
    }
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}