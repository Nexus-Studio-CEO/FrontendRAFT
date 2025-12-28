/**
 * FrontendRAFT - P2P Communication Layer
 * 
 * Wrapper around CSOP sync capability.
 * Provides real-time P2P communication via Supabase.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

/**
 * P2P Layer
 * High-level wrapper for CSOP sync
 */
export class P2PLayer {
  /**
   * @param {CSOP} csop CSOP instance
   */
  constructor(csop) {
    this.csop = csop;
    this.subscriptions = new Map();

    console.log('✅ P2PLayer initialized (CSOP powered)');
  }

  /**
   * Broadcast message to channel
   * 
   * @param {string} channel Channel name
   * @param {any} data Message data
   * @returns {Promise<void>}
   * 
   * @example
   * await p2p.broadcast('chat:room1', { text: 'Hello!' });
   */
  async broadcast(channel, data) {
    try {
      await this.csop.dispatch('sync.broadcast', {
        event: channel,
        data
      });
    } catch (error) {
      console.error('P2P broadcast error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to channel
   * 
   * @param {string} channel Channel name
   * @param {Function} callback Message handler
   * @returns {Promise<Function>} Unsubscribe function
   * 
   * @example
   * const unsubscribe = await p2p.subscribe('chat:room1', (msg) => {
   *   console.log('Message:', msg);
   * });
   */
  async subscribe(channel, callback) {
    try {
      await this.csop.dispatch('sync.subscribe', {
        channel,
        callback
      });

      // Store subscription
      this.subscriptions.set(channel, callback);

      // Return unsubscribe function
      return () => this.unsubscribe(channel);
    } catch (error) {
      console.error('P2P subscribe error:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from channel
   * 
   * @param {string} channel Channel name
   * @returns {Promise<void>}
   */
  async unsubscribe(channel) {
    try {
      await this.csop.dispatch('sync.unsubscribe', {
        channel
      });

      this.subscriptions.delete(channel);
    } catch (error) {
      console.error('P2P unsubscribe error:', error);
    }
  }

  /**
   * Get presence (who's online)
   * 
   * @param {string} channel Channel name
   * @returns {Promise<Object>} Presence data
   * 
   * @example
   * const presence = await p2p.presence('workspace:main');
   * console.log(`${presence.online} users online`);
   */
  async presence(channel) {
    try {
      const result = await this.csop.dispatch('sync.presence', {
        channel
      });

      return result.data;
    } catch (error) {
      console.error('P2P presence error:', error);
      throw error;
    }
  }

  /**
   * Get active subscriptions
   * 
   * @returns {Array<string>} Channel names
   */
  getSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }
}

export default P2PLayer;