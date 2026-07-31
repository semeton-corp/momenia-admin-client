import { apiClient } from "@/api/http-client"

export type GetAdminsParams = {
  cursor?: string
  keyword?: string
  pageSize?: number
}

export type CreateAdminPayload = {
  email: string
  provider: "google"
}

export type Admin = {
  id: string
  name: string
  email: string
  phoneNumber?: string
  profilePicture?: string
  createdAt?: string
}

export type GetAdminsResponse = {
  nextCursor: string
  data: Admin[]
}

export function createAdminAccount(payload: CreateAdminPayload) {
  return apiClient.post<Admin>("/api/v1/admins/register", payload)
}

export function getAdmins(params?: GetAdminsParams) {
  return apiClient.get<GetAdminsResponse>("/api/v1/cms/admins", { params })
}

export function deleteAdmin(id: string) {
  return apiClient.delete<void>(`/api/v1/cms/admins/${id}`)
}
