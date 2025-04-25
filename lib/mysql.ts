import { createPool, Pool } from "mysql2/promise";

let globalPool: Pool | undefined;

function getPool(): Pool {
  if (!globalPool) {
    globalPool = createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      connectionLimit: 10, // 동시 연결 제한
      waitForConnections: true, // 연결 대기 허용
      queueLimit: 0, // 무제한 큐 (0은 무제한)
    });
  }
  return globalPool;
}

export default getPool();
