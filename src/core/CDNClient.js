/**
 * FrontendRAFT - CDN Registry Client
 * 
 * API registration and discovery via CDN
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

import { Crypto } from '../utils/crypto.js';

export class CDNClient {
  constructor(config = {}) {
    this.registryUrl = config.registryUrl || 'https://cdn.frontierapi.io';
    this.apiId = null;
    this.registered = false;
    this.heartbeatInterval = null;
  }

  async register(metadata) {
    const apiId = metadata.apiId || `api_${Crypto.generateUUID()}`;

    const registration = {
      apiId,
      name: metadata.name,
      version: metadata.version || '1.0.0',
      siteUrl: window.location.origin,
      endpoints: metadata.endpoints || [],
      p2pAddress: metadata.p2pAddress || null,
      registeredAt: Date.now(),
      status: 'online'
    };

    try {
      const response = await fetch(`${this.registryUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration)
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
      }

      const result = await response.json();

      this.apiId = apiId;
      this.registered = true;

      this.startHeartbeat();

      return {
        apiId,
        publicUrl: `${this.registryUrl}/${apiId}`,
        ...result
      };
    } catch (error) {
      console.warn('CDN registration failed, running in local-only mode:', error.message);
      
      this.apiId = apiId;
      this.registered = false;

      return {
        apiId,
        publicUrl: null,
        localOnly: true,
        error: error.message
      };
    }
  }

  async unregister() {
    if (!this.apiId) {
      return { success: false, error: 'Not registered' };
    }

    this.stopHeartbeat();

    try {
      const response = await fetch(`${this.registryUrl}/unregister/${this.apiId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Unregistration failed: ${response.statusText}`);
      }

      this.registered = false;
      this.apiId = null;

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async discover(apiId) {
    try {
      const response = await fetch(`${this.registryUrl}/discover/${apiId}`);

      if (!response.ok) {
        throw new Error(`API not found: ${apiId}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Discovery failed: ${error.message}`);
    }
  }

  async heartbeat() {
    if (!this.apiId || !this.registered) {
      return;
    }

    try {
      const response = await fetch(`${this.registryUrl}/heartbeat/${this.apiId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: Date.now(),
          status: 'online'
        })
      });

      if (!response.ok) {
        console.warn('Heartbeat failed:', response.statusText);
      }
    } catch (error) {
      console.warn('Heartbeat error:', error.message);
    }
  }

  startHeartbeat(interval = 30000) {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      this.heartbeat();
    }, interval);

    this.heartbeat();
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async listAPIs(filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const url = `${this.registryUrl}/apis${queryString ? '?' + queryString : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to list APIs: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`List APIs failed: ${error.message}`);
    }
  }

  async getStats() {
    if (!this.apiId) {
      return null;
    }

    try {
      const response = await fetch(`${this.registryUrl}/stats/${this.apiId}`);

      if (!response.ok) {
        throw new Error(`Failed to get stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return null;
    }
  }

  getStatus() {
    return {
      apiId: this.apiId,
      registered: this.registered,
      registryUrl: this.registryUrl,
      heartbeatActive: this.heartbeatInterval !== null
    };
  }
}