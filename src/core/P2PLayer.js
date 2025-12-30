/**
 * FrontendRAFT - P2P Communication Layer
 * 
 * WebRTC peer-to-peer communication (inspired by CSOP sync)
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

export class P2PLayer {
  constructor(config = {}) {
    this.peers = new Map();
    this.dataChannels = new Map();
    this.iceServers = config.iceServers || [
      { urls: 'stun:stun.l.google.com:19302' }
    ];
    this.messageHandlers = new Map();
    this.connectionCount = 0;
  }

  async createPeer(peerId) {
    const config = {
      iceServers: this.iceServers
    };

    const peerConnection = new RTCPeerConnection(config);
    this.connectionCount++;

    const peer = {
      id: peerId,
      connection: peerConnection,
      status: 'connecting',
      createdAt: Date.now(),
      dataChannel: null
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this._handleICECandidate(peerId, event.candidate);
      }
    };

    peerConnection.onconnectionstatechange = () => {
      peer.status = peerConnection.connectionState;
      
      if (peerConnection.connectionState === 'connected') {
        peer.connectedAt = Date.now();
      } else if (peerConnection.connectionState === 'failed' || 
                 peerConnection.connectionState === 'closed') {
        this.peers.delete(peerId);
        this.dataChannels.delete(peerId);
      }
    };

    this.peers.set(peerId, peer);

    return peer;
  }

  async createDataChannel(peerId, label = 'raft-channel') {
    const peer = this.peers.get(peerId);
    
    if (!peer) {
      throw new Error(`Peer not found: ${peerId}`);
    }

    const dataChannel = peer.connection.createDataChannel(label);
    
    dataChannel.onopen = () => {
      peer.dataChannel = dataChannel;
      this.dataChannels.set(peerId, dataChannel);
    };

    dataChannel.onmessage = (event) => {
      this._handleMessage(peerId, event.data);
    };

    dataChannel.onerror = (error) => {
      console.error(`Data channel error for ${peerId}:`, error);
    };

    dataChannel.onclose = () => {
      this.dataChannels.delete(peerId);
    };

    return dataChannel;
  }

  async createOffer(peerId) {
    const peer = this.peers.get(peerId);
    
    if (!peer) {
      throw new Error(`Peer not found: ${peerId}`);
    }

    const offer = await peer.connection.createOffer();
    await peer.connection.setLocalDescription(offer);

    return offer;
  }

  async createAnswer(peerId, offer) {
    const peer = this.peers.get(peerId);
    
    if (!peer) {
      throw new Error(`Peer not found: ${peerId}`);
    }

    await peer.connection.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await peer.connection.createAnswer();
    await peer.connection.setLocalDescription(answer);

    return answer;
  }

  async setRemoteDescription(peerId, description) {
    const peer = this.peers.get(peerId);
    
    if (!peer) {
      throw new Error(`Peer not found: ${peerId}`);
    }

    await peer.connection.setRemoteDescription(new RTCSessionDescription(description));
  }

  async addICECandidate(peerId, candidate) {
    const peer = this.peers.get(peerId);
    
    if (!peer) {
      throw new Error(`Peer not found: ${peerId}`);
    }

    await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  send(peerId, message) {
    const dataChannel = this.dataChannels.get(peerId);
    
    if (!dataChannel) {
      throw new Error(`No data channel for peer: ${peerId}`);
    }

    if (dataChannel.readyState !== 'open') {
      throw new Error(`Data channel not open for peer: ${peerId}`);
    }

    const payload = JSON.stringify({
      type: 'message',
      data: message,
      timestamp: Date.now()
    });

    dataChannel.send(payload);
  }

  broadcast(message, excludePeers = []) {
    let sent = 0;
    let failed = 0;

    for (const [peerId, dataChannel] of this.dataChannels.entries()) {
      if (excludePeers.includes(peerId)) continue;

      try {
        this.send(peerId, message);
        sent++;
      } catch (error) {
        failed++;
      }
    }

    return { sent, failed };
  }

  on(event, handler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());
    }
    this.messageHandlers.get(event).add(handler);
  }

  off(event, handler) {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  _handleMessage(peerId, rawData) {
    try {
      const message = JSON.parse(rawData);
      
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        for (const handler of handlers) {
          handler({ peerId, ...message });
        }
      }

      const allHandlers = this.messageHandlers.get('*');
      if (allHandlers) {
        for (const handler of allHandlers) {
          handler({ peerId, ...message });
        }
      }
    } catch (error) {
      console.error('Failed to parse P2P message:', error);
    }
  }

  _handleICECandidate(peerId, candidate) {
    const handlers = this.messageHandlers.get('ice-candidate');
    if (handlers) {
      for (const handler of handlers) {
        handler({ peerId, candidate });
      }
    }
  }

  closePeer(peerId) {
    const peer = this.peers.get(peerId);
    
    if (peer) {
      if (peer.dataChannel) {
        peer.dataChannel.close();
      }
      peer.connection.close();
      this.peers.delete(peerId);
      this.dataChannels.delete(peerId);
    }
  }

  closeAll() {
    for (const peerId of this.peers.keys()) {
      this.closePeer(peerId);
    }
  }

  getStats() {
    return {
      totalPeers: this.peers.size,
      connectedPeers: Array.from(this.peers.values()).filter(p => p.status === 'connected').length,
      activeChannels: this.dataChannels.size,
      totalConnections: this.connectionCount,
      peers: Array.from(this.peers.values()).map(p => ({
        id: p.id,
        status: p.status,
        uptime: p.connectedAt ? Date.now() - p.connectedAt : null
      }))
    };
  }
}