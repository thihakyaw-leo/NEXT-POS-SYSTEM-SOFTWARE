import { Context, Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { users } from '@next-hr/auth-database';
import { eq } from 'drizzle-orm';
import { SignJWT, jwtVerify } from 'jose';

type Bindings = {
  AUTH_DB: D1Database;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Simple Login Endpoint
app.post('/login', async (c: Context<{ Bindings: Bindings }>) => {
  const { email, password } = await c.req.json();
  const db = drizzle(c.env.AUTH_DB);

  // For this demonstration, we'll check against a hardcoded "admin" or lookup user
  // In production, use bcrypt/argon2 to check passwordHash
  const user = await db.select().from(users).where(eq(users.email, email)).get();

  if (!user || password !== 'dummy-password') { // Placeholder password check
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const secret = new TextEncoder().encode(c.env.JWT_SECRET);
  const token = await new SignJWT({ 
    id: user.id, 
    role: user.role,
    employeeId: user.employeeId 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);

  return c.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// Token Validation Endpoint (for NextAuth)
app.post('/validate', async (c: Context<{ Bindings: Bindings }>) => {
  const { token } = await c.req.json();
  const secret = new TextEncoder().encode(c.env.JWT_SECRET);

  try {
    const { payload } = await jwtVerify(token, secret);
    return c.json({ valid: true, payload });
  } catch (e) {
    return c.json({ valid: false }, 401);
  }
});

export default app;
