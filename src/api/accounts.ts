import { apiClient } from "@/api/http-client"

export type Account = {
  id: string
  name: string
  email: string
  phoneNumber: string
  profilePicture: string
  createdAt: string
}

export function getCurrentAccount() {
  return apiClient.get<Account>("/api/v1/accounts/me")
}

export function logoutSession() {
  return apiClient.post<void>("/api/v1/sessions/logout")
}
