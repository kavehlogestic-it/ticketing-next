import "server-only";

import { API_ENDPOINTS } from "@/constants/api-urls";
import { api } from "@/lib/api/client";
import { clearTokens, setTokens } from "@/lib/auth/token-store";
import type { LoginResponse, User } from "@/types/ticket";

export async function loginApi(payload: { username: string; password: string }): Promise<LoginResponse> {
  const data = await api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, payload, { skipAuth: true });
  if (data?.token) {
    await setTokens({
      accessToken: data.token,
      user: data.user,
    });
  }
  return data;
}

export async function getMeApi(): Promise<User> {
  return api.get<User>(API_ENDPOINTS.AUTH.ME);
}

export async function logoutApi(): Promise<void> {
  await clearTokens();
}
