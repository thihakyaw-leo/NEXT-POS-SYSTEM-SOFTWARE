import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { employees, payroll, damageReports } from '@next-hr/database';
import { eq, and } from 'drizzle-orm';
import { jwt } from 'hono/jwt';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// 🛡️ JWT Middleware (requires the same secret as auth-api)
app.use('/auth/*', (c, next) => {
  return jwt({ secret: c.env.JWT_SECRET })(c, next);
});

app.get('/', (c) => {
  return c.text('NEXT HR API Worker Running');
});

// GET /auth/employees
app.get('/auth/employees', async (c) => {
  const db = drizzle(c.env.DB);
  const branchId = c.req.query('branchId');
  
  let query = db.select().from(employees);
  if (branchId) {
    // @ts-ignore - branchId exists in schema
    query = query.where(eq(employees.branchId, branchId));
  }
  
  const result = await query.all();
  return c.json(result);
});

// POST /auth/payroll/calculate
app.post('/auth/payroll/calculate', async (c) => {
  const db = drizzle(c.env.DB);
  const { branchId, month, year } = await c.req.json();
  const ATTENDANCE_RATE = 0.9;
  const totalWorkingDays = 26;

  const activeEmployees = await db.select().from(employees).where(
    and(
      eq(employees.branchId, branchId),
      eq(employees.status, 'active')
    )
  ).all();

  const results = activeEmployees.map(employee => {
    const daysPresent = Math.floor(totalWorkingDays * ATTENDANCE_RATE);
    const grossWage = Math.floor((employee.baseSalary / totalWorkingDays) * daysPresent);
    const maxDamageDeduction = Math.floor(grossWage * 0.20);
    const actualDamageDeduction = Math.min(employee.damageBalance || 0, maxDamageDeduction);
    const remainingDamageBalance = (employee.damageBalance || 0) - actualDamageDeduction;

    return {
      employeeId: employee.id,
      month, year,
      baseSalary: employee.baseSalary,
      daysPresent, totalWorkingDays,
      grossWage,
      damageDeduction: actualDamageDeduction,
      taxDeduction: 0,
      ssDeduction: 0,
      netWage: grossWage - actualDamageDeduction,
      remainingDamageBalance,
      status: 'pending',
    };
  });

  return c.json(results);
});

// POST /auth/payroll/approve
app.post('/auth/payroll/approve', async (c) => {
  const db = drizzle(c.env.DB);
  const payrollData = await c.req.json();

  try {
    // Note: D1 transactions are handled differently depending on the driver
    // For this implementation, we map individual updates
    for (const data of payrollData) {
      await db.insert(payroll).values({
        id: crypto.randomUUID(),
        ...data,
      }).run();

      await db.update(employees)
        .set({ damageBalance: data.remainingDamageBalance })
        .where(eq(employees.id, data.employeeId))
        .run();
    }
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;
