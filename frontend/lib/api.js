/*
 * Single source of truth for the API origin.
 *
 * NEXT_PUBLIC_* is inlined at build time, so this works in client components.
 *
 * The default depends on where the app is running:
 *   production  ""  -> same origin. On Netlify the Express API is proxied at
 *                      /api on this very domain, so a relative fetch is
 *                      correct and there is no CORS boundary to cross.
 *   development     -> the separate Express process on port 5001, which keeps
 *                      `npm run dev` zero-config for a fresh clone.
 *
 * Setting NEXT_PUBLIC_API_URL overrides both, for the case where the API is
 * deployed somewhere else entirely.
 */
const DEFAULT_API =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:5001";

export const API = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API;

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

/*
 * Field-keyed errors from the API, for forms that pin each problem to its own
 * input rather than showing one sentence for the whole form.
 *
 * Reads error.fields (the shape errorHandler emits) and tolerates a bare
 * `fields` for any route that has not been converted yet. Non-string values are
 * dropped so a malformed payload cannot render [object Object] under an input.
 */
export function apiFieldErrors(data) {
  const fields = data?.error?.fields || data?.fields;
  if (!fields || typeof fields !== "object") return {};
  const out = {};
  Object.keys(fields).forEach((key) => {
    if (typeof fields[key] === "string" && fields[key]) out[key] = fields[key];
  });
  return out;
}

export function apiErrorCode(data) {
  return data?.error?.code || "";
}
