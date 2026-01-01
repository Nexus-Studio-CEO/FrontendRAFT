/**
 * FrontendRAFT - Query Engine
 * 
 * GraphQL-like query language for precise data fetching
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

class QueryEngine {
    constructor() {
        this.schemas = new Map();
        this.resolvers = new Map();
    }

    /**
     * Register data schema
     * @param {string} typeName - Type name (e.g., 'User', 'Post')
     * @param {object} schema - Schema definition
     */
    registerSchema(typeName, schema) {
        this.schemas.set(typeName, schema);
        Logger.info(`QueryEngine: Registered schema for "${typeName}"`);
    }

    /**
     * Register resolver function
     * @param {string} typeName - Type name
     * @param {function} resolver - Resolver function
     */
    registerResolver(typeName, resolver) {
        this.resolvers.set(typeName, resolver);
        Logger.info(`QueryEngine: Registered resolver for "${typeName}"`);
    }

    /**
     * Execute query
     * @param {object} query - Query object { type, fields, filter, sort, limit }
     * @returns {Promise<any>} Query result
     */
    async execute(query) {
        const { type, fields, filter, sort, limit } = query;
        
        Logger.info(`QueryEngine: Executing query for "${type}"`);
        
        // Get resolver
        const resolver = this.resolvers.get(type);
        if (!resolver) {
            throw new Error(`No resolver found for type "${type}"`);
        }
        
        // Fetch data
        let data = await resolver(filter);
        
        // Apply filtering
        if (filter) {
            data = this._applyFilter(data, filter);
        }
        
        // Apply sorting
        if (sort) {
            data = this._applySort(data, sort);
        }
        
        // Apply limit
        if (limit) {
            data = data.slice(0, limit);
        }
        
        // Project fields
        if (fields) {
            data = this._projectFields(data, fields);
        }
        
        return data;
    }

    /**
     * Parse query string (GraphQL-like syntax)
     * @param {string} queryString - Query string
     * @returns {object} Parsed query
     */
    parse(queryString) {
        // Simple parser for basic queries
        // Example: "users { id, name, email } where age > 18 limit 10"
        
        const typeMatch = queryString.match(/^(\w+)/);
        const fieldsMatch = queryString.match(/\{([^}]+)\}/);
        const whereMatch = queryString.match(/where (.+?)(?:limit|sort|$)/i);
        const limitMatch = queryString.match(/limit (\d+)/i);
        const sortMatch = queryString.match(/sort by (\w+) (asc|desc)/i);
        
        const query = {
            type: typeMatch ? typeMatch[1] : null,
            fields: fieldsMatch ? fieldsMatch[1].split(',').map(f => f.trim()) : null,
            filter: whereMatch ? this._parseFilter(whereMatch[1]) : null,
            limit: limitMatch ? parseInt(limitMatch[1]) : null,
            sort: sortMatch ? { field: sortMatch[1], order: sortMatch[2] } : null
        };
        
        Logger.info(`QueryEngine: Parsed query`, query);
        return query;
    }

    /**
     * Parse filter expression
     */
    _parseFilter(filterString) {
        const operators = {
            '>': (a, b) => a > b,
            '<': (a, b) => a < b,
            '>=': (a, b) => a >= b,
            '<=': (a, b) => a <= b,
            '=': (a, b) => a === b,
            '!=': (a, b) => a !== b,
            'contains': (a, b) => String(a).includes(b)
        };
        
        const parts = filterString.trim().split(/\s+/);
        const field = parts[0];
        const operator = parts[1];
        const value = parts.slice(2).join(' ').replace(/['"]/g, '');
        
        return {
            field,
            operator,
            value: isNaN(value) ? value : Number(value),
            fn: operators[operator] || operators['=']
        };
    }

    /**
     * Apply filter to data
     */
    _applyFilter(data, filter) {
        return Array.isArray(data)
            ? data.filter(item => filter.fn(item[filter.field], filter.value))
            : data;
    }

    /**
     * Apply sorting
     */
    _applySort(data, sort) {
        if (!Array.isArray(data)) return data;
        
        return [...data].sort((a, b) => {
            const aVal = a[sort.field];
            const bVal = b[sort.field];
            
            if (sort.order === 'desc') {
                return bVal > aVal ? 1 : -1;
            } else {
                return aVal > bVal ? 1 : -1;
            }
        });
    }

    /**
     * Project specific fields
     */
    _projectFields(data, fields) {
        const project = (item) => {
            const result = {};
            fields.forEach(field => {
                if (item.hasOwnProperty(field)) {
                    result[field] = item[field];
                }
            });
            return result;
        };
        
        return Array.isArray(data)
            ? data.map(project)
            : project(data);
    }

    /**
     * Create query builder
     */
    createBuilder(type) {
        let query = { type };
        
        return {
            select: (...fields) => {
                query.fields = fields;
                return this;
            },
            
            where: (field, operator, value) => {
                query.filter = { field, operator, value };
                return this;
            },
            
            sortBy: (field, order = 'asc') => {
                query.sort = { field, order };
                return this;
            },
            
            limit: (count) => {
                query.limit = count;
                return this;
            },
            
            execute: () => this.execute(query)
        };
    }

    /**
     * Execute aggregation query
     * @param {string} type - Data type
     * @param {object} aggregation - { count, sum, avg, min, max }
     */
    async aggregate(type, aggregation) {
        const resolver = this.resolvers.get(type);
        if (!resolver) {
            throw new Error(`No resolver found for type "${type}"`);
        }
        
        const data = await resolver();
        
        const result = {};
        
        if (aggregation.count) {
            result.count = Array.isArray(data) ? data.length : 1;
        }
        
        if (aggregation.sum && aggregation.sum.field) {
            const field = aggregation.sum.field;
            result.sum = data.reduce((sum, item) => sum + (item[field] || 0), 0);
        }
        
        if (aggregation.avg && aggregation.avg.field) {
            const field = aggregation.avg.field;
            const sum = data.reduce((sum, item) => sum + (item[field] || 0), 0);
            result.avg = data.length > 0 ? sum / data.length : 0;
        }
        
        if (aggregation.min && aggregation.min.field) {
            const field = aggregation.min.field;
            result.min = Math.min(...data.map(item => item[field] || 0));
        }
        
        if (aggregation.max && aggregation.max.field) {
            const field = aggregation.max.field;
            result.max = Math.max(...data.map(item => item[field] || 0));
        }
        
        Logger.info(`QueryEngine: Aggregation result`, result);
        return result;
    }

    /**
     * Batch query execution
     */
    async executeBatch(queries) {
        Logger.info(`QueryEngine: Executing batch of ${queries.length} queries`);
        
        const results = await Promise.all(
            queries.map(q => this.execute(q))
        );
        
        return results;
    }
}

// Global instance
window.QueryEngine = new QueryEngine();