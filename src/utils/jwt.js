/**
 * FrontendRAFT - JWT Utilities
 * 
 * JSON Web Token generation and validation
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

import { Crypto } from './crypto.js';

export class JWT {
  static async sign(payload, secret, options = {}) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Date.now();
    const expiresIn = options.expiresIn || 30 * 24 * 60 * 60 * 1000;

    const body = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
      iss: 'frontendraft',
      jti: Crypto.generateUUID()
    };

    const encodedHeader = Crypto.base64Encode(JSON.stringify(header));
    const encodedPayload = Crypto.base64Encode(JSON.stringify(body));
    
    const signature = await Crypto.hash(`${encodedHeader}.${encodedPayload}.${secret}`);
    const encodedSignature = Crypto.base64Encode(signature);

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  }

  static async verify(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    const expectedSignature = await Crypto.hash(`${encodedHeader}.${encodedPayload}.${secret}`);
    const expectedEncodedSignature = Crypto.base64Encode(expectedSignature);

    const providedSignature = Crypto.base64Decode(encodedSignature);
    const expectedSignatureDecoded = Crypto.base64Decode(expectedEncodedSignature);

    if (!Crypto.constantTimeCompare(providedSignature, expectedSignatureDecoded)) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(Crypto.base64Decode(encodedPayload));

    if (payload.exp && Date.now() > payload.exp) {
      throw new Error('Token expired');
    }

    return payload;
  }

  static decode(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload] = parts;
    
    const header = JSON.parse(Crypto.base64Decode(encodedHeader));
    const payload = JSON.parse(Crypto.base64Decode(encodedPayload));

    return { header, payload };
  }

  static isExpired(token) {
    try {
      const { payload } = this.decode(token);
      return payload.exp && Date.now() > payload.exp;
    } catch (error) {
      return true;
    }
  }

  static getPayload(token) {
    try {
      const { payload } = this.decode(token);
      return payload;
    } catch (error) {
      return null;
    }
  }
}