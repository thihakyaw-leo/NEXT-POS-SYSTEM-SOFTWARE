"use server";

import { fetchWithAuth } from "@/lib/api-client";

export async function registerEmployee(employeeData: any) {
  try {
    return await fetchWithAuth("/auth/employees", {
      method: "POST",
      body: JSON.stringify(employeeData),
    });
  } catch (error: any) {
    console.error("Employee Registration Error:", error.message);
    throw error;
  }
}

export async function getEmployees(branchId?: string) {
  try {
    const endpoint = branchId ? `/auth/employees?branchId=${branchId}` : "/auth/employees";
    return await fetchWithAuth(endpoint);
  } catch (error: any) {
    console.error("Fetch Employees Error:", error.message);
    throw error;
  }
}
