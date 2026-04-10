import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@next-hr/database';

// Safely initialize DB only if the binding is available (prevents build-time crashes)
export const db = process.env.DB 
  ? drizzle(process.env.DB as unknown as D1Database, { schema })
  : null as any;

export { schema };
