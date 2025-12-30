/**
 * FrontendRAFT - Streaming Manager
 * 
 * Real-time streaming API with async generators - Feature #1
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

export class StreamManager {
  constructor() {
    this.streams = new Map();
    this.subscribers = new Map();
  }

  async *createStream(channel, generator, config = {}) {
    const streamId = `${channel}_${Date.now()}`;
    const interval = config.interval || 1000;
    
    const stream = {
      id: streamId,
      channel,
      active: true,
      startTime: Date.now(),
      messageCount: 0
    };

    this.streams.set(streamId, stream);

    try {
      while (stream.active) {
        const data = await generator();
        
        if (data !== undefined) {
          stream.messageCount++;
          
          const message = {
            streamId,
            channel,
            data,
            timestamp: Date.now(),
            sequence: stream.messageCount
          };

          this._broadcast(channel, message);
          
          yield message;
        }

        await new Promise(resolve => setTimeout(resolve, interval));
      }
    } finally {
      this.streams.delete(streamId);
    }
  }

  subscribe(channel, callback) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }

    const subscriber = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      callback,
      subscribedAt: Date.now()
    };

    this.subscribers.get(channel).add(subscriber);

    return () => {
      const subs = this.subscribers.get(channel);
      if (subs) {
        subs.delete(subscriber);
        if (subs.size === 0) {
          this.subscribers.delete(channel);
        }
      }
    };
  }

  _broadcast(channel, message) {
    const subs = this.subscribers.get(channel);
    if (subs) {
      for (const subscriber of subs) {
        try {
          subscriber.callback(message);
        } catch (error) {
          console.error(`Stream broadcast error for ${channel}:`, error);
        }
      }
    }
  }

  stopStream(streamId) {
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.active = false;
    }
  }

  stopChannel(channel) {
    for (const [streamId, stream] of this.streams.entries()) {
      if (stream.channel === channel) {
        stream.active = false;
      }
    }
  }

  stopAll() {
    for (const stream of this.streams.values()) {
      stream.active = false;
    }
  }

  getActiveStreams() {
    return Array.from(this.streams.values()).map(s => ({
      id: s.id,
      channel: s.channel,
      active: s.active,
      uptime: Date.now() - s.startTime,
      messageCount: s.messageCount
    }));
  }

  getSubscribers(channel) {
    const subs = this.subscribers.get(channel);
    if (!subs) return [];

    return Array.from(subs).map(s => ({
      id: s.id,
      subscribedAt: s.subscribedAt,
      duration: Date.now() - s.subscribedAt
    }));
  }

  async *streamFromArray(channel, items, config = {}) {
    const interval = config.interval || 1000;
    
    for (const item of items) {
      yield {
        channel,
        data: item,
        timestamp: Date.now()
      };
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  async *streamFromEventSource(channel, url) {
    const eventSource = new EventSource(url);
    
    const queue = [];
    let resolver = null;

    eventSource.onmessage = (event) => {
      const message = {
        channel,
        data: JSON.parse(event.data),
        timestamp: Date.now()
      };

      if (resolver) {
        resolver(message);
        resolver = null;
      } else {
        queue.push(message);
      }
    };

    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift();
        } else {
          yield await new Promise(resolve => {
            resolver = resolve;
          });
        }
      }
    } finally {
      eventSource.close();
    }
  }
}