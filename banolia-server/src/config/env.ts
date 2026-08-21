import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'banolia-core-banking-jwt-secret-bceao-2026',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',
  DB_PATH: process.env.DB_PATH || './banolia.db',
  DEFAULT_AGENCY_CODE: process.env.DEFAULT_AGENCY_CODE || 'A01',
  DEFAULT_AGENCY_NAME: process.env.DEFAULT_AGENCY_NAME || 'Siège Principal Lomé'
};
