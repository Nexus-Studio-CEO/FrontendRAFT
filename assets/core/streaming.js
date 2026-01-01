/**
 * FrontendRAFT - Streaming Manager
 * 
 * Handles real-time data streaming using async generators and Server-Sent Events
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

class StreamManager {
    constructor() {
        this.activeStreams = new Map();
        this.streamId = 0;
    }

    /**
     * Create a new stream channel
     * @param {string} channelName - Stream identifier
     * @param {function} dataSource - Async generator or function returning data
     * @returns {object} Stream controller
     */
    createStream(channelName, dataSource) {
        const id = ++this.streamId;
        const controller = new AbortController();
        
        const stream = {
            id,
            channel: channelName,
            active: true,
            subscribers: new Set(),
            controller,
            dataSource
        };
        
        this.activeStreams.set(id, stream);
        Logger.info(`StreamManager: Created stream #${id} for channel "${channelName}"`);
        
        return {
            id,
            subscribe: (callback) => this.subscribe(id, callback),
            unsubscribe: (callback) => this.unsubscribe(id, callback),
            push: (data) => this.push(id, data),
            close: () => this.closeStream(id)
        };
    }

    /**
     * Subscribe to a stream
     * @param {number} streamId - Stream identifier
     * @param {function} callback - Function to call on new data
     */
    subscribe(streamId, callback) {
        const stream = this.activeStreams.get(streamId);
        if (!stream) {
            Logger.error(`StreamManager: Stream #${streamId} not found`);
            return;
        }
        
        stream.subscribers.add(callback);
        Logger.info(`StreamManager: Subscriber added to stream #${streamId} (total: ${stream.subscribers.size})`);
    }

    /**
     * Unsubscribe from a stream
     */
    unsubscribe(streamId, callback) {
        const stream = this.activeStreams.get(streamId);
        if (!stream) return;
        
        stream.subscribers.delete(callback);
        Logger.info(`StreamManager: Subscriber removed from stream #${streamId} (remaining: ${stream.subscribers.size})`);
    }

    /**
     * Push data to all subscribers
     */
    push(streamId, data) {
        const stream = this.activeStreams.get(streamId);
        if (!stream || !stream.active) return;
        
        stream.subscribers.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                Logger.error(`StreamManager: Error in subscriber callback: ${error.message}`);
            }
        });
    }

    /**
     * Close a stream
     */
    closeStream(streamId) {
        const stream = this.activeStreams.get(streamId);
        if (!stream) return;
        
        stream.active = false;
        stream.controller.abort();
        stream.subscribers.clear();
        this.activeStreams.delete(streamId);
        
        Logger.info(`StreamManager: Stream #${streamId} closed`);
    }

    /**
     * Create SSE-compatible stream
     * @param {string} channelName - Channel identifier
     * @returns {ReadableStream} Browser-compatible stream
     */
    createSSEStream(channelName) {
        const self = this;
        
        return new ReadableStream({
            start(controller) {
                const stream = self.createStream(channelName, null);
                
                stream.subscribe((data) => {
                    const message = `data: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(new TextEncoder().encode(message));
                });
                
                // Heartbeat every 30 seconds
                const heartbeat = setInterval(() => {
                    controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
                }, 30000);
                
                // Cleanup on close
                return () => {
                    clearInterval(heartbeat);
                    stream.close();
                };
            }
        });
    }

    /**
     * Stream array data in chunks
     */
    async *streamArray(array, chunkSize = 10) {
        for (let i = 0; i < array.length; i += chunkSize) {
            yield array.slice(i, i + chunkSize);
            await new Promise(resolve => setTimeout(resolve, 100)); // Throttle
        }
    }

    /**
     * Get active streams count
     */
    getActiveStreamsCount() {
        return this.activeStreams.size;
    }
}

// Global instance
window.StreamManager = new StreamManager();