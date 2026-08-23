import "server-only";

import { cookies } from "next/headers";

import type { User } from "@/types/ticket";

const ACCESS_TOKEN_COOKIE = "__access_token";
const REFRESH_TOKEN_COOKIE = "__refresh_token";
const USER_SESSION_COOKIE = "__user_session";

/**
 * Determine if cookies should have the Secure flag.
 * For local network / offline intranet deployments running over plain HTTP (e.g. http://192.168.x.x:3000),
 * setting `secure: true` causes modern browsers to drop or refuse sending cookies on subsequent HTTP requests.
 * Therefore, we only set `secure: true` if COOKIE_SECURE is explicitly "true" or NEXT_PUBLIC_APP_URL starts with https://.
 */
const isSecure =
  process.env.COOKIE_SECURE === "true" ||
  (process.env.COOKIE_SECURE !== "false" &&
    Boolean(process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")));

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
}

export async function getUserSession(): Promise<User | null> {
  const store = await cookies();
  const raw = store.get(USER_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as User;
  } catch {
    return null;
  }
}

export async function setTokens({
  accessToken,
  refreshToken,
  user,
}: {
  accessToken: string;
  refreshToken?: string;
  user?: User;
}) {
  const store = await cookies();
  const accessTtl = Number(process.env.AUTH_ACCESS_TOKEN_TTL ?? 86400 * 30); // Default 30 days
  const refreshTtl = Number(process.env.AUTH_REFRESH_TOKEN_TTL ?? 86400 * 60); // Default 60 days

  const shared = {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
  };

  store.set(ACCESS_TOKEN_COOKIE, accessToken, { ...shared, maxAge: accessTtl });
  if (refreshToken) {
    store.set(REFRESH_TOKEN_COOKIE, refreshToken, { ...shared, maxAge: refreshTtl });
  }
  if (user) {
    store.set(USER_SESSION_COOKIE, encodeURIComponent(JSON.stringify(user)), {
      ...shared,
      httpOnly: true,
      maxAge: accessTtl,
    });
  }
}

export async function clearTokens() {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
  store.delete(USER_SESSION_COOKIE);
}
