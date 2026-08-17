import "server-only";

import { runRequestInterceptors, runResponseInterceptors } from "@/lib/api/interceptors";
import { ApiError, type ApiRequestConfig, type HttpMethod } from "@/lib/api/types";
import { refreshAccessToken } from "@/lib/auth/refresh";
import { getAccessToken } from "@/lib/auth/token-store";

const DEFAULT_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS ?? 15_000);
const DEFAULT_RETRIES = 1;
const RETRYABLE_STATUS = new Set([502, 503, 504]);

function buildUrl(path: string, params?: ApiRequestConfig["params"]) {
  const base = process.env.API_BASE_URL ?? "http://192.168.77.30:6040";
  const url = new URL(path.startsWith("/") ? path : `/${path}`, base);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function parseErrorBody(response: Response): Promise<{ message: string; code?: string; details?: unknown }> {
  try {
    const text = await response.text();
    if (!text) return { message: response.statusText || `Request failed with status ${response.status}` };
    try {
      const json = JSON.parse(text);
      if (typeof json === "string") return { message: json };
      return {
        message: json.message || json.title || json.error || response.statusText,
        code: json.code,
        details: json.errors || json.details,
      };
    } catch {
      return { message: text };
    }
  } catch {
    return { message: response.statusText };
  }
}

async function request<T>(
  method: HttpMethod,
  path: string,
  config: ApiRequestConfig = {},
): Promise<T> {
  const { url: resolvedPath, config: resolvedConfig } = await runRequestInterceptors(
    path,
    config,
  );

  const {
    params,
    json,
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    skipAuth,
    token: explicitToken,
    ...init
  } = resolvedConfig;

  const url = buildUrl(resolvedPath, params);
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  let reqBody: BodyInit | null | undefined = body;
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    reqBody = JSON.stringify(json);
  }

  if (!skipAuth) {
    const token = explicitToken !== undefined ? explicitToken : await getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let response = await fetch(url, {
        ...init,
        method,
        headers,
        body: reqBody,
        signal: controller.signal,
        cache: init.cache ?? "no-store",
      });

      response = await runResponseInterceptors(response);

      if (response.status === 401 && !skipAuth && explicitToken === undefined) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          headers.set("Authorization", `Bearer ${refreshed}`);
          attempt += 1;
          continue;
        }
      }

      if (!response.ok) {
        if (RETRYABLE_STATUS.has(response.status) && attempt < retries) {
          attempt += 1;
          await backoff(attempt);
          continue;
        }
        const errorInfo = await parseErrorBody(response);
        throw new ApiError({
          message: errorInfo.message,
          status: response.status,
          code: errorInfo.code,
          details: errorInfo.details,
        });
      }

      if (response.status === 204) return undefined as T;
      
      const responseText = await response.text();
      if (!responseText) return undefined as T;
      
      try {
        return JSON.parse(responseText) as T;
      } catch {
        return responseText as unknown as T;
      }
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError) throw error;
      if (attempt >= retries) break;
      attempt += 1;
      await backoff(attempt);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error
    ? new ApiError({ message: lastError.message, status: 0 })
    : new ApiError({ message: "Unknown network error", status: 0 });
}

function backoff(attempt: number) {
  const delay = Math.min(1000 * 2 ** attempt, 3000);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export const api = {
  get: <T>(path: string, config?: ApiRequestConfig) => request<T>("GET", path, config),
  post: <T>(path: string, json?: unknown, config?: ApiRequestConfig) =>
    request<T>("POST", path, { ...config, json }),
  postForm: <T>(path: string, formData: FormData, config?: ApiRequestConfig) =>
    request<T>("POST", path, { ...config, body: formData }),
  put: <T>(path: string, json?: unknown, config?: ApiRequestConfig) =>
    request<T>("PUT", path, { ...config, json }),
  patch: <T>(path: string, json?: unknown, config?: ApiRequestConfig) =>
    request<T>("PATCH", path, { ...config, json }),
  delete: <T>(path: string, config?: ApiRequestConfig) => request<T>("DELETE", path, config),
};
