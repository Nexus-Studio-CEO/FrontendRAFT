/**
 * FrontendRAFT - Streaming Manager
 * 
 * Real-time streaming via async generators and CSOP sync.
 * RAFT Feature #1: Streaming API
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

import type { CSOPInstance, StreamOptions, StreamCallback, StreamSubscription } from '../types';

export class StreamManager {
  private csop: CSOPInstance;
  private subscriptions: Map<string, Set<StreamCallback>> = new Map();
  private activeStreams: Map<string, boolean> = new Map();

  constructor(csop: CSOPInstance) {
    this.csop = csop;
  }

  async subscribe(channel: string, callback: StreamCallback, options?: Omit<StreamOptions, 'channel'>): Promise<StreamSubscription> {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      await this.setupChannelListener(channel);
    }

    const callbacks = this.subscriptions.get(channel)!;
    const wrappedCallback = options?.filter
      ? (data: any) => { if (options.filter!(data)) callback(data); }
      : callback;

    callbacks.add(wrappedCallback);

    return {
      channel,
      callback: wrappedCallback,
      unsubscribe: async () => {
        callbacks.delete(wrappedCallback);
        if (callbacks.size === 0) this.subscriptions.delete(channel);
      }
    };
  }

  async broadcast(channel: string, data: any): Promise<void> {
    try {
      await this.csop.dispatch('sync.broadcast', {
        event: `raft:${channel}`,
        data: { timestamp: Date.now(), payload: data }
      });
    } catch (error) {
      console.error(`Failed to broadcast to ${channel}:`, error);
      throw error;
    }
  }

  async *stream(channel: string, options?: Omit<StreamOptions, 'channel'>): AsyncGenerator<any, void, unknown> {
    const queue: any[] = [];
    let resolve: ((value: any) => void) | null = null;
    let ended = false;

    const subscription = await this.subscribe(channel, (data) => {
      if (resolve) {
        resolve(data);
        resolve = null;
      } else {
        queue.push(data);
      }
    }, options);

    try {
      while (!ended) {
        if (queue.length > 0) {
          yield queue.shift();
        } else {
          const data = await new Promise<any>((res) => { resolve = res; });
          if (data === null) {
            ended = true;
          } else {
            yield data;
          }
        }
      }
    } finally {
      await subscription.unsubscribe();
    }
  }

  private async setupChannelListener(channel: string): Promise<void> {
    try {
      await this.csop.dispatch('sync.subscribe', {
        channel: `raft:${channel}`,
        callback: (message: any) => {
          const callbacks = this.subscriptions.get(channel);
          if (callbacks) {
            const payload = message.data?.payload || message.data;
            for (const callback of callbacks) {
              try {
                callback(payload);
              } catch (error) {
                console.error('Stream callback error:', error);
              }
            }
          }
        }
      });
      this.activeStreams.set(channel, true);
    } catch (error) {
      console.error(`Failed to setup listener for ${channel}:`, error);
      throw error;
    }
  }

  getActiveSubscriptions(): number {
    let total = 0;
    for (const callbacks of this.subscriptions.values()) total += callbacks.size;
    return total;
  }

  getActiveChannels(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  async closeAll(): Promise<void> {
    for (const channel of this.subscriptions.keys()) {
      this.subscriptions.delete(channel);
    }
    this.activeStreams.clear();
  }
}