import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { employees } from '@next-hr/database';
import { eq } from 'drizzle-orm';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => {
  return c.text('NEXT HR API Worker Running');
});

// GET /employees
app.get('/employees', async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(employees).all();
  return c.json(result);
});

// POST /employees
app.post('/employees', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  
  // Basic Validation for Owner/Product Tier
  if (body.role === 'owner' && !body.productTier) {
    return c.json({ error: 'Product Tier is required for Owner role' }, 400);
  }

  try {
    const result = await db.insert(employees).values({
      id: crypto.randomUUID(),
      ...body,
      hireDate: body.hireDate ? new Date(body.hireDate) : new Date(),
    }).returning().get();
    
    return c.json(result, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;
