import { apiRequest } from "@/api/client";
import type { Sex, UnitPreference, User } from "@/types/user";

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
  goal: string;
  heightInches: number;
  lastName: string;
  nutritionTarget?: {
    carbsGrams?: number;
    fatGrams?: number;
    proteinGrams?: number;
  };
  sex: Sex;
  unitPreference?: UnitPreference;
  weightPounds: number;
};

export type ClaimPairingCodeRequest = {
  code: string;
};

export async function login(_request: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    body: _request,
    method: "POST",
  });
}

export async function register(_request: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    body: _request,
    method: "POST",
  });
}

export async function claimPairingCode(request: ClaimPairingCodeRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/pairing-codes/claim", {
    body: request,
    method: "POST",
  });
}

export async function logout(refreshToken: string): Promise<void> {
  await apiRequest<void>("/auth/logout", {
    body: { refreshToken },
    method: "POST",
  });
}
