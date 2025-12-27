/**
 * FrontendRAFT - P2P Layer
 * 
 * WebRTC peer-to-peer communication via CSOP sync.
 * Enables direct browser-to-browser API calls.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

import type { CSOPInstance, P2PMessage } from '../types';

export class P2PLayer {
  private csop: CSOPInstance;
  private peerId: string;
  private connections: Map<string, any> = new Map();

  constructor(csop: CSOPInstance) {
    this.csop = csop;
    this.peerId = `peer_${crypto.randomUUID()}`;
  }

  async setupConnection(apiId: string): Promise<void> {
    await this.csop.dispatch('sync.subscribe', {
      channel: `p2p:${apiId}`,
      callback: (message: P2PMessage) => {
        this.handleMessage(message);
      }
    });
  }

  async sendRequest(apiId: string, request: any): Promise<any> {
    const requestId = crypto.randomUUID();

    await this.csop.dispatch('sync.broadcast', {
      event: `p2p:${apiId}`,
      data: {
        type: 'request',
        requestId,
        apiId,
        data: request,
        timestamp: Date.now()
      }
    });

    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 5000);
      
      const checkResponse = (msg: P2PMessage) => {
        if (msg.requestId === requestId && msg.type === 'response') {
          clearTimeout(timeout);
          resolve(msg.data);
        }
      };

      this.connections.set(requestId, checkResponse);
    });
  }

  private handleMessage(message: P2PMessage): void {
    const handler = this.connections.get(message.requestId || '');
    if (handler) {
      handler(message);
      this.connections.delete(message.requestId!);
    }
  }

  getPeerId(): string {
    return this.peerId;
  }
}