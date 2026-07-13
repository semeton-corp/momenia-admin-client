import { apiClient } from "@/api/http-client"

export type CreateAdminPayload = {
  name: string
  email: string
  password: string
}

export type Admin = {
  id: string
  name: string
  email: string
}

export function createAdminAccount(payload: CreateAdminPayload) {
  return apiClient.post<Admin>("/api/v1/admins/register", payload)
}
