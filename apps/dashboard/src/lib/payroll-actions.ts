"use server";

import { fetchWithAuth } from "@/lib/api-client";

export async function calculatePayrollForMonth(branchId: string, month: number, year: number) {
  try {
    return await fetchWithAuth("/auth/payroll/calculate", {
      method: "POST",
      body: JSON.stringify({ branchId, month, year }),
    });
  } catch (error: any) {
    console.error("Payroll Calculation Error:", error.message);
    throw error;
  }
}

export async function approvePayrollRun(payrollData: any[]) {
  try {
    return await fetchWithAuth("/auth/payroll/approve", {
      method: "POST",
      body: JSON.stringify(payrollData),
    });
  } catch (error: any) {
    console.error("Payroll Approval Error:", error.message);
    throw error;
  }
}
