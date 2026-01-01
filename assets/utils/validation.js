/**
 * FrontendRAFT - Validation
 * 
 * Data validation utilities
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

const Validation = {
    /**
     * Validate email
     */
    email(value) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(value);
    },

    /**
     * Validate URL
     */
    url(value) {
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Validate UUID
     */
    uuid(value) {
        const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return regex.test(value);
    },

    /**
     * Validate string length
     */
    length(value, min, max) {
        const len = String(value).length;
        if (min !== undefined && len < min) return false;
        if (max !== undefined && len > max) return false;
        return true;
    },

    /**
     * Validate number range
     */
    range(value, min, max) {
        const num = Number(value);
        if (isNaN(num)) return false;
        if (min !== undefined && num < min) return false;
        if (max !== undefined && num > max) return false;
        return true;
    },

    /**
     * Validate pattern (regex)
     */
    pattern(value, regex) {
        if (typeof regex === 'string') {
            regex = new RegExp(regex);
        }
        return regex.test(value);
    },

    /**
     * Validate required field
     */
    required(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
    },

    /**
     * Validate type
     */
    type(value, expectedType) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        return actualType === expectedType;
    },

    /**
     * Validate enum (one of)
     */
    enum(value, allowedValues) {
        return allowedValues.includes(value);
    },

    /**
     * Validate object schema
     */
    schema(obj, schema) {
        const errors = {};
        
        for (const key in schema) {
            const rules = schema[key];
            const value = obj[key];
            
            if (rules.required && !this.required(value)) {
                errors[key] = 'Field is required';
                continue;
            }
            
            if (!this.required(value)) {
                continue; // Skip other validations if not required and empty
            }
            
            if (rules.type && !this.type(value, rules.type)) {
                errors[key] = `Must be of type ${rules.type}`;
                continue;
            }
            
            if (rules.email && !this.email(value)) {
                errors[key] = 'Invalid email format';
                continue;
            }
            
            if (rules.url && !this.url(value)) {
                errors[key] = 'Invalid URL format';
                continue;
            }
            
            if (rules.min !== undefined || rules.max !== undefined) {
                if (rules.type === 'string' || typeof value === 'string') {
                    if (!this.length(value, rules.min, rules.max)) {
                        errors[key] = `Length must be between ${rules.min || 0} and ${rules.max || '∞'}`;
                        continue;
                    }
                } else if (rules.type === 'number' || typeof value === 'number') {
                    if (!this.range(value, rules.min, rules.max)) {
                        errors[key] = `Value must be between ${rules.min || '-∞'} and ${rules.max || '∞'}`;
                        continue;
                    }
                }
            }
            
            if (rules.pattern && !this.pattern(value, rules.pattern)) {
                errors[key] = 'Does not match required pattern';
                continue;
            }
            
            if (rules.enum && !this.enum(value, rules.enum)) {
                errors[key] = `Must be one of: ${rules.enum.join(', ')}`;
                continue;
            }
            
            if (rules.custom && typeof rules.custom === 'function') {
                const result = rules.custom(value, obj);
                if (result !== true) {
                    errors[key] = result || 'Custom validation failed';
                }
            }
        }
        
        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Validate API endpoint
     */
    endpoint(endpoint) {
        const errors = [];
        
        if (!endpoint.method) {
            errors.push('Method is required');
        } else if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(endpoint.method.toUpperCase())) {
            errors.push('Invalid HTTP method');
        }
        
        if (!endpoint.path) {
            errors.push('Path is required');
        } else if (!endpoint.path.startsWith('/')) {
            errors.push('Path must start with /');
        }
        
        if (!endpoint.handler) {
            errors.push('Handler function is required');
        } else {
            try {
                new Function('req', `return (${endpoint.handler})(req)`);
            } catch (error) {
                errors.push(`Invalid handler function: ${error.message}`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Validate API project
     */
    project(project) {
        const errors = {};
        
        if (!this.required(project.name)) {
            errors.name = 'Project name is required';
        } else if (!this.length(project.name, 1, 100)) {
            errors.name = 'Name must be between 1 and 100 characters';
        }
        
        if (!Array.isArray(project.endpoints)) {
            errors.endpoints = 'Endpoints must be an array';
        } else if (project.endpoints.length === 0) {
            errors.endpoints = 'At least one endpoint is required';
        } else {
            const endpointErrors = [];
            project.endpoints.forEach((endpoint, index) => {
                const validation = this.endpoint(endpoint);
                if (!validation.valid) {
                    endpointErrors.push({
                        index,
                        errors: validation.errors
                    });
                }
            });
            if (endpointErrors.length > 0) {
                errors.endpoints = endpointErrors;
            }
        }
        
        if (!this.enum(project.authStrategy, ['jwt', 'apikey', 'none'])) {
            errors.authStrategy = 'Invalid auth strategy';
        }
        
        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Sanitize input (prevent XSS)
     */
    sanitize(value) {
        if (typeof value !== 'string') return value;
        
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    },

    /**
     * Validate and sanitize
     */
    validateAndSanitize(obj, schema) {
        const validation = this.schema(obj, schema);
        
        if (!validation.valid) {
            return validation;
        }
        
        const sanitized = {};
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                sanitized[key] = this.sanitize(obj[key]);
            } else {
                sanitized[key] = obj[key];
            }
        }
        
        return {
            valid: true,
            data: sanitized
        };
    }
};

// Make available globally
window.Validation = Validation;