// Browser-side helper for /api/v1. Throws ApiError with the server's message
// and per-field errors, so forms can show them next to the right input.

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

export async function api<T = unknown>(method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE", path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(json?.error?.message ?? `Request failed (${res.status}).`, res.status, json?.error?.fields ?? {});
  }
  return json.data as T;
}
