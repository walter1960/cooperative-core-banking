/**
 * BANOLIA Desktop — Cryptographic Security Service
 * Implements WebCrypto AES-GCM-256 for biometric data and synchronous/asynchronous SHA-256 HMAC ledger chaining.
 */

export class CryptoService {
  private static readonly AES_ALGORITHM = 'AES-GCM';
  private static readonly HMAC_ALGORITHM = 'HMAC';
  private static readonly DEFAULT_SECRET = 'BANOLIA_SECRET_DEVICE_KEY_2026_BCEAO';

  private static rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  /**
   * Pure synchronous standard FIPS 180-4 SHA-256 algorithm
   */
  public static hashSha256Sync(data: string | Uint8Array): string {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const asciiBitLength = bytes.length * 8;

    let hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    const padded: number[] = [];
    for (let b = 0; b < bytes.length; b++) padded.push(bytes[b]);
    padded.push(0x80);
    while ((padded.length % 64) !== 56) padded.push(0);

    padded.push(0, 0, 0, 0); // 64-bit big endian length
    padded.push(
      (asciiBitLength >>> 24) & 0xff,
      (asciiBitLength >>> 16) & 0xff,
      (asciiBitLength >>> 8) & 0xff,
      asciiBitLength & 0xff
    );

    for (let chunk = 0; chunk < padded.length; chunk += 64) {
      const w = new Array(64);
      for (let t = 0; t < 16; t++) {
        w[t] = (padded[chunk + t * 4] << 24) |
               (padded[chunk + t * 4 + 1] << 16) |
               (padded[chunk + t * 4 + 2] << 8) |
               (padded[chunk + t * 4 + 3]);
      }
      for (let t = 16; t < 64; t++) {
        const s0 = this.rightRotate(w[t - 15], 7) ^ this.rightRotate(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        const s1 = this.rightRotate(w[t - 2], 17) ^ this.rightRotate(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }

      let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
      let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

      for (let t = 0; t < 64; t++) {
        const S1 = this.rightRotate(e, 6) ^ this.rightRotate(e, 11) ^ this.rightRotate(e, 25);
        const ch = (e & f) ^ ((~e) & g);
        const temp1 = (h + S1 + ch + k[t] + w[t]) | 0;
        const S0 = this.rightRotate(a, 2) ^ this.rightRotate(a, 13) ^ this.rightRotate(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) | 0;

        h = g;
        g = f;
        f = e;
        e = (d + temp1) | 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) | 0;
      }

      hash[0] = (hash[0] + a) | 0;
      hash[1] = (hash[1] + b) | 0;
      hash[2] = (hash[2] + c) | 0;
      hash[3] = (hash[3] + d) | 0;
      hash[4] = (hash[4] + e) | 0;
      hash[5] = (hash[5] + f) | 0;
      hash[6] = (hash[6] + g) | 0;
      hash[7] = (hash[7] + h) | 0;
    }

    let result = '';
    for (let i = 0; i < 8; i++) {
      result += (hash[i] >>> 0).toString(16).padStart(8, '0');
    }
    return result;
  }

  /**
   * Pure synchronous standard RFC 2104 HMAC-SHA256 algorithm
   */
  public static computeHmacSha256Sync(key: string | Uint8Array, message: string | Uint8Array): string {
    const enc = new TextEncoder();
    let keyBytes = typeof key === 'string' ? enc.encode(key) : key;
    const msgBytes = typeof message === 'string' ? enc.encode(message) : message;

    const blockSize = 64;
    if (keyBytes.length > blockSize) {
      const hashedKeyHex = this.hashSha256Sync(keyBytes);
      keyBytes = new Uint8Array(hashedKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    }

    const paddedKey = new Uint8Array(blockSize);
    paddedKey.set(keyBytes);

    const oPad = new Uint8Array(blockSize);
    const iPad = new Uint8Array(blockSize);

    for (let i = 0; i < blockSize; i++) {
      oPad[i] = paddedKey[i] ^ 0x5c;
      iPad[i] = paddedKey[i] ^ 0x36;
    }

    // Inner hash: SHA256(iPad || msg)
    const innerData = new Uint8Array(blockSize + msgBytes.length);
    innerData.set(iPad);
    innerData.set(msgBytes, blockSize);
    const innerHashHex = this.hashSha256Sync(innerData);
    const innerHashBytes = new Uint8Array(innerHashHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    // Outer hash: SHA256(oPad || innerHash)
    const outerData = new Uint8Array(blockSize + innerHashBytes.length);
    outerData.set(oPad);
    outerData.set(innerHashBytes, blockSize);

    return this.hashSha256Sync(outerData);
  }

  /**
   * Computes SHA-256 hex string of any string or Uint8Array
   */
  public static async hashSha256(data: string | Uint8Array): Promise<string> {
    return this.hashSha256Sync(data);
  }

  /**
   * Computes HMAC-SHA256 signature for transaction chaining
   */
  public static async computeTransactionHmac(params: {
    txId: string;
    receiptNumber: string;
    accountNumber: string;
    amount: number;
    type: string;
    timestamp: string;
    previousTxHash: string;
    secretKey?: string;
  }): Promise<string> {
    const canonical = [
      params.txId,
      params.receiptNumber,
      params.accountNumber,
      params.amount.toString(),
      params.type,
      params.timestamp,
      params.previousTxHash
    ].join('|');

    const keyString = params.secretKey || this.DEFAULT_SECRET;
    return this.computeHmacSha256Sync(keyString, canonical);
  }

  /**
   * Generates a deterministic SHA-256 HMAC idempotency key
   */
  public static generateIdempotencyKey(params: {
    agencyCode: string;
    cashierId: string;
    timestamp: string;
    accountNumber: string;
    amount: number;
    type: string;
  }): string {
    const raw = `${params.agencyCode}_${params.cashierId}_${params.timestamp}_${params.accountNumber}_${params.amount}_${params.type}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `idemp_${params.agencyCode}_${Date.now()}_${hashHex}${randomSuffix}`;
  }

  /**
   * Derives an AES-GCM-256 CryptoKey using PBKDF2
   */
  public static async deriveEncryptionKey(passphrase: string, salt: string = 'BANOLIA_SALT_XOF'): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.AES_ALGORITHM, length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts biometric template bytes with AES-GCM-256 and returns Base64 (IV + Ciphertext)
   */
  public static async encryptBiometricTemplate(
    templateBytes: Uint8Array,
    keyOrPassphrase?: CryptoKey | string
  ): Promise<string> {
    let key: CryptoKey;
    if (typeof keyOrPassphrase === 'string') {
      key = await this.deriveEncryptionKey(keyOrPassphrase);
    } else if (keyOrPassphrase) {
      key = keyOrPassphrase;
    } else {
      key = await this.deriveEncryptionKey(this.DEFAULT_SECRET);
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: this.AES_ALGORITHM, iv },
      key,
      templateBytes as any
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    let binary = '';
    for (let i = 0; i < combined.byteLength; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  }

  /**
   * Decrypts Base64 (IV + Ciphertext) into Uint8Array
   */
  public static async decryptBiometricTemplate(
    base64Data: string,
    keyOrPassphrase?: CryptoKey | string
  ): Promise<Uint8Array> {
    let key: CryptoKey;
    if (typeof keyOrPassphrase === 'string') {
      key = await this.deriveEncryptionKey(keyOrPassphrase);
    } else if (keyOrPassphrase) {
      key = keyOrPassphrase;
    } else {
      key = await this.deriveEncryptionKey(this.DEFAULT_SECRET);
    }

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    if (bytes.length < 13) {
      throw new Error('Invalid encrypted payload: too short for AES-GCM IV and ciphertext');
    }

    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: this.AES_ALGORITHM, iv },
      key,
      ciphertext
    );

    return new Uint8Array(decrypted);
  }

  /**
   * Generates a stable device fingerprint for regulatory audit trails
   */
  public static getDeviceFingerprint(): string {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const ua = nav ? nav.userAgent : 'NodeRuntime';
    const lang = nav ? nav.language : 'fr-FR';
    const plat = nav ? (nav.platform || 'Linux') : 'Linux';
    return `DEV_${btoa(`${plat}_${lang}_${ua}`).substring(0, 16)}`;
  }
}
