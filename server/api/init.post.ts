import redis from '../utils/redis';

export default defineEventHandler(async (event) => {
  // Define Schemas
  const schemas = [
    { name: 'stores', columns: ['id', 'name'] },
    { name: 'print_logs', columns: ['id', 'store_id', 'date', 'taken_date', 'size', 'count', 'image_url'] }
  ];

  // Mock Data
  const stores = [
    { id: 1, name: 'A店' },
    { id: 2, name: 'B店' },
    { id: 3, name: 'C店' }
  ];

  const printLogs = [
    // A店 (id: 1) - Jan 2026 Print
    { id: 1, store_id: 1, date: '2026-01-05', taken_date: '2026-01-01', size: 'L', count: 10, image_url: 'img1.jpg' },
    { id: 2, store_id: 1, date: '2026-01-10', taken_date: '2026-01-02', size: '2L', count: 5, image_url: 'img2.jpg' },
    { id: 3, store_id: 1, date: '2026-01-15', taken_date: '2026-01-05', size: 'XX', count: 20, image_url: 'img3.jpg' }, // Target 1 (Taken Jan, Print Jan)
    { id: 8, store_id: 1, date: '2026-02-10', taken_date: '2026-01-25', size: 'XX', count: 30, image_url: 'img8.jpg' }, // Target 2 (Taken Jan, Print Feb) -> Total 50
    { id: 4, store_id: 1, date: '2026-01-20', taken_date: '2026-01-10', size: 'L', count: 8, image_url: 'img4.jpg' },
    
    // B店 (id: 2)
    { id: 5, store_id: 2, date: '2026-01-05', taken_date: '2026-01-01', size: 'XX', count: 15, image_url: 'img5.jpg' },
    
    // A店 - Feb 2026 Taken (Should not be selected)
    { id: 6, store_id: 1, date: '2026-02-01', taken_date: '2026-02-01', size: 'XX', count: 50, image_url: 'img6.jpg' },
    
     // A店 - Jan 2025 Taken (Should not be selected)
    { id: 7, store_id: 1, date: '2025-01-15', taken_date: '2025-01-15', size: 'XX', count: 30, image_url: 'img7.jpg' },
  ];

  // Store in Redis
  await redis.set('app:schemas', JSON.stringify(schemas));
  await redis.set('app:data:stores', JSON.stringify(stores));
  await redis.set('app:data:print_logs', JSON.stringify(printLogs));

  return { success: true, message: 'Data initialized in Redis' };
});
