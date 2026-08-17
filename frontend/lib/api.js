// Single source of truth for the API origin.
// NEXT_PUBLIC_* is inlined at build time, so this works in client components.
// The localhost fallback keeps `npm run dev` zero-config for a fresh clone.
export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("qahwa_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("qahwa_session", id);
  }
  return id;
}

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

export function authHeaders(extra = {}) {
  const headers = {
    "x-session-id": getSessionId(),
    ...extra,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function apiError(data, fallback = "Request failed.") {
  return data?.error?.message || data?.message || fallback;
}

export async function apiFetch(path, options = {}) {
  const headers = authHeaders(options.headers || {});
  if (
    options.body &&
    typeof options.body === "string" &&
    !headers["Content-Type"] &&
    !headers["content-type"]
  ) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}
