import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@next-hr/database';

export const db = drizzle(process.env.DB as unknown as D1Database, { schema });
export { schema };
