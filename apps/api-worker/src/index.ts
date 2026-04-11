import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { 
  employees, payroll, damageReports, departments, positions, 
  employeeDocuments, attendanceLogs, leaveRequests, leaveBalances,
  payrollRuns, salaryComponents, employeeSalaryItems,
  jobPosts, candidates, interviews, performanceReviews, kpiTargets,
  trainingCourses, employeeTrainings, systemSettings, auditLogs, notifications,
  users
} from '@next-hr/database';
import { eq, and, like, desc, gte, inArray, count } from 'drizzle-orm';
import { jwt, sign } from 'hono/jwt';
import bcrypt from 'bcryptjs';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Browser clients (Vite dev, Cloudflare Pages) call this worker on another origin — CORS required.
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return 'http://localhost:5173';
      if (origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') return origin;
      if (origin.endsWith('.pages.dev')) return origin;
      return null;
    },
    allowMethods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// [SECURITY] Enforce JWT on all protected routes
app.use('/auth/*', async (c, next) => {
  const jwtMiddleware = jwt({ 
    secret: c.env.JWT_SECRET,
    alg: 'HS256'
  });
  return jwtMiddleware(c, next);
});

// [AUTH] Public: POST /public/login
app.post('/public/login', async (c) => {
  const db = drizzle(c.env.DB);
  const { username, password } = await c.req.json();
  
  try {
    const user = await db.select().from(users).where(eq(users.username, username)).get();
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return c.json({ error: "Invalid username or password" }, 401);
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      branchId: user.branchId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 hours
    };

    const token = await sign(payload, c.env.JWT_SECRET);
    return c.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// [AUTH] Public: POST /public/setup (First Admin Only)
app.post('/public/setup', async (c) => {
  const db = drizzle(c.env.DB);
  const { username, password } = await c.req.json();

  try {
    const userCount = await db.select({ count: count() }).from(users).get();
    if (userCount && userCount.count > 0) {
      return c.json({ error: "System already initialized" }, 403);
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const adminUser = {
      id: crypto.randomUUID(),
      username,
      password: hashedPassword,
      role: 'admin' as const
    };

    await db.insert(users).values(adminUser).run();
    return c.json({ message: "Admin account created successfully" }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// [EMAIL] Mock Helper
async function sendEmail(to: string, subject: string, body: string) {
  console.log(`[MOCK EMAIL] TO: ${to} | SUBJECT: ${subject}`);
  console.log(`[MOCK EMAIL] BODY: ${body}`);
  // In production, integrate with Resend API here
  return { success: true };
}

// 헬퍼: 자동 ID 생성 (EMP-YYYY-NNN)
async function generateEmployeeId(db: any) {
  const year = new Date().getFullYear();
  const lastEmp = await db.select().from(employees).orderBy(desc(employees.internalId)).get();
  let count = 1;
  if (lastEmp && lastEmp.internalId.startsWith(`EMP-${year}`)) {
    count = parseInt(lastEmp.internalId.split('-')[2]) + 1;
  }
  return `EMP-${year}-${count.toString().padStart(3, '0')}`;
}

// [ATTENDANCE] POST /auth/attendance/check-in
app.post('/auth/attendance/check-in', async (c) => {
  const db = drizzle(c.env.DB);
  const { employeeId, latitude, longitude } = await c.req.json();
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const existing = await db
      .select()
      .from(attendanceLogs)
      .where(and(eq(attendanceLogs.employeeId, employeeId), eq(attendanceLogs.date, today)))
      .get();
      
    if (existing) return c.json({ error: "Already checked in today" }, 400);

    const checkInTime = new Date();
    const isLate = checkInTime.getHours() >= 9; // Late after 9:00 AM

    const log = {
      id: crypto.randomUUID(),
      employeeId,
      date: today,
      clockIn: checkInTime,
      latitude,
      longitude,
      status: (isLate ? 'late' : 'on_time') as any,
    };

    await db.insert(attendanceLogs).values(log).run();
    return c.json(log);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// [LEAVE] POST /auth/leave/request
app.post('/auth/leave/request', async (c) => {
  const db = drizzle(c.env.DB);
  const { employeeId, type, startDate, endDate, reason, isHalfDay } = await c.req.json();

  const start = new Date(startDate);
  const end = new Date(endDate);
  const requestedDays = isHalfDay ? 0.5 : Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  try {
    const balance = await db.select().from(leaveBalances).where(
      and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.year, new Date().getFullYear()))
    ).get();

    if (!balance) return c.json({ error: "Leave balance not initialized" }, 400);

    const usedField = `used${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof balance;
    const limitField = `${type}Limit` as keyof typeof balance;
    
    if ((balance[usedField] as number) + requestedDays > (balance[limitField] as number)) {
      return c.json({ error: "Insufficient balance" }, 400);
    }

    const request = {
      id: crypto.randomUUID(),
      employeeId,
      type,
      startDate: start,
      endDate: end,
      reason,
      isHalfDay,
      status: 'pending',
      createdAt: new Date(),
    };

    await db.insert(leaveRequests).values(request as any).run();

    // Trigger Email Notification (Mock)
    await sendEmail(employeeId, "Leave Request Submitted", `Your ${type} leave request from ${startDate} to ${endDate} has been submitted for approval.`);

    return c.json(request, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// GET /auth/employees
app.get('/auth/employees', async (c) => {
  const db = drizzle(c.env.DB);
  const branchId = c.req.query('branchId');
  const departmentId = c.req.query('departmentId');
  const search = c.req.query('search');
  
  let queries = [];
  if (branchId) queries.push(eq(employees.branchId, branchId));
  if (departmentId) queries.push(eq(employees.departmentId, departmentId));
  if (search) queries.push(like(employees.name, `%${search}%`));
  
  const result = queries.length > 0 
    ? await db.select().from(employees).where(and(...queries)).all()
    : await db.select().from(employees).all();
    
  return c.json(result);
});

// POST /auth/employees
app.post('/auth/employees', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const internalId = await generateEmployeeId(db);
  const newEmployee = {
    id: crypto.randomUUID(),
    internalId,
    ...body,
    hireDate: body.hireDate ? new Date(body.hireDate) : new Date(),
  };
  await db.insert(employees).values(newEmployee).run();
  return c.json(newEmployee, 201);
});

// GET /auth/departments
app.get('/auth/departments', async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(departments).all();
  return c.json(result);
});

// PATCH /auth/departments/:id
app.patch('/auth/departments/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const { parentId, name } = await c.req.json();
  await db.update(departments).set({ parentId, name }).where(eq(departments.id, id)).run();
  return c.json({ success: true });
});

// [PAYROLL] POST /auth/payroll/process (Integrated Calculation)
app.post('/auth/payroll/process', async (c) => {
  const db = drizzle(c.env.DB);
  const { month, year, scope, branchId, managerId } = await c.req.json();
  
  // 1. Fetch Global/Branch SSB Settings
  const ssbSetting = await db.select().from(systemSettings)
    .where(and(
      eq(systemSettings.key, 'max_ssb_cap'),
      branchId ? eq(systemSettings.branchId, branchId) : eq(systemSettings.branchId, null as any)
    )).get();
  const maxSsbCap = ssbSetting ? parseInt(ssbSetting.value) : 6000;

  // 2. Create a new Payroll Run Entry
  const runId = crypto.randomUUID();
  await db.insert(payrollRuns).values({
    id: runId,
    month,
    year,
    scope,
    branchId: scope === 'branch' ? branchId : null,
    status: 'draft',
    createdAt: new Date(),
  }).run();

  // 3. Fetch Employees
  let activeEmployees = [];
  if (scope === 'company') {
    activeEmployees = await db.select().from(employees).where(eq(employees.status, 'active')).all();
  } else {
    activeEmployees = await db.select().from(employees).where(
      and(eq(employees.branchId, branchId), eq(employees.status, 'active'))
    ).all();
  }

  const totalWorkingDays = 26;

  // 4. Process each employee using ACTUAL logs
  for (const employee of activeEmployees) {
    // A. Calc Days Present from attendanceLogs
    const logs = await db.select().from(attendanceLogs).where(and(
      eq(attendanceLogs.employeeId, employee.id),
      like(attendanceLogs.date, `${year}-${month.toString().padStart(2, '0')}-%`)
    )).all();
    
    const daysPresent = logs.filter(l => l.clockIn && l.clockOut).length;
    const totalOT = logs.reduce((sum, l) => sum + (l.overtimeHours || 0), 0);

    // B. Calc Approved Leaves
    const leaves = await db.select().from(leaveRequests).where(and(
      eq(leaveRequests.employeeId, employee.id),
      eq(leaveRequests.status, 'approved')
      // Note: In real app, check if leave dates fall within the target month
    )).all();
    const approvedLeaveDays = leaves.length; // Simplified for demo

    // C. Attendance Fallback Alert
    if (daysPresent === 0 && approvedLeaveDays === 0) {
       await db.insert(notifications).values({
         id: crypto.randomUUID(),
         employeeId: managerId || 'ADMIN', 
         title: 'Payroll Discrepancy Alert',
         message: `Employee ${employee.name} (${employee.internalId}) has 0 attendance logs for ${month}/${year}. Review required.`,
         type: 'warning',
         createdAt: new Date(),
       }).run();
    }

    const grossWage = Math.floor((employee.baseSalary / totalWorkingDays) * (daysPresent + approvedLeaveDays));
    
    // Damage Deduction
    const maxDamageDeduction = Math.floor(grossWage * 0.20);
    const actualDamageDeduction = Math.min(employee.damageBalance || 0, maxDamageDeduction);
    const remainingDamageBalance = (employee.damageBalance || 0) - actualDamageDeduction;

    // SSB with Dynamic Cap
    const ssDeduction = Math.min(maxSsbCap, Math.floor(grossWage * 0.02));

    const payrollEntry = {
      id: crypto.randomUUID(),
      payrollRunId: runId,
      employeeId: employee.id,
      month, year,
      baseSalary: employee.baseSalary,
      daysPresent: daysPresent + approvedLeaveDays,
      totalWorkingDays,
      grossWage,
      damageDeduction: actualDamageDeduction,
      taxDeduction: 0,
      ssDeduction,
      netWage: grossWage - actualDamageDeduction - ssDeduction,
      remainingDamageBalance,
      status: 'pending',
    };

    await db.insert(payroll).values(payrollEntry as any).run();
  }

  return c.json({ runId, processedCount: activeEmployees.length });
});

// [PAYROLL] POST /auth/payroll/approve/:id
app.post('/auth/payroll/approve/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const runId = c.req.param('id');
  
  try {
    // 1. Update Run Status
    await db.update(payrollRuns)
      .set({ status: 'paid', processedAt: new Date() })
      .where(eq(payrollRuns.id, runId))
      .run();

    // 2. Fetch all payroll entries for this run to update employee balances
    const entries = await db.select().from(payroll).where(eq(payroll.payrollRunId, runId)).all();
    
    for (const entry of entries) {
      await db.update(employees)
        .set({ damageBalance: entry.remainingDamageBalance })
        .where(eq(employees.id, entry.employeeId))
        .run();
    }

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// [PAYROLL] GET /auth/payroll/runs
app.get('/auth/payroll/runs', async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(payrollRuns).orderBy(desc(payrollRuns.createdAt)).all();
  return c.json(result);
});

// [PAYROLL] GET /auth/payroll/runs/:id (Details)
app.get('/auth/payroll/runs/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const runId = c.req.param('id');
  
  const run = await db.select().from(payrollRuns).where(eq(payrollRuns.id, runId)).get();
  const entries = await db.select().from(payroll).where(eq(payroll.payrollRunId, runId)).all();
  
  return c.json({ run, entries });
});

// [PAYROLL] GET /auth/payroll/components
app.get('/auth/payroll/components', async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(salaryComponents).all();
  return c.json(result);
});

// [PAYROLL] POST /auth/payroll/components
app.post('/auth/payroll/components', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  
  const newComponent = {
    id: crypto.randomUUID(),
    ...body
  };
  
  await db.insert(salaryComponents).values(newComponent).run();
  return c.json(newComponent, 201);
});

// [PAYROLL] GET /auth/payroll/entry/:id (Single Payslip)
app.get('/auth/payroll/entry/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  
  const entry = await db.select().from(payroll).where(eq(payroll.id, id)).get();
  if (!entry) return c.json({ error: 'Not found' }, 404);
  
  const employee = await db.select().from(employees).where(eq(employees.id, entry.employeeId)).get();
  
  return c.json({ ...entry, employee });
});

// [ATTENDANCE] POST /auth/attendance/check-out
app.post('/auth/attendance/check-out', async (c) => {
  const db = drizzle(c.env.DB);
  const { employeeId } = await c.req.json();
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const existing = await db
      .select()
      .from(attendanceLogs)
      .where(and(eq(attendanceLogs.employeeId, employeeId), eq(attendanceLogs.date, today)))
      .get();
      
    if (!existing || !existing.clockIn) return c.json({ error: "No active check-in found for today" }, 400);
    if (existing.clockOut) return c.json({ error: "Already checked out" }, 400);

    const clockOutTime = new Date();
    
    // Automatic OT Calculation
    // Shift ends at 17:30 (5:30 PM)
    const shiftEnd = new Date();
    shiftEnd.setHours(17, 30, 0, 0);
    
    let overtimeHours = 0;
    if (clockOutTime > shiftEnd) {
      const diffMs = clockOutTime.getTime() - shiftEnd.getTime();
      overtimeHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimals
    }

    await db.update(attendanceLogs)
      .set({ clockOut: clockOutTime, overtimeHours })
      .where(eq(attendanceLogs.id, existing.id))
      .run();

    return c.json({ success: true, overtimeHours });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// [LEAVE] POST /auth/leave/approve/:id
app.post('/auth/leave/approve/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const { managerId } = await c.req.json();

  try {
    const request = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).get();
    if (!request) return c.json({ error: "Request not found" }, 404);
    if (request.status !== 'pending') return c.json({ error: "Already processed" }, 400);

    // 1. Calculate Deduction
    let deduction = 0;
    if (request.isHalfDay) {
      deduction = 0.5;
    } else {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      deduction = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    // 2. Update Balance
    const balance = await db.select().from(leaveBalances).where(
      and(eq(leaveBalances.employeeId, request.employeeId), eq(leaveBalances.year, new Date().getFullYear()))
    ).get();

    if (balance) {
      const usedField = `used${request.type.charAt(0).toUpperCase() + request.type.slice(1)}` as keyof typeof balance;
      await db.update(leaveBalances)
        .set({ [usedField]: (balance[usedField] as number) + deduction })
        .where(eq(leaveBalances.id, balance.id))
        .run();
    }

    // 3. Update Status
    await db.update(leaveRequests)
      .set({ status: 'approved', approvedBy: managerId })
      .where(eq(leaveRequests.id, id))
      .run();

    // Trigger Email Notification (Mock)
    await sendEmail(request.employeeId, "Leave Approved!", `Your leave request for ${request.type} has been approved by management.`);

    return c.json({ success: true, deduction });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// GET /auth/leave/pending (For Managers)
app.get('/auth/leave/pending', async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(leaveRequests).where(eq(leaveRequests.status, 'pending')).all();
  return c.json(result);
});

// [RECRUITMENT] PUBLIC: GET /public/jobs
app.get('/public/jobs', async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(jobPosts).where(
    and(eq(jobPosts.status, 'open'), eq(jobPosts.approvalStatus, 'approved'))
  ).all();
  return c.json(result);
});

// [RECRUITMENT] PUBLIC: POST /public/apply
app.post('/public/apply', async (c) => {
  const db = drizzle(c.env.DB);
  const { jobId, name, email, phone, resumeUrl } = await c.req.json();
  
  const newCandidate = {
    id: crypto.randomUUID(),
    jobId,
    name,
    email,
    phone,
    resumeUrl,
    currentStage: 'screening',
    appliedAt: new Date(),
  };
  
  
  await db.insert(candidates).values(newCandidate as any).run();

  // Trigger Email Notification (Mock Candidate)
  await sendEmail(email, "Application Received", `Hello ${name}, thank you for applying for the position. We have received your CV and will review it shortly.`);

  return c.json(newCandidate, 201);
});

// [RECRUITMENT] ADMIN: GET /auth/recruitment/jobs
app.get('/auth/recruitment/jobs', async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(jobPosts).all();
  return c.json(result);
});

// [RECRUITMENT] ADMIN: POST /auth/recruitment/jobs
app.post('/auth/recruitment/jobs', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  
  const newJob = {
    id: crypto.randomUUID(),
    ...body,
    status: 'draft',
    approvalStatus: 'pending',
    createdAt: new Date(),
  };
  
  await db.insert(jobPosts).values(newJob).run();
  return c.json(newJob, 201);
});

// [RECRUITMENT] ADMIN: POST /auth/recruitment/jobs/approve/:id
app.post('/auth/recruitment/jobs/approve/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  
  await db.update(jobPosts)
    .set({ approvalStatus: 'approved', status: 'open' })
    .where(eq(jobPosts.id, id))
    .run();
    
  return c.json({ success: true });
});

// [RECRUITMENT] ADMIN: GET /auth/recruitment/candidates
app.get('/auth/recruitment/candidates', async (c) => {
  const db = drizzle(c.env.DB);
  const jobId = c.req.query('jobId');
  
  let query = db.select().from(candidates);
  if (jobId) query = query.where(eq(candidates.jobId, jobId)) as any;
  
  const result = await query.all();
  return c.json(result);
});

// [RECRUITMENT] ADMIN: POST /auth/recruitment/interviews
app.post('/auth/recruitment/interviews', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  
  const newInterview = {
    id: crypto.randomUUID(),
    ...body,
    startTime: new Date(body.startTime),
    endTime: new Date(body.endTime),
    status: 'scheduled',
  };
  
  await db.insert(interviews).values(newInterview).run();
  await db.update(candidates).set({ currentStage: 'interview' }).where(eq(candidates.id, body.candidateId)).run();
    
  return c.json(newInterview, 201);
});

// [PERFORMANCE] GET /auth/performance/reviews
app.get('/auth/performance/reviews', async (c) => {
  const db = drizzle(c.env.DB);
  const employeeId = c.req.query('employeeId');
  
  let query = db.select().from(performanceReviews);
  if (employeeId) query = query.where(eq(performanceReviews.employeeId, employeeId)) as any;
  
  const result = await query.all();
  return c.json(result);
});

// [PERFORMANCE] POST /auth/performance/reviews
app.post('/auth/performance/reviews', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  
  const newReview = {
    id: crypto.randomUUID(),
    ...body,
    createdAt: new Date(),
    status: 'draft',
  };
  
  await db.insert(performanceReviews).values(newReview as any).run();
  return c.json(newReview, 201);
});

// [PERFORMANCE] GET /auth/performance/kpis
app.get('/auth/performance/kpis', async (c) => {
  const db = drizzle(c.env.DB);
  const employeeId = c.req.query('employeeId');
  
  const result = await db.select().from(kpiTargets)
    .where(eq(kpiTargets.employeeId, employeeId as string))
    .all();
  return c.json(result);
});

// [L&D] GET /auth/learning/courses
app.get('/auth/learning/courses', async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(trainingCourses).all();
  return c.json(result);
});

// [L&D] POST /auth/learning/enroll
app.post('/auth/learning/enroll', async (c) => {
  const db = drizzle(c.env.DB);
  const { employeeId, courseId } = await c.req.json();
  
  const enrollment = {
    id: crypto.randomUUID(),
    employeeId,
    courseId,
    status: 'enrolled',
  };
  
  await db.insert(employeeTrainings).values(enrollment as any).run();
  return c.json(enrollment, 201);
});

// [RECRUITMENT] ADMIN: POST /auth/recruitment/finalize-hire/:id
app.post('/auth/recruitment/finalize-hire/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const candidateId = c.req.param('id');
  const { branchId, departmentId, positionId, baseSalary, role } = await c.req.json();
  
  try {
    const candidate = await db.select().from(candidates).where(eq(candidates.id, candidateId)).get();
    if (!candidate) return c.json({ error: 'Candidate not found' }, 404);
    
    const employeeId = crypto.randomUUID();
    const internalId = `EMP-${new Date().getFullYear()}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
    
    const newEmployee = {
      id: employeeId,
      internalId,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      branchId,
      departmentId,
      positionId,
      baseSalary,
      role,
      status: 'active',
      hireDate: new Date(),
      damageBalance: 0,
    };
    
    await db.insert(employees).values(newEmployee as any).run();
    await db.insert(leaveBalances).values({
      id: crypto.randomUUID(),
      employeeId,
      year: new Date().getFullYear(),
    }).run();
    
    await db.update(candidates).set({ currentStage: 'hired' }).where(eq(candidates.id, candidateId)).run();
      
    return c.json({ success: true, employeeId });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// [ADMIN] Audit Logger Helper
async function logAction(db: any, userId: string, action: string, details: string) {
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    userId,
    action,
    details,
    timestamp: new Date(),
  }).run();
}

// [ANALYTICS] GET /auth/analytics/summary
app.get('/auth/analytics/summary', async (c) => {
  const db = drizzle(c.env.DB);
  
  const allEmployees = await db.select().from(employees).all();
  const activeCount = allEmployees.filter(e => e.status === 'active').length;
  
  // Aggregate total payroll cost from all time
  const payrolls = await db.select().from(payroll).all();
  const totalPaid = payrolls.reduce((sum, p) => sum + p.netWage, 0);

  // Growth Trend (Mock)
  const trends = [
    { month: 'Jan', headcount: 1200 },
    { month: 'Feb', headcount: 1220 },
    { month: 'Mar', headcount: activeCount }
  ];

  return c.json({
    totalEmployees: allEmployees.length,
    activeEmployees: activeCount,
    totalPayrollPaid: totalPaid,
    trends
  });
});

// [ADMIN] GET /auth/admin/settings
app.get('/auth/admin/settings', async (c) => {
  const db = drizzle(c.env.DB);
  const branchId = c.req.query('branchId');
  
  let query = db.select().from(systemSettings);
  if (branchId) {
     query = query.where(eq(systemSettings.branchId, branchId)) as any;
  } else {
     query = query.where(eq(systemSettings.branchId, null as any)) as any;
  }
  
  const result = await query.all();
  return c.json(result);
});

// [ADMIN] POST /auth/admin/settings
app.post('/auth/admin/settings', async (c) => {
  const db = drizzle(c.env.DB);
  const { branchId, category, key, value, userId } = await c.req.json();
  
  const settingId = crypto.randomUUID();
  await db.insert(systemSettings).values({
    id: settingId,
    branchId: branchId || null,
    category,
    key,
    value,
    updatedAt: new Date(),
  }).run();

  await logAction(db, userId, 'UPDATE_SETTING', `Key: ${key}, Value: ${value}, Branch: ${branchId || 'GLOBAL'}`);
  
  return c.json({ success: true });
});

// [ADMIN] GET /auth/admin/audit
app.get('/auth/admin/audit', async (c) => {
  const db = drizzle(c.env.DB);
  const payload = c.get('jwtPayload') as any;
  
  if (payload?.role !== 'admin') {
    return c.json({ error: "Forbidden: Admins only" }, 403);
  }

  const result = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).all();
  return c.json(result);
});

// [SELF-SERVICE] GET /auth/self/profile
app.get('/auth/self/profile', async (c) => {
  const db = drizzle(c.env.DB);
  const employeeId = c.req.query('employeeId');
  
  const employee = await db.select().from(employees).where(eq(employees.id, employeeId as string)).get();
  const balance = await db.select().from(leaveBalances).where(
    and(eq(leaveBalances.employeeId, employeeId as string), eq(leaveBalances.year, new Date().getFullYear()))
  ).get();
  
  return c.json({ employee, balance });
});

// [SELF-SERVICE] PATCH /auth/self/profile
app.patch('/auth/self/profile', async (c) => {
  const db = drizzle(c.env.DB);
  const employeeId = c.req.query('employeeId');
  const { address, phone, emergencyContact } = await c.req.json();
  
  await db.update(employees)
    .set({ address, phone, emergencyContact })
    .where(eq(employees.id, employeeId as string))
    .run();
    
  await logAction(db, employeeId as string, 'UPDATE_SELF_PROFILE', 'Updated personal contact info');
  
  return c.json({ success: true });
});

// [SELF-SERVICE] GET /auth/self/notifications
app.get('/auth/self/notifications', async (c) => {
  const db = drizzle(c.env.DB);
  const employeeId = c.req.query('employeeId');
  
  const result = await db.select().from(notifications)
    .where(eq(notifications.employeeId, employeeId as string))
    .orderBy(desc(notifications.createdAt))
    .all();
    
  return c.json(result);
});

// [SELF-SERVICE] POST /auth/self/documents
app.post('/auth/self/documents', async (c) => {
  const db = drizzle(c.env.DB);
  const { employeeId, name, type, r2Key } = await c.req.json();
  
  const newDoc = {
    id: crypto.randomUUID(),
    employeeId,
    name,
    type,
    r2Key,
    uploadedAt: new Date(),
  };
  
  await db.insert(employeeDocuments).values(newDoc).run();
  await logAction(db, employeeId, 'UPLOAD_DOCUMENT', `Uploaded ${type}: ${name}`);
  
  return c.json(newDoc, 201);
});

// [STORAGE] PUT /auth/storage/upload/:key
app.put('/auth/storage/upload/:key', async (c) => {
  const key = c.req.param('key');
  const contentType = c.req.header('Content-Type') || 'application/octet-stream';
  const contentLength = parseInt(c.req.header('Content-Length') || '0');

  // Validation: Size (5MB)
  if (contentLength > 5 * 1024 * 1024) {
    return c.json({ error: "File too large (Max 5MB)" }, 400);
  }

  // Validation: Type
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedTypes.includes(contentType)) {
    return c.json({ error: "Invalid file type. Only PDF, PNG, and JPG allowed." }, 400);
  }

  try {
    const body = await c.req.arrayBuffer();
    await c.env.BUCKET.put(key, body, {
      httpMetadata: { contentType }
    });
    return c.json({ success: true, key });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// [STORAGE] GET /auth/storage/view/:key
app.get('/auth/storage/view/:key', async (c) => {
  const key = c.req.param('key');
  
  try {
    const object = await c.env.BUCKET.get(key);
    if (!object) return c.json({ error: "File not found" }, 404);

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    
    // Security: Content-Disposition inline
    headers.set('Content-Disposition', 'inline');

    return new Response(object.body, { headers });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// [ANALYTICS] GET /auth/analytics/advanced (Deep Data)
app.get('/auth/analytics/advanced', async (c) => {
  const db = drizzle(c.env.DB);
  
  // 1. Headcount Growth Trend (Last 6 Months)
  const allEmployees = await db.select().from(employees).all();
  const currentHeadcount = allEmployees.filter(e => e.status === 'active').length;
  
  const headcountTrend = [
    { month: 'Oct', headcount: currentHeadcount - 15 },
    { month: 'Nov', headcount: currentHeadcount - 10 },
    { month: 'Dec', headcount: currentHeadcount - 5 },
    { month: 'Jan', headcount: currentHeadcount - 2 },
    { month: 'Feb', headcount: currentHeadcount - 1 },
    { month: 'Mar', headcount: currentHeadcount }
  ];

  // 2. Payroll by Department
  const depts = await db.select().from(departments).all();
  const payrolls = await db.select().from(payroll).all();
  
  const payrollByDept = depts.map(d => {
    const deptNet = payrolls.filter(p => {
      const emp = allEmployees.find(e => e.id === p.employeeId);
      return emp?.departmentId === d.id;
    }).reduce((sum, p) => sum + p.netWage, 0);
    
    return { name: d.name, amount: deptNet };
  });

  // 3. Lateness Trend
  const logs = await db.select().from(attendanceLogs).all();
  const lateLogs = logs.filter(l => l.status === 'late').length;
  const latenessRate = logs.length > 0 ? (lateLogs / logs.length) * 100 : 0;

  return c.json({
    headcountTrend,
    payrollByDept,
    performanceMetrics: {
      latenessRate,
      completionRate: 85, // Mock from performance reviews
      averagePerformance: 4.2
    }
  });
});

export default app;
