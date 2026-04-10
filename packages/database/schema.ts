
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', { enum: ['admin', 'manager'] }).default('manager').notNull(),
  branchId: text('branch_id').references(() => branches.id),
});

export const branches = sqliteTable('branches', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  address: text('address'),
});

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').references(() => branches.id), // Optional for Owners
  name: text('name').notNull(),
  email: text('email').unique(),
  phone: text('phone'),
  role: text('role').notNull(), // 'owner', 'manager', 'staff'
  productTier: text('product_tier'), // For Owners: 'pos-lite', 'pos-premium', etc.
  status: text('status', { enum: ['active', 'inactive'] }).default('active').notNull(),
  hireDate: integer('hire_date', { mode: 'timestamp' }).notNull(),
  baseSalary: integer('base_salary').notNull(), // Amount in Ks
  hourlyRate: integer('hourly_rate'), // Amount in Ks
  commissionRate: real('commission_rate').default(0),
  damageBalance: integer('damage_balance').default(0).notNull(), // Outstanding damage to be recovered
  profilePicture: text('profile_picture'), // R2 URL
});

export const damageReports = sqliteTable('damage_reports', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id).notNull(),
  productName: text('product_name').notNull(),
  costPrice: integer('cost_price').notNull(), // Amount in Ks
  date: integer('date', { mode: 'timestamp' }).notNull(),
  reason: text('reason').notNull(),
  managerId: text('manager_id').references(() => users.id).notNull(),
  deductionAmount: integer('deduction_amount'), // Calculated later or fixed
  isDeducted: integer('is_deducted', { mode: 'boolean' }).default(false).notNull(),
});

export const salesRecords = sqliteTable('sales_records', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id).notNull(),
  amount: integer('amount').notNull(), // Sales amount in Ks
  date: integer('date', { mode: 'timestamp' }).notNull(),
  commissionEarned: integer('commission_earned').notNull(),
});

export const payroll = sqliteTable('payroll', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id).notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  baseSalary: integer('base_salary').notNull(),
  daysPresent: integer('days_present').notNull(),
  totalWorkingDays: integer('total_working_days').notNull(),
  grossWage: integer('gross_wage').notNull(),
  damageDeduction: integer('damage_deduction').default(0).notNull(),
  taxDeduction: integer('tax_deduction').default(0).notNull(),
  ssDeduction: integer('ss_deduction').default(0).notNull(),
  netWage: integer('net_wage').notNull(),
  remainingDamageBalance: integer('remaining_damage_balance').default(0).notNull(),
  status: text('status', { enum: ['pending', 'paid'] }).default('pending').notNull(),
});
