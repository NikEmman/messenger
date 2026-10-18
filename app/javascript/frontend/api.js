import { config } from "./Constants";

// Thrown for any non-2xx response. `data` holds the parsed JSON body (if any),
// so callers can surface server-side validation errors.
export class ApiError extends Error {
  constructor(status, data) {
    super(data?.error || data?.errors?.[0] || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function csrfMeta() {
  return document.querySelector('meta[name="csrf-token"]');
}

async function request(path, { method = "GET", json, form } = {}) {
  const headers = { Accept: "application/json" };
  let body;

  if (method !== "GET") {
    const token = csrfMeta()?.content;
    if (token) headers["X-CSRF-Token"] = token;
  }

  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form !== undefined) {
    // Let the browser set the multipart boundary.
    body = form;
  }

  const response = await fetch(`${config.url}${path}`, {
    method,
    headers,
    body,
    credentials: "same-origin",
  });

  // The server rotates the token on login/logout; keep the page's copy current.
  const freshToken = response.headers?.get("X-CSRF-Token");
  if (freshToken) csrfMeta()?.setAttribute("content", freshToken);

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, json) => request(path, { method: "POST", json }),
  put: (path, json) => request(path, { method: "PUT", json }),
  delete: (path) => request(path, { method: "DELETE" }),
  postForm: (path, form) => request(path, { method: "POST", form }),
  putForm: (path, form) => request(path, { method: "PUT", form }),
};
