import "server-only";

import { getAccessToken, getUserSession, setTokens } from "@/lib/auth/token-store";
import { getMeApi } from "@/services/auth-service";
import type { User } from "@/types/ticket";

export async function getCurrentUser(): Promise<User | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const session = await getUserSession();
  if (session) return session;

  try {
    const user = await getMeApi();
    if (user) {
      await setTokens({ accessToken: token, user });
    }
    return user;
  } catch {
    return null;
  }
}
