import OpenAI from 'openai';
import { initDbFromRedis, executeSql } from '../utils/db';
import redis from '../utils/redis';

// Initialize OpenAI conditionally
const openAiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (openAiKey) {
  openai = new OpenAI({ apiKey: openAiKey });
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { prompt } = body;

  if (!prompt) {
    throw createError({ statusCode: 400, statusMessage: 'Prompt is required' });
  }

  // Sync Redis to Alasql
  await initDbFromRedis();

  const schemasRaw = await redis.get('app:schemas');
  const schemas = schemasRaw ? JSON.parse(schemasRaw) : [];
  
  // Construct Schema Description for LLM
  let schemaDesc = "Database Schema via Alasql (SQL compatible):\n";
  for (const s of schemas) {
      schemaDesc += `- Table '${s.name}' columns: ${s.columns.join(', ')}\n`;
  }
  
  let sql = "";
  
  // --- MOCK OR REAL LLM ---
  if (openai) {
      try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // or similar
            messages: [
                { role: "system", content: `You are a helper that translates natural language to SQL for a specific schema. 
                
${schemaDesc}

Rules:
1. Return ONLY the SQL query. No markdown, no explanations.
2. The user might ask things like "A店で..." (Store A). You need to join 'stores' and 'print_logs' or filter accordingly.
3. Dates are stored as strings 'YYYY-MM-DD'.
4. Do not output markdown code blocks. Just the raw SQL string.
5. IMPORTANT: The column 'count' MUST be escaped as '[count]' (brackets) because it is a reserved keyword in Alasql.` },
                { role: "user", content: prompt }
            ]
        });
        sql = response.choices[0]?.message?.content?.trim() || "";
        // Clean up markdown just in case
        sql = sql.replace(/```sql/g, '').replace(/```/g, '').trim();
      } catch (e: any) {
         console.error("OpenAI Error:", e);
         throw createError({ statusCode: 500, statusMessage: 'LLM Generation Failed' });
      }
  } else {
      // Fallback Heuristic for Demo without API Key
      console.log("No OpenAI Key found, using simple heuristic for demo.");
      
      // Heuristic for "A店で2026年1月に撮影した画像で、XXサイズでプリントして出荷した総数を出して"
      if (prompt.includes('A店') && prompt.includes('2026年1月') && prompt.includes('XXサイズ') && prompt.includes('総数')) {
          sql = `
            SELECT SUM([count]) as total_count FROM print_logs 
            WHERE store_id = (SELECT id FROM stores WHERE name = 'A店') 
            AND taken_date LIKE '2026-01%' 
            AND size = 'XX'
          `;
      } else {
           // Default fallback or error
           sql = "SELECT * FROM print_logs LIMIT 5"; 
      }
  }

  console.log("Generated SQL:", sql);

  try {
      const result = executeSql(sql);
      return {
          sql,
          result
      };
  } catch (e: any) {
      return {
          sql,
          error: e.message,
          result: []
      }
  }
});
