/**
 * FrontendRAFT - Query Language Engine
 * 
 * RAFT Feature #5: GraphQL-like query language for precise data fetching.
 * Fetch only the fields you need, reducing payload size and bandwidth.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

/**
 * Query Language Syntax:
 * 
 * 1. Field selection: { fields: ['name', 'email'] }
 * 2. Nested selection: { fields: ['user.name', 'user.profile.avatar'] }
 * 3. Filtering: { where: { status: 'active' } }
 * 4. Sorting: { orderBy: ['createdAt', 'desc'] }
 * 5. Pagination: { limit: 10, offset: 20 }
 * 6. Relations: { include: ['posts', 'comments'] }
 */
export class QueryEngine {
  /**
   * @param {StorageLayer} storage CSOP storage layer
   */
  constructor(storage) {
    this.storage = storage;

    console.log('✅ QueryEngine initialized (RAFT Feature #5)');
  }

  /**
   * Execute query on data
   * 
   * @param {any} data Source data
   * @param {Object} query Query object
   * @returns {any} Filtered data
   * 
   * @example
   * const result = query.execute(users, {
   *   fields: ['name', 'email'],
   *   where: { status: 'active' },
   *   limit: 10
   * });
   */
  execute(data, query = {}) {
    if (!data) {
      return null;
    }

    let result = data;

    // Handle arrays
    if (Array.isArray(data)) {
      // 1. Filter
      if (query.where) {
        result = this._filter(result, query.where);
      }

      // 2. Sort
      if (query.orderBy) {
        result = this._sort(result, query.orderBy);
      }

      // 3. Paginate
      if (query.offset !== undefined || query.limit !== undefined) {
        result = this._paginate(result, query.offset, query.limit);
      }

      // 4. Select fields
      if (query.fields) {
        result = result.map(item => this._selectFields(item, query.fields));
      }

      // 5. Include relations
      if (query.include) {
        result = result.map(item => this._includeRelations(item, query.include));
      }
    } else {
      // Handle single object
      if (query.fields) {
        result = this._selectFields(result, query.fields);
      }

      if (query.include) {
        result = this._includeRelations(result, query.include);
      }
    }

    return result;
  }

  /**
   * Apply query to path (modifies URL with query params)
   * 
   * @param {string} path Original path
   * @param {Object} query Query object
   * @returns {string} Path with query string
   * 
   * @example
   * const path = query.applyQuery('/api/users', { limit: 10 });
   * // → '/api/users?query=eyJsaW1pdCI6MTB9'
   */
  applyQuery(path, query) {
    // Encode query as base64 for URL
    const queryString = btoa(JSON.stringify(query));
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}query=${queryString}`;
  }

  /**
   * Parse query from URL
   * 
   * @param {string} path Path with query string
   * @returns {Object} Parsed query object
   */
  parseQuery(path) {
    const url = new URL(path, 'http://dummy.com');
    const queryParam = url.searchParams.get('query');

    if (!queryParam) {
      return {};
    }

    try {
      return JSON.parse(atob(queryParam));
    } catch (error) {
      console.warn('Failed to parse query:', error);
      return {};
    }
  }

  /**
   * Filter array by conditions
   * @private
   */
  _filter(array, where) {
    return array.filter(item => {
      return Object.entries(where).every(([key, value]) => {
        const itemValue = this._getNestedValue(item, key);

        // Handle operators
        if (typeof value === 'object' && value !== null) {
          return this._applyOperator(itemValue, value);
        }

        // Direct comparison
        return itemValue === value;
      });
    });
  }

  /**
   * Apply query operators
   * @private
   */
  _applyOperator(value, operator) {
    if (operator.$eq !== undefined) return value === operator.$eq;
    if (operator.$ne !== undefined) return value !== operator.$ne;
    if (operator.$gt !== undefined) return value > operator.$gt;
    if (operator.$gte !== undefined) return value >= operator.$gte;
    if (operator.$lt !== undefined) return value < operator.$lt;
    if (operator.$lte !== undefined) return value <= operator.$lte;
    if (operator.$in !== undefined) return operator.$in.includes(value);
    if (operator.$nin !== undefined) return !operator.$nin.includes(value);
    if (operator.$contains !== undefined) return value && value.includes(operator.$contains);
    if (operator.$startsWith !== undefined) return value && value.startsWith(operator.$startsWith);
    if (operator.$endsWith !== undefined) return value && value.endsWith(operator.$endsWith);

    return true;
  }

  /**
   * Sort array
   * @private
   */
  _sort(array, orderBy) {
    const [field, direction = 'asc'] = Array.isArray(orderBy) ? orderBy : [orderBy, 'asc'];

    return [...array].sort((a, b) => {
      const aVal = this._getNestedValue(a, field);
      const bVal = this._getNestedValue(b, field);

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Paginate array
   * @private
   */
  _paginate(array, offset = 0, limit) {
    const start = offset;
    const end = limit !== undefined ? offset + limit : undefined;
    return array.slice(start, end);
  }

  /**
   * Select specific fields
   * @private
   */
  _selectFields(item, fields) {
    const result = {};

    fields.forEach(field => {
      const value = this._getNestedValue(item, field);
      this._setNestedValue(result, field, value);
    });

    return result;
  }

  /**
   * Include relations (stub for future)
   * @private
   */
  _includeRelations(item, relations) {
    // TODO: Implement relation loading via CSOP storage
    return item;
  }

  /**
   * Get nested object value by path
   * @private
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => 
      current?.[key], obj
    );
  }

  /**
   * Set nested object value by path
   * @private
   */
  _setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);

    target[lastKey] = value;
  }

  /**
   * Build query helper (fluent API)
   * 
   * @returns {QueryBuilder} Query builder
   * 
   * @example
   * const query = queryEngine.build()
   *   .select(['name', 'email'])
   *   .where({ status: 'active' })
   *   .limit(10)
   *   .toQuery();
   */
  build() {
    return new QueryBuilder();
  }
}

/**
 * Query Builder (Fluent API)
 */
class QueryBuilder {
  constructor() {
    this.query = {};
  }

  select(fields) {
    this.query.fields = fields;
    return this;
  }

  where(conditions) {
    this.query.where = conditions;
    return this;
  }

  orderBy(field, direction = 'asc') {
    this.query.orderBy = [field, direction];
    return this;
  }

  limit(count) {
    this.query.limit = count;
    return this;
  }

  offset(count) {
    this.query.offset = count;
    return this;
  }

  include(relations) {
    this.query.include = relations;
    return this;
  }

  toQuery() {
    return this.query;
  }
}

export default QueryEngine;