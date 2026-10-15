import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env in project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  db: {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_NAME || 'BookChainLibrary',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '123456',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    encrypt: process.env.DB_ENCRYPT === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_for_development_mode_only_min_32_chars',
    expiresInDays: parseInt(process.env.SESSION_EXPIRES_DAYS || '7', 10),
  },
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  },
  blockchain: {
    rpcUrl:
      process.env.BLOCKCHAIN_RPC_URL ||
      (process.env.BLOCKCHAIN_CHAIN_ID === '11155111' || process.env.BLOCKCHAIN_NETWORK === 'sepolia'
        ? process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'
        : process.env.HARDHAT_RPC_URL || 'http://127.0.0.1:8545'),
    chainId: parseInt(
      process.env.BLOCKCHAIN_CHAIN_ID || (process.env.BLOCKCHAIN_NETWORK === 'sepolia' ? '11155111' : '31337'),
      10
    ),
    contractAddress: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    // In local development, Hardhat Account #0 is the default admin/registrar
    registrarPrivateKey:
      process.env.REGISTRAR_PRIVATE_KEY ||
      process.env.SEPOLIA_PRIVATE_KEY ||
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
};
