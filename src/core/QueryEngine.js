/**
 * FrontendRAFT - Query Engine
 * 
 * GraphQL-like query language for precise data fetching - Feature #5
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

export class QueryEngine {
  constructor() {
    this.queryCount = 0;
  }

  query(data, options = {}) {
    this.queryCount++;

    let result = Array.isArray(data) ? [...data] : [data];

    if (options.where) {
      result = this._applyWhere(result, options.where);
    }

    if (options.orderBy) {
      result = this._applyOrderBy(result, options.orderBy);
    }

    if (options.limit) {
      result = result.slice(0, options.limit);
    }

    if (options.offset) {
      result = result.slice(options.offset);
    }

    if (options.select) {
      result = this._applySelect(result, options.select);
    }

    return Array.isArray(data) ? result : result[0];
  }

  _applyWhere(data, where) {
    return data.filter(item => {
      for (const [key, condition] of Object.entries(where)) {
        if (!this._matchCondition(item[key], condition)) {
          return false;
        }
      }
      return true;
    });
  }

  _matchCondition(value, condition) {
    if (typeof condition !== 'object' || condition === null) {
      return value === condition;
    }

    if (condition.$eq !== undefined) {
      return value === condition.$eq;
    }

    if (condition.$ne !== undefined) {
      return value !== condition.$ne;
    }

    if (condition.$gt !== undefined) {
      return value > condition.$gt;
    }

    if (condition.$gte !== undefined) {
      return value >= condition.$gte;
    }

    if (condition.$lt !== undefined) {
      return value < condition.$lt;
    }

    if (condition.$lte !== undefined) {
      return value <= condition.$lte;
    }

    if (condition.$in !== undefined) {
      return condition.$in.includes(value);
    }

    if (condition.$nin !== undefined) {
      return !condition.$nin.includes(value);
    }

    if (condition.$contains !== undefined) {
      return String(value).includes(condition.$contains);
    }

    if (condition.$startsWith !== undefined) {
      return String(value).startsWith(condition.$startsWith);
    }

    if (condition.$endsWith !== undefined) {
      return String(value).endsWith(condition.$endsWith);
    }

    return true;
  }

  _applyOrderBy(data, orderBy) {
    const fields = Array.isArray(orderBy) ? orderBy : [orderBy];

    return data.sort((a, b) => {
      for (const field of fields) {
        const isDesc = field.startsWith('-');
        const key = isDesc ? field.slice(1) : field;

        const aVal = a[key];
        const bVal = b[key];

        if (aVal < bVal) return isDesc ? 1 : -1;
        if (aVal > bVal) return isDesc ? -1 : 1;
      }
      return 0;
    });
  }

  _applySelect(data, select) {
    return data.map(item => {
      const selected = {};
      for (const field of select) {
        if (item.hasOwnProperty(field)) {
          selected[field] = item[field];
        }
      }
      return selected;
    });
  }

  aggregate(data, aggregations) {
    const result = {};

    for (const [key, agg] of Object.entries(aggregations)) {
      if (agg.$count) {
        result[key] = data.length;
      }

      if (agg.$sum) {
        result[key] = data.reduce((sum, item) => sum + (item[agg.$sum] || 0), 0);
      }

      if (agg.$avg) {
        const sum = data.reduce((sum, item) => sum + (item[agg.$avg] || 0), 0);
        result[key] = data.length > 0 ? sum / data.length : 0;
      }

      if (agg.$min) {
        result[key] = Math.min(...data.map(item => item[agg.$min] || Infinity));
      }

      if (agg.$max) {
        result[key] = Math.max(...data.map(item => item[agg.$max] || -Infinity));
      }

      if (agg.$first) {
        result[key] = data[0]?.[agg.$first];
      }

      if (agg.$last) {
        result[key] = data[data.length - 1]?.[agg.$last];
      }
    }

    return result;
  }

  groupBy(data, field) {
    const groups = {};

    for (const item of data) {
      const key = item[field];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }

    return groups;
  }

  join(leftData, rightData, leftKey, rightKey, type = 'inner') {
    const result = [];

    for (const leftItem of leftData) {
      const matches = rightData.filter(rightItem => 
        leftItem[leftKey] === rightItem[rightKey]
      );

      if (matches.length > 0) {
        for (const match of matches) {
          result.push({ ...leftItem, ...match });
        }
      } else if (type === 'left') {
        result.push(leftItem);
      }
    }

    return result;
  }

  getStats() {
    return {
      totalQueries: this.queryCount
    };
  }
}