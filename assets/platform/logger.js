/**
 * FrontendRAFT - Logger
 * 
 * Platform-wide logging system with UI display
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

class Logger {
    constructor() {
        this.logs = [];
        this.maxLogs = 500;
        this.listeners = new Set();
        this.levels = {
            DEBUG: { color: 'text-slate-400', icon: '🐛' },
            INFO: { color: 'text-blue-400', icon: 'ℹ️' },
            WARN: { color: 'text-yellow-400', icon: '⚠️' },
            ERROR: { color: 'text-red-400', icon: '❌' },
            SUCCESS: { color: 'text-green-400', icon: '✅' }
        };
    }

    /**
     * Add log entry
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {object} data - Additional data
     */
    _log(level, message, data = null) {
        const entry = {
            id: Date.now() + Math.random(),
            level,
            message,
            data,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString()
        };
        
        this.logs.push(entry);
        
        // Keep only last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Notify listeners
        this.listeners.forEach(listener => {
            try {
                listener(entry);
            } catch (error) {
                console.error('Logger: Listener error', error);
            }
        });
        
        // Console output
        const consoleFn = level === 'ERROR' ? console.error : 
                         level === 'WARN' ? console.warn : 
                         console.log;
        
        consoleFn(`[${entry.time}] [${level}] ${message}`, data || '');
        
        // Update UI if logs container exists
        this._updateUI(entry);
    }

    /**
     * Log levels
     */
    debug(message, data) {
        this._log('DEBUG', message, data);
    }

    info(message, data) {
        this._log('INFO', message, data);
    }

    warn(message, data) {
        this._log('WARN', message, data);
    }

    error(message, data) {
        this._log('ERROR', message, data);
    }

    success(message, data) {
        this._log('SUCCESS', message, data);
    }

    /**
     * Subscribe to log events
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Get logs with filter
     */
    getLogs(filter = {}) {
        let filtered = [...this.logs];
        
        if (filter.level) {
            filtered = filtered.filter(log => log.level === filter.level);
        }
        
        if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            filtered = filtered.filter(log => 
                log.message.toLowerCase().includes(searchLower)
            );
        }
        
        if (filter.since) {
            filtered = filtered.filter(log => 
                new Date(log.timestamp) >= new Date(filter.since)
            );
        }
        
        return filtered;
    }

    /**
     * Clear all logs
     */
    clear() {
        this.logs = [];
        this._updateUI();
        console.clear();
        this.info('Logger: Logs cleared');
    }

    /**
     * Export logs as JSON
     */
    export() {
        const data = JSON.stringify(this.logs, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `raft-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.info('Logger: Logs exported');
    }

    /**
     * Update UI logs container
     */
    _updateUI(newEntry = null) {
        const container = document.getElementById('logs-container');
        if (!container) return;
        
        if (newEntry) {
            const logElement = this._createLogElement(newEntry);
            container.appendChild(logElement);
            
            // Auto-scroll to bottom
            container.scrollTop = container.scrollHeight;
            
            // Keep only last 100 visible
            while (container.children.length > 100) {
                container.removeChild(container.firstChild);
            }
        } else {
            // Full refresh
            container.innerHTML = '';
            this.logs.slice(-100).forEach(log => {
                const logElement = this._createLogElement(log);
                container.appendChild(logElement);
            });
        }
    }

    /**
     * Create log element for UI
     */
    _createLogElement(log) {
        const div = document.createElement('div');
        div.className = 'flex gap-2 text-xs hover:bg-slate-800/50 p-1 rounded';
        
        const levelConfig = this.levels[log.level] || this.levels.INFO;
        
        div.innerHTML = `
            <span class="text-slate-600 w-16 shrink-0">${log.time}</span>
            <span class="w-4 shrink-0">${levelConfig.icon}</span>
            <span class="${levelConfig.color} w-16 shrink-0">${log.level}</span>
            <span class="text-slate-300 flex-1">${this._escapeHtml(log.message)}</span>
        `;
        
        if (log.data) {
            div.title = JSON.stringify(log.data, null, 2);
        }
        
        return div;
    }

    /**
     * Escape HTML to prevent XSS
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get statistics
     */
    getStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {}
        };
        
        Object.keys(this.levels).forEach(level => {
            stats.byLevel[level] = this.logs.filter(log => log.level === level).length;
        });
        
        return stats;
    }

    /**
     * Create performance timer
     */
    time(label) {
        const startTime = performance.now();
        
        return {
            end: () => {
                const duration = performance.now() - startTime;
                this.info(`${label}: ${duration.toFixed(2)}ms`);
                return duration;
            }
        };
    }

    /**
     * Log with context
     */
    withContext(context) {
        return {
            debug: (msg, data) => this.debug(`[${context}] ${msg}`, data),
            info: (msg, data) => this.info(`[${context}] ${msg}`, data),
            warn: (msg, data) => this.warn(`[${context}] ${msg}`, data),
            error: (msg, data) => this.error(`[${context}] ${msg}`, data),
            success: (msg, data) => this.success(`[${context}] ${msg}`, data)
        };
    }
}

// Global instance
window.Logger = new Logger();

// System initialization log
window.addEventListener('DOMContentLoaded', () => {
    Logger.success('FrontendRAFT Platform initialized');
    Logger.info('RAFT Protocol: v0.1.0');
    Logger.info('Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP');
});