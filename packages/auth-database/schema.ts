import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Auth service users (separate D1 from main HR schema). */
export const users = sqliteTable('auth_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull(),
  employeeId: text('employee_id'),
});
