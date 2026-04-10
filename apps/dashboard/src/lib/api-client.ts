import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const API_URL = process.env.API_WORKER_URL || "http://localhost:8787";

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const session = await getServerSession(authOptions) as any;
  
  const headers = {
    "Content-Type": "application/json",
    ...(session?.user?.accessToken && { 
      "Authorization": `Bearer ${session.user.accessToken}` 
    }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "API Request Failed");
  }

  return response.json();
}
