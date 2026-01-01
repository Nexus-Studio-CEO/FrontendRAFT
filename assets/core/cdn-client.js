/**
 * FrontendRAFT - CDN Client
 * 
 * Handles API registration and communication with CDN registry
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

class CDNClient {
    constructor() {
        this.registryUrl = 'https://raft-cdn.example.com'; // Placeholder
        this.apiId = null;
        this.registered = false;
        this.heartbeatInterval = null;
    }

    /**
     * Register API with CDN registry
     * @param {object} apiConfig - API configuration
     * @returns {Promise<string>} API ID
     */
    async register(apiConfig) {
        const { name, endpoints, authStrategy, p2pAddress } = apiConfig;
        
        // Generate unique API ID
        this.apiId = 'api_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const payload = {
            apiId: this.apiId,
            name,
            endpoints: endpoints.map(e => ({
                method: e.method,
                path: e.path,
                description: e.description || ''
            })),
            authStrategy,
            p2pAddress: p2pAddress || P2PLayer.peerId,
            registeredAt: Date.now(),
            version: '0.1.0'
        };
        
        // In production, POST to registry
        // const response = await fetch(`${this.registryUrl}/register`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(payload)
        // });
        
        // For now, store locally
        localStorage.setItem('raft_api_config', JSON.stringify(payload));
        
        this.registered = true;
        Logger.info(`CDNClient: API registered with ID: ${this.apiId}`);
        
        // Start heartbeat
        this._startHeartbeat();
        
        return this.apiId;
    }

    /**
     * Unregister API from CDN
     */
    async unregister() {
        if (!this.apiId) return;
        
        // In production, DELETE from registry
        // await fetch(`${this.registryUrl}/api/${this.apiId}`, {
        //     method: 'DELETE'
        // });
        
        localStorage.removeItem('raft_api_config');
        
        this._stopHeartbeat();
        this.registered = false;
        this.apiId = null;
        
        Logger.info('CDNClient: API unregistered');
    }

    /**
     * Update API configuration
     */
    async updateConfig(updates) {
        if (!this.apiId) {
            throw new Error('API not registered');
        }
        
        const current = JSON.parse(localStorage.getItem('raft_api_config') || '{}');
        const updated = { ...current, ...updates, updatedAt: Date.now() };
        
        localStorage.setItem('raft_api_config', JSON.stringify(updated));
        
        Logger.info(`CDNClient: API config updated`);
    }

    /**
     * Get API configuration
     */
    getConfig() {
        const config = localStorage.getItem('raft_api_config');
        return config ? JSON.parse(config) : null;
    }

    /**
     * Start heartbeat to keep API alive in registry
     */
    _startHeartbeat() {
        this.heartbeatInterval = setInterval(async () => {
            if (!this.apiId) return;
            
            // In production, POST heartbeat
            // await fetch(`${this.registryUrl}/heartbeat/${this.apiId}`, {
            //     method: 'POST'
            // });
            
            Logger.info(`CDNClient: Heartbeat sent for ${this.apiId}`);
        }, 30000); // Every 30 seconds
    }

    /**
     * Stop heartbeat
     */
    _stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Discover API by ID
     * @param {string} apiId - API identifier
     * @returns {Promise<object>} API configuration
     */
    async discover(apiId) {
        // In production, GET from registry
        // const response = await fetch(`${this.registryUrl}/api/${apiId}`);
        // return await response.json();
        
        // For now, check local storage
        const config = this.getConfig();
        if (config && config.apiId === apiId) {
            return config;
        }
        
        throw new Error(`API ${apiId} not found`);
    }

    /**
     * Call remote API
     * @param {string} apiId - Target API ID
     * @param {object} request - Request object
     * @returns {Promise<object>} Response
     */
    async call(apiId, request) {
        Logger.info(`CDNClient: Calling API ${apiId}`);
        
        // Discover API
        const apiConfig = await this.discover(apiId);
        
        // Try P2P first
        if (apiConfig.p2pAddress && P2PLayer.isConnected(apiConfig.p2pAddress)) {
            Logger.info('CDNClient: Using P2P connection');
            return await this._callViaP2P(apiConfig.p2pAddress, request);
        }
        
        // Fallback to CDN relay
        Logger.info('CDNClient: Using CDN relay');
        return await this._callViaCDN(apiId, request);
    }

    /**
     * Call API via P2P
     */
    async _callViaP2P(peerId, request) {
        return new Promise((resolve, reject) => {
            const requestId = 'req_' + Date.now();
            
            // Setup response handler
            const handler = (response) => {
                if (response.requestId === requestId) {
                    P2PLayer.off('api:response');
                    resolve(response);
                }
            };
            
            P2PLayer.on('api:response', handler);
            
            // Send request
            P2PLayer.send(peerId, {
                type: 'api:request',
                requestId,
                request
            }).catch(reject);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                P2PLayer.off('api:response');
                reject(new Error('P2P request timeout'));
            }, 10000);
        });
    }

    /**
     * Call API via CDN relay
     */
    async _callViaCDN(apiId, request) {
        // In production, POST to CDN relay
        // const response = await fetch(`${this.registryUrl}/relay/${apiId}`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(request)
        // });
        // return await response.json();
        
        // For now, simulate local routing
        const route = Router._findRoute(request.method, request.path);
        if (route) {
            return await Router.handle(request);
        }
        
        throw new Error('Endpoint not found');
    }

    /**
     * Get API statistics from CDN
     */
    async getStats(apiId) {
        // In production, GET from registry
        // const response = await fetch(`${this.registryUrl}/stats/${apiId}`);
        // return await response.json();
        
        return {
            apiId,
            calls: 0,
            uptime: '100%',
            avgLatency: '50ms'
        };
    }

    /**
     * List all registered APIs (public directory)
     */
    async listAPIs(filters = {}) {
        // In production, GET from registry
        // const params = new URLSearchParams(filters);
        // const response = await fetch(`${this.registryUrl}/apis?${params}`);
        // return await response.json();
        
        const config = this.getConfig();
        return config ? [config] : [];
    }

    /**
     * Generate API documentation URL
     */
    getDocumentationURL(apiId) {
        return `${this.registryUrl}/docs/${apiId || this.apiId}`;
    }

    /**
     * Generate API endpoint URL
     */
    getEndpointURL(path = '') {
        if (!this.apiId) {
            throw new Error('API not registered');
        }
        return `${this.registryUrl}/${this.apiId}${path}`;
    }

    /**
     * Check API health
     */
    async checkHealth(apiId) {
        try {
            const response = await this.call(apiId, {
                method: 'GET',
                path: '/health'
            });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }
}

// Global instance
window.CDNClient = new CDNClient();