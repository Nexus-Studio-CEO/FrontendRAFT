/**
 * FrontendRAFT - P2P Layer
 * 
 * WebRTC peer-to-peer communication for decentralized API calls
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

class P2PLayer {
    constructor() {
        this.peers = new Map();
        this.connections = new Map();
        this.peerId = this._generatePeerId();
        this.messageHandlers = new Map();
        this.stats = {
            sent: 0,
            received: 0,
            activePeers: 0
        };
    }

    /**
     * Generate unique peer ID
     */
    _generatePeerId() {
        return 'peer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Initialize P2P connection
     * @param {string} signalServer - Signaling server URL (for production)
     */
    async init(signalServer = null) {
        Logger.info(`P2PLayer: Initialized with peer ID: ${this.peerId}`);
        
        // In production, connect to signaling server
        if (signalServer) {
            await this._connectSignaling(signalServer);
        }
        
        return this.peerId;
    }

    /**
     * Create peer connection
     * @param {string} remotePeerId - Remote peer ID
     * @returns {RTCPeerConnection} WebRTC connection
     */
    async createConnection(remotePeerId) {
        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };
        
        const pc = new RTCPeerConnection(config);
        const dataChannel = pc.createDataChannel('raft-channel');
        
        // Setup data channel handlers
        dataChannel.onopen = () => {
            Logger.info(`P2PLayer: Data channel opened with ${remotePeerId}`);
            this.stats.activePeers++;
        };
        
        dataChannel.onclose = () => {
            Logger.info(`P2PLayer: Data channel closed with ${remotePeerId}`);
            this.stats.activePeers--;
        };
        
        dataChannel.onmessage = (event) => {
            this._handleMessage(remotePeerId, event.data);
        };
        
        // Store connection
        this.connections.set(remotePeerId, {
            pc,
            dataChannel,
            connected: false
        });
        
        return pc;
    }

    /**
     * Send message to peer
     * @param {string} peerId - Target peer ID
     * @param {object} message - Message object
     */
    async send(peerId, message) {
        const connection = this.connections.get(peerId);
        
        if (!connection || !connection.dataChannel || connection.dataChannel.readyState !== 'open') {
            Logger.warn(`P2PLayer: Cannot send to ${peerId} - not connected`);
            throw new Error('Peer not connected');
        }
        
        const payload = JSON.stringify(message);
        connection.dataChannel.send(payload);
        
        this.stats.sent++;
        Logger.info(`P2PLayer: Sent message to ${peerId}`);
    }

    /**
     * Broadcast message to all connected peers
     * @param {object} message - Message to broadcast
     */
    async broadcast(message) {
        const promises = [];
        
        for (const [peerId, connection] of this.connections) {
            if (connection.connected) {
                promises.push(this.send(peerId, message).catch(e => {
                    Logger.warn(`P2PLayer: Broadcast failed to ${peerId}: ${e.message}`);
                }));
            }
        }
        
        await Promise.allSettled(promises);
        Logger.info(`P2PLayer: Broadcasted to ${promises.length} peers`);
    }

    /**
     * Handle incoming message
     */
    _handleMessage(peerId, data) {
        try {
            const message = JSON.parse(data);
            this.stats.received++;
            
            Logger.info(`P2PLayer: Received message from ${peerId}: ${message.type}`);
            
            // Call registered handlers
            const handler = this.messageHandlers.get(message.type);
            if (handler) {
                handler(message.payload, peerId);
            } else {
                Logger.warn(`P2PLayer: No handler for message type: ${message.type}`);
            }
            
        } catch (error) {
            Logger.error(`P2PLayer: Failed to handle message: ${error.message}`);
        }
    }

    /**
     * Register message handler
     * @param {string} messageType - Type of message
     * @param {function} handler - Handler function
     */
    on(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
        Logger.info(`P2PLayer: Registered handler for "${messageType}"`);
    }

    /**
     * Remove message handler
     */
    off(messageType) {
        this.messageHandlers.delete(messageType);
    }

    /**
     * Disconnect from peer
     */
    disconnect(peerId) {
        const connection = this.connections.get(peerId);
        if (!connection) return;
        
        if (connection.dataChannel) {
            connection.dataChannel.close();
        }
        
        if (connection.pc) {
            connection.pc.close();
        }
        
        this.connections.delete(peerId);
        Logger.info(`P2PLayer: Disconnected from ${peerId}`);
    }

    /**
     * Disconnect from all peers
     */
    disconnectAll() {
        for (const peerId of this.connections.keys()) {
            this.disconnect(peerId);
        }
        Logger.info('P2PLayer: Disconnected from all peers');
    }

    /**
     * Get connected peers list
     */
    getConnectedPeers() {
        const peers = [];
        for (const [peerId, connection] of this.connections) {
            if (connection.connected) {
                peers.push(peerId);
            }
        }
        return peers;
    }

    /**
     * Check if peer is connected
     */
    isConnected(peerId) {
        const connection = this.connections.get(peerId);
        return connection?.connected || false;
    }

    /**
     * Get P2P statistics
     */
    getStats() {
        return {
            ...this.stats,
            peerId: this.peerId,
            totalConnections: this.connections.size
        };
    }

    /**
     * Simulate P2P for local testing (fallback when WebRTC unavailable)
     */
    enableLocalSimulation() {
        Logger.info('P2PLayer: Local simulation mode enabled');
        
        this._simulationMode = true;
        this._simulationPeers = new Map();
    }

    /**
     * Connect to signaling server (for production P2P discovery)
     */
    async _connectSignaling(serverUrl) {
        // Placeholder for production signaling server connection
        Logger.info(`P2PLayer: Connecting to signaling server: ${serverUrl}`);
        
        // In production, this would establish WebSocket connection
        // to signaling server for peer discovery and SDP exchange
    }

    /**
     * Create offer for connection
     */
    async createOffer(remotePeerId) {
        const pc = await this.createConnection(remotePeerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        Logger.info(`P2PLayer: Created offer for ${remotePeerId}`);
        return offer;
    }

    /**
     * Handle offer from remote peer
     */
    async handleOffer(remotePeerId, offer) {
        const pc = await this.createConnection(remotePeerId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        Logger.info(`P2PLayer: Created answer for ${remotePeerId}`);
        return answer;
    }

    /**
     * Handle answer from remote peer
     */
    async handleAnswer(remotePeerId, answer) {
        const connection = this.connections.get(remotePeerId);
        if (!connection) {
            throw new Error('Connection not found');
        }
        
        await connection.pc.setRemoteDescription(new RTCSessionDescription(answer));
        connection.connected = true;
        
        Logger.info(`P2PLayer: Connection established with ${remotePeerId}`);
    }
}

// Global instance
window.P2PLayer = new P2PLayer();