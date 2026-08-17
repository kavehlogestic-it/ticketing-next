"use client";

import { Eye, EyeOff, KeyRound, LogIn, ShieldAlert, User as UserIcon } from "lucide-react";
import { useActionState, useState } from "react";

import { Spinner } from "@/components/common/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/features/auth/actions/login-action";
import type { AuthResult } from "@/features/auth/types";

const initialState: AuthResult = { success: false };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        {/* Username Field */}
        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-sm font-semibold text-foreground">
            نام کاربری
          </Label>
          <div className="relative">
            <UserIcon className="absolute top-3 start-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="نام کاربری سازمانی خود را وارد کنید"
              required
              className="ps-10 h-11 bg-background text-sm"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-semibold text-foreground">
            رمز عبور
          </Label>
          <div className="relative">
            <KeyRound className="absolute top-3 start-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="ps-10 pe-10 h-11 bg-background text-sm"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-3 end-3.5 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              title={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {state.error ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in-50">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span className="leading-relaxed">{state.error}</span>
          </div>
        ) : null}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 gap-2 text-sm font-medium shadow-sm rounded-xl transition-all"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Spinner className="h-4 w-4" />
              <span>در حال اعتبارسنجی و ورود...</span>
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              <span>ورود به سامانه</span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
