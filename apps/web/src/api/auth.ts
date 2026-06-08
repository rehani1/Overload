import { apiClient, publicClient } from "../lib/apiClient";
import type {
  AuthResponse,
  LoginRequest,
  PairingCodeResponse,
  RegisterRequest,
} from "../types/api";

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await publicClient.post<AuthResponse>("/auth/login", request);

  return response.data;
}

export async function register(request: RegisterRequest): Promise<AuthResponse> {
  const response = await publicClient.post<AuthResponse>("/auth/register", request);

  return response.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post<void>("/auth/logout", { refreshToken });
}

export async function createPairingCode(): Promise<PairingCodeResponse> {
  const response = await apiClient.post<PairingCodeResponse>("/pairing-codes");

  return response.data;
}
