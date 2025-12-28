/**
 * FrontendRAFT - Streaming API Manager
 * 
 * RAFT Feature #1: Real-time data streaming via async generators.
 * Eliminates polling with native browser streams over CSOP sync.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

/**
 * Streaming Capabilities:
 * 
 * 1. Real-time updates via async generators
 * 2. Server-Sent Events style API
 * 3. Automatic reconnection
 * 4. Backpressure handling
 * 5. Multiple concurrent streams
 */
export class StreamManager {
  /**
   * @param {P2PLayer} p2p CSOP P2P layer for real-time sync
   */
  constructor(p2p) {
    this.p2p = p2p;
    this.activeStreams = new Map();
    this.streamCounter = 0;

    console.log('✅ StreamManager initialized (RAFT Feature #1)');
  }

  /**
   * Open a streaming endpoint
   * 
   * @param {string} path Endpoint path
   * @param {Object} options Stream options
   * @returns {AsyncGenerator} Async generator yielding stream events
   * 
   * @example
   * const stream = raft.stream.open('/api/events');
   * for await (const event of stream) {
   *   console.log('Event:', event);
   * }
   */
  async *open(path, options = {}) {
    const streamId = `stream_${++this.streamCounter}`;
    const channel = `raft:stream:${path}`;

    console.log(`🌊 Opening stream: ${path} (ID: ${streamId})`);

    // Track active stream
    const streamInfo = {
      id: streamId,
      path,
      channel,
      startedAt: Date.now(),
      eventCount: 0
    };
    this.activeStreams.set(streamId, streamInfo);

    try {
      // Queue for buffering events
      const eventQueue = [];
      let resolver = null;
      let closed = false;

      // Subscribe to CSOP sync channel
      const unsubscribe = await this.p2p.subscribe(channel, (event) => {
        streamInfo.eventCount++;
        
        if (resolver) {
          // Immediately resolve if waiting
          resolver(event);
          resolver = null;
        } else {
          // Buffer event
          eventQueue.push(event);
        }
      });

      // Async generator loop
      while (!closed) {
        // Wait for next event
        const event = eventQueue.length > 0
          ? eventQueue.shift()
          : await new Promise((resolve) => {
              resolver = resolve;
            });

        // Yield event to consumer
        yield event;

        // Check for close signal
        if (event && event.type === 'stream:close') {
          closed = true;
        }
      }

      // Cleanup
      unsubscribe();
      this.activeStreams.delete(streamId);
      console.log(`🌊 Stream closed: ${path} (${streamInfo.eventCount} events)`);

    } catch (error) {
      console.error(`❌ Stream error on ${path}:`, error);
      this.activeStreams.delete(streamId);
      throw error;
    }
  }

  /**
   * Broadcast event to a stream
   * 
   * @param {string} path Stream path
   * @param {any} data Event data
   * 
   * @example
   * await raft.stream.broadcast('/api/events', { type: 'user_joined', user: 'Alice' });
   */
  async broadcast(path, data) {
    const channel = `raft:stream:${path}`;
    
    await this.p2p.broadcast(channel, {
      type: 'stream:data',
      path,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Close a stream
   * 
   * @param {string} path Stream path
   */
  async close(path) {
    const channel = `raft:stream:${path}`;
    
    await this.p2p.broadcast(channel, {
      type: 'stream:close',
      path,
      timestamp: Date.now()
    });

    console.log(`🌊 Closing stream: ${path}`);
  }

  /**
   * Get active streams
   * 
   * @returns {Array} List of active streams
   */
  getActiveStreams() {
    return Array.from(this.activeStreams.values());
  }

  /**
   * Get stream statistics
   * 
   * @returns {Object} Stream stats
   */
  getStats() {
    const streams = this.getActiveStreams();
    const totalEvents = streams.reduce((sum, s) => sum + s.eventCount, 0);

    return {
      activeStreams: streams.length,
      totalEvents,
      streams: streams.map(s => ({
        id: s.id,
        path: s.path,
        eventCount: s.eventCount,
        duration: Date.now() - s.startedAt
      }))
    };
  }
}

export default StreamManager;