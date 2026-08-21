import { describe, it, expect } from 'vitest';
import { CryptoService } from '../CryptoService';

describe('CryptoService Unit Tests', () => {
  it('should compute deterministic SHA-256 hash digests', async () => {
    const hash1 = await CryptoService.hashSha256('COOPEC_BANOLIA_TEST');
    const hash2 = await CryptoService.hashSha256('COOPEC_BANOLIA_TEST');
    const hash3 = await CryptoService.hashSha256('COOPEC_BANOLIA_OTHER');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(64);
  });

  it('should generate HMAC-SHA256 signatures for transaction blockchain hash chaining', async () => {
    const txData = {
      txId: 'tx-001',
      receiptNumber: 'REC-20260820-0001',
      accountNumber: '25121100A020022501',
      amount: 50000,
      type: 'DEPOSIT',
      timestamp: '2026-08-20T09:00:00.000Z',
      previousTxHash: 'GENESIS_A02'
    };

    const signature1 = await CryptoService.computeTransactionHmac(txData);
    const signature2 = await CryptoService.computeTransactionHmac(txData);

    expect(signature1).toBe(signature2);
    expect(signature1).toHaveLength(64);

    // Tampering test: if any field changes, HMAC must differ
    const tamperedSignature = await CryptoService.computeTransactionHmac({
      ...txData,
      amount: 50001 // Tampered amount
    });
    expect(tamperedSignature).not.toBe(signature1);
  });

  it('should generate deterministic idempotency keys', () => {
    const key = CryptoService.generateIdempotencyKey({
      agencyCode: 'A02',
      cashierId: 'CSH-001',
      timestamp: '2026-08-20T08:00:00Z',
      accountNumber: '25121100A020022501',
      amount: 50000,
      type: 'DEPOSIT'
    });

    expect(key).toMatch(/^idemp_A02_\d+_[a-f0-9]+/);
  });

  it('should encrypt and decrypt biometric templates with AES-GCM-256', async () => {
    const originalBytes = new Uint8Array([0x46, 0x4D, 0x52, 0x00, 0x20, 0x32, 0x30, 0x00, 10, 20, 30, 40, 50]);
    const passphrase = 'TEST_PASSPHRASE_AES_GCM_2026';

    const encryptedBase64 = await CryptoService.encryptBiometricTemplate(originalBytes, passphrase);
    expect(typeof encryptedBase64).toBe('string');
    expect(encryptedBase64.length).toBeGreaterThan(originalBytes.length);

    const decryptedBytes = await CryptoService.decryptBiometricTemplate(encryptedBase64, passphrase);
    expect(decryptedBytes).toEqual(originalBytes);
  });

  it('should fail decryption if wrong passphrase is provided', async () => {
    const originalBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const encryptedBase64 = await CryptoService.encryptBiometricTemplate(originalBytes, 'KEY_A');

    await expect(CryptoService.decryptBiometricTemplate(encryptedBase64, 'KEY_B')).rejects.toThrow();
  });

  it('should generate stable device fingerprint', () => {
    const fp1 = CryptoService.getDeviceFingerprint();
    const fp2 = CryptoService.getDeviceFingerprint();

    expect(fp1).toBe(fp2);
    expect(fp1.startsWith('DEV_')).toBe(true);
  });
});
