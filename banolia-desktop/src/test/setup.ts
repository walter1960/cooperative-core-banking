import 'fake-indexeddb/auto';
import '@testing-library/jest-dom';

// Ensure crypto and subtle are available in Node/JSDOM environment
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = require('crypto').webcrypto;
}
