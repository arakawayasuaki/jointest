import alasql from 'alasql';
import redis from './redis';

export async function initDbFromRedis() {
  const schemas = await redis.get('app:schemas');
  if (!schemas) {
    console.warn('No schemas found in Redis. Please run /api/init first.');
    return;
  }

  const schemaList = JSON.parse(schemas);
  
  // Reset alasql Database
  alasql('DROP DATABASE IF EXISTS app_db');
  alasql('CREATE DATABASE app_db');
  alasql('USE app_db');

  for (const table of schemaList) {
      // Clear existing table if needed or just drop/create
      alasql(`DROP TABLE IF EXISTS ${table.name}`);
      alasql(`CREATE TABLE ${table.name}`);
      
      const dataJson = await redis.get(`app:data:${table.name}`);
      if (dataJson) {
          const data = JSON.parse(dataJson);
          if (data.length > 0) {
              alasql(`INSERT INTO ${table.name} SELECT * FROM ?`, [data]);
          }
      }
  }
}

export function executeSql(sql: string) {
    try {
        alasql('USE app_db');
        return alasql(sql);
    } catch (e: any) {
        throw new Error(`SQL Execution Error: ${e.message}`);
    }
}
