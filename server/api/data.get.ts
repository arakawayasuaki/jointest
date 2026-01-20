import redis from '../utils/redis';

export default defineEventHandler(async (event) => {
  const schemasRaw = await redis.get('app:schemas');
  const schemas = schemasRaw ? JSON.parse(schemasRaw) : [];

  const data: Record<string, any[]> = {};

  for (const table of schemas) {
      const rowsRaw = await redis.get(`app:data:${table.name}`);
      data[table.name] = rowsRaw ? JSON.parse(rowsRaw) : [];
  }

  return {
      schemas,
      data
  };
});
