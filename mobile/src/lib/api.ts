// The one way the app talks to Imedica: /api/v1 with a bearer token.

export const BASE = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setToken(value: string | null) {
  token = value;
}

/** For requests the client can't route through api(), like an <Image> source. */
export function authHeaders(): Record<string, string> {
  return token ? { authorization: `Bearer ${token}` } : {};
}

/** Called once by the auth provider: a 401 anywhere means the session is gone. */
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export async function api<T>(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<T> {
  if (!BASE) throw new ApiError(0, "The app isn't configured: EXPO_PUBLIC_API_URL is missing.");

  // FormData goes as multipart, with the boundary fetch picks.
  const form = body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/v1${path}`, {
      method,
      headers: {
        accept: "application/json",
        ...(body !== undefined && !form ? { "content-type": "application/json" } : {}),
        ...authHeaders(),
      },
      body: body === undefined ? undefined : form ? body : JSON.stringify(body),
    });
  } catch (e) {
    if (__DEV__) console.warn("[api]", method, path, e);
    throw new ApiError(0, "You're offline, or Imedica can't be reached. Check your connection.");
  }

  const json = (await res.json().catch(() => null)) as { data?: T; error?: { message?: string } } | null;
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(res.status, json?.error?.message ?? "Something went wrong. Try again.");
  }
  return json?.data as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Try again.";
}
