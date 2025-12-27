/**
 * FrontendRAFT - CDN Client
 * 
 * Client for CDN registry communication.
 * Handles API registration and discovery.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

import type { CSOPInstance, APIMetadata, RAFTConfig } from '../types';

export class CDNClient {
  private csop: CSOPInstance;
  private registryUrl: string;

  constructor(csop: CSOPInstance, config?: RAFTConfig['cdn']) {
    this.csop = csop;
    this.registryUrl = config?.registryUrl || 'https://cdn.frontierapi.io';
  }

  async register(metadata: Omit<APIMetadata, 'registeredAt' | 'status'>): Promise<{ publicUrl: string }> {
    const fullMetadata: APIMetadata = {
      ...metadata,
      registeredAt: Date.now(),
      status: 'online'
    };

    try {
      const response = await fetch(`${this.registryUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullMetadata)
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const result = await response.json();
      return {
        publicUrl: `${this.registryUrl}/${metadata.apiId}`
      };
    } catch (error) {
      console.error('CDN registration failed:', error);
      return {
        publicUrl: `${this.registryUrl}/${metadata.apiId}`
      };
    }
  }

  async heartbeat(apiId: string): Promise<void> {
    try {
      await fetch(`${this.registryUrl}/heartbeat/${apiId}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  }

  async discover(apiId: string): Promise<APIMetadata | null> {
    try {
      const response = await fetch(`${this.registryUrl}/discover/${apiId}`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Discovery failed:', error);
      return null;
    }
  }
}