import sql from 'mssql';
import { config } from '../config/env.js';

let pool: sql.ConnectionPool | null = null;
let connectingPromise: Promise<sql.ConnectionPool> | null = null;

export const sqlConfig: sql.config = {
  user: config.db.user,
  password: config.db.password,
  server: config.db.server,
  port: config.db.port,
  database: config.db.database,
  options: {
    encrypt: config.db.encrypt,
    trustServerCertificate: config.db.trustServerCertificate,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    try {
      const newPool = new sql.ConnectionPool(sqlConfig);
      await newPool.connect();
      pool = newPool;
      return pool;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
}

export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latencyMs: number;
  database?: string;
  error?: string;
}> {
  const start = Date.now();
  try {
    const activePool = await getPool();
    const result = await activePool.request().query('SELECT DB_NAME() as dbName, 1 as isAlive');
    const latencyMs = Date.now() - start;
    const dbName = result.recordset[0]?.dbName || config.db.database;
    return {
      connected: true,
      latencyMs,
      database: dbName,
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: err.message || 'Database connection error',
    };
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

export { sql };
