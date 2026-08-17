"use server";

import type { AuthResult } from "@/features/auth/types";
import { getUserLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/types";
import { loginSchema } from "@/lib/validations/auth";
import { loginApi } from "@/services/auth-service";

export async function loginAction(
  _prevState: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const parsed = loginSchema.safeParse({
    username,
    password,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "نام کاربری و رمز عبور الزامی هستند (Username and password are required)",
    };
  }

  try {
    const loginRes = await loginApi(parsed.data);
    if (!loginRes?.token) {
      return {
        success: false,
        error: "اطلاعات ورود نادرست است (Invalid username or password)",
      };
    }
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "نام کاربری یا رمز عبور اشتباه است (Invalid credentials)";
    return { success: false, error: message };
  }

  const locale = await getUserLocale();
  redirect({ href: "/dashboard", locale });
  return { success: true };
}