"use server";

import { db } from "@/lib/db"; // Assuming a db instance exists
import { employees, payroll, damageReports } from "@next-hr/database";
import { eq, and, sql } from "drizzle-orm";

const ATTENDANCE_RATE = 0.9; // Fixed 90% attendance as requested

export async function calculatePayrollForMonth(branchId: string, month: number, year: number) {
  // 1. Fetch all active employees for the branch
  const activeEmployees = await db.select().from(employees).where(
    and(
      eq(employees.branchId, branchId),
      eq(employees.status, 'active')
    )
  );

  const totalWorkingDays = 26; // Standard working days
  const results = [];

  for (const employee of activeEmployees) {
    // 2. Calculate Gross Pay (Fixed 90% Attendance)
    const daysPresent = Math.floor(totalWorkingDays * ATTENDANCE_RATE);
    const grossWage = Math.floor((employee.baseSalary / totalWorkingDays) * daysPresent);

    // 3. Calculate Damage Deduction (20% Cap Rule)
    const maxDamageDeduction = Math.floor(grossWage * 0.20);
    const currentLiability = employee.damageBalance;
    
    // Total damage deduction for this month
    const actualDamageDeduction = Math.min(currentLiability, maxDamageDeduction);
    
    // Carry over balance
    const remainingDamageBalance = currentLiability - actualDamageDeduction;

    // 4. Net Wage (0% Tax/SS as requested)
    const netWage = grossWage - actualDamageDeduction;

    // 5. Build Result Object
    results.push({
      employeeId: employee.id,
      month,
      year,
      baseSalary: employee.baseSalary,
      daysPresent,
      totalWorkingDays,
      grossWage,
      damageDeduction: actualDamageDeduction,
      taxDeduction: 0,
      ssDeduction: 0,
      netWage,
      remainingDamageBalance,
      status: 'pending' as const,
    });
  }

  return results;
}

export async function approvePayrollRun(payrollData: any[]) {
  // Transaction to update both tables
  return await db.transaction(async (tx: any) => {
    for (const data of payrollData) {
      // 1. Create Payroll Record
      await tx.insert(payroll).values({
        id: crypto.randomUUID(),
        ...data
      });

      // 2. Update Employee Damage Balance
      await tx.update(employees)
        .set({ damageBalance: data.remainingDamageBalance })
        .where(eq(employees.id, data.employeeId));
    }
  });
}
