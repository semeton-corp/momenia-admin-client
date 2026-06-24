import { apiClient } from "@/api/http-client"

export type InvitationTemplateDuration = {
  id: string
  value: number
  duration: "day" | "week" | "month" | "year"
  price: string
  isActive: boolean
}

export type InvitationTemplateDurationPayload = {
  value: number
  duration: "day" | "week" | "month" | "year"
  price: string
  isActive: boolean
}

export function getInvitationTemplateDurations() {
  return apiClient.get<InvitationTemplateDuration[]>("/api/v1/invitation-template-durations")
}

export function getInvitationTemplateDurationById(id: string) {
  return apiClient.get<InvitationTemplateDuration>(`/api/v1/invitation-template-durations/${id}`)
}

export function createInvitationTemplateDuration(payload: InvitationTemplateDurationPayload) {
  return apiClient.post<InvitationTemplateDuration>("/api/v1/invitation-template-durations", payload)
}

export function updateInvitationTemplateDuration(id: string, payload: InvitationTemplateDurationPayload) {
  return apiClient.put<InvitationTemplateDuration>(`/api/v1/invitation-template-durations/${id}`, payload)
}

export function deleteInvitationTemplateDuration(id: string) {
  return apiClient.delete(`/api/v1/invitation-template-durations/${id}`)
}
