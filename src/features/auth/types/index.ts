import type { User } from "@/types/ticket";

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

export interface Session {
  userId: string;
  email?: string;
  user?: User;
}

export type { User };
