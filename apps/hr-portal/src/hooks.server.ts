import { building } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    const padded = pad ? b64 + '='.repeat(4 - pad) : b64;
    if (typeof atob !== 'function') return null;
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.auth = async () => {
    const t = event.cookies.get('token');
    if (!t) return null;
    const payload = decodeJwtPayload(t);
    if (!payload) return null;
    return {
      userId: String(payload.id ?? ''),
      username: String(payload.username ?? ''),
      role: String(payload.role ?? ''),
      employeeId: payload.employeeId != null ? String(payload.employeeId) : null,
    };
  };

  if (building) {
    return resolve(event);
  }

  const token = event.cookies.get('token');
  const { pathname } = event.url;

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/public'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (!token && !isPublicRoute) {
    throw redirect(303, '/login');
  }

  if (token && pathname === '/login') {
    throw redirect(303, '/');
  }

  if (token && !decodeJwtPayload(token)) {
    event.cookies.delete('token', { path: '/' });
    throw redirect(303, '/login');
  }

  const response = await resolve(event);
  return response;
};
