/**
 * FrontendRAFT - Validation Utilities
 * 
 * Data validation helper functions.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidPassword(password: string, minLength: number = 8): boolean {
  return password.length >= minLength;
}

export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new Error(`${fieldName} is required`);
  }
}

export function validateString(value: any, fieldName: string, options?: {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}): void {
  validateRequired(value, fieldName);

  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  if (options?.minLength && value.length < options.minLength) {
    throw new Error(`${fieldName} must be at least ${options.minLength} characters`);
  }

  if (options?.maxLength && value.length > options.maxLength) {
    throw new Error(`${fieldName} must be at most ${options.maxLength} characters`);
  }

  if (options?.pattern && !options.pattern.test(value)) {
    throw new Error(`${fieldName} has invalid format`);
  }
}

export function validateNumber(value: any, fieldName: string, options?: {
  min?: number;
  max?: number;
  integer?: boolean;
}): void {
  validateRequired(value, fieldName);

  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`${fieldName} must be a number`);
  }

  if (options?.integer && !Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer`);
  }

  if (options?.min !== undefined && value < options.min) {
    throw new Error(`${fieldName} must be at least ${options.min}`);
  }

  if (options?.max !== undefined && value > options.max) {
    throw new Error(`${fieldName} must be at most ${options.max}`);
  }
}

export function validateArray(value: any, fieldName: string, options?: {
  minLength?: number;
  maxLength?: number;
  itemValidator?: (item: any) => void;
}): void {
  validateRequired(value, fieldName);

  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }

  if (options?.minLength && value.length < options.minLength) {
    throw new Error(`${fieldName} must have at least ${options.minLength} items`);
  }

  if (options?.maxLength && value.length > options.maxLength) {
    throw new Error(`${fieldName} must have at most ${options.maxLength} items`);
  }

  if (options?.itemValidator) {
    value.forEach((item, index) => {
      try {
        options.itemValidator!(item);
      } catch (error: any) {
        throw new Error(`${fieldName}[${index}]: ${error.message}`);
      }
    });
  }
}

export function validateObject(value: any, fieldName: string, schema: Record<string, (val: any) => void>): void {
  validateRequired(value, fieldName);

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${fieldName} must be an object`);
  }

  for (const [key, validator] of Object.entries(schema)) {
    try {
      validator(value[key]);
    } catch (error: any) {
      throw new Error(`${fieldName}.${key}: ${error.message}`);
    }
  }
}