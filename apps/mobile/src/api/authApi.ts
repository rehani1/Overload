import type { User } from "@/types/user";

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = LoginRequest & {
  firstName: string;
  lastName: string;
};

export async function login(_request: LoginRequest): Promise<AuthResponse> {
  // TODO: Call POST /auth/login when the Spring Boot API exists.
  throw new Error("login is not implemented yet");
}

export async function register(_request: RegisterRequest): Promise<AuthResponse> {
  // TODO: Call POST /auth/register when the Spring Boot API exists.
  throw new Error("register is not implemented yet");
}

export async function logout(): Promise<void> {
  // TODO: Call POST /auth/logout and clear stored tokens when real auth is implemented.
  throw new Error("logout is not implemented yet");
}
