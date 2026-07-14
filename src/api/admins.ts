import { apiClient } from "@/api/http-client"

export type CreateAdminPayload = {
  email: string
  provider: "google"
}

export type Admin = {
  id: string
  name: string
  email: string
}

export function createAdminAccount(payload: CreateAdminPayload) {
  return apiClient.post<Admin>("/api/v1/admins/register", payload)
}
