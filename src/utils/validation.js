/**
 * FrontendRAFT - Validation Utilities
 * 
 * Input validation helpers for security and data integrity.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

/**
 * Validate email format
 * 
 * @param {string} email Email address
 * @returns {boolean} True if valid
 * 
 * @example
 * if (!validateEmail(email)) throw new Error('Invalid email');
 */
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate password strength
 * 
 * @param {string} password Password
 * @param {Object} options Validation options
 * @returns {Object} { valid, errors }
 * 
 * @example
 * const { valid, errors } = validatePassword(password);
 */
export function validatePassword(password, options = {}) {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecial = false
  } = options;

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain number');
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate JWT token format
 * 
 * @param {string} token JWT token
 * @returns {boolean} True if valid format
 * 
 * @example
 * if (!validateToken(token)) throw new Error('Invalid token');
 */
export function validateToken(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  return parts.length === 3;
}

/**
 * Validate URL format
 * 
 * @param {string} url URL string
 * @returns {boolean} True if valid
 * 
 * @example
 * if (!validateUrl(url)) throw new Error('Invalid URL');
 */
export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize string (prevent XSS)
 * 
 * @param {string} str Input string
 * @returns {string} Sanitized string
 * 
 * @example
 * const safe = sanitize(userInput);
 */
export function sanitize(str) {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate object schema
 * 
 * @param {Object} data Data to validate
 * @param {Object} schema Validation schema
 * @returns {Object} { valid, errors }
 * 
 * @example
 * const schema = {
 *   name: { type: 'string', required: true },
 *   age: { type: 'number', min: 0 }
 * };
 * const { valid, errors } = validate(data, schema);
 */
export function validate(data, schema) {
  const errors = {};

  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[key] = `${key} is required`;
      continue;
    }

    // Skip further validation if not required and empty
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }

    // Type check
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      
      if (actualType !== rules.type) {
        errors[key] = `${key} must be ${rules.type}`;
        continue;
      }
    }

    // String validations
    if (rules.type === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors[key] = `${key} must be at least ${rules.minLength} characters`;
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        errors[key] = `${key} must be at most ${rules.maxLength} characters`;
      }
      
      if (rules.pattern && !rules.pattern.test(value)) {
        errors[key] = `${key} format is invalid`;
      }
    }

    // Number validations
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors[key] = `${key} must be at least ${rules.min}`;
      }
      
      if (rules.max !== undefined && value > rules.max) {
        errors[key] = `${key} must be at most ${rules.max}`;
      }
    }

    // Custom validator
    if (rules.validator) {
      const result = rules.validator(value);
      if (result !== true) {
        errors[key] = result || `${key} is invalid`;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export default {
  validateEmail,
  validatePassword,
  validateToken,
  validateUrl,
  sanitize,
  validate
};