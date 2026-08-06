import { apiClient } from "@/api/http-client"

export type ContentInvitationTemplate = {
  id: number
  name: string
  content: string
  createdAt: string
}

export type CreateContentInvitationTemplatePayload = {
  name: string
  content: string
}

export function getContentInvitationTemplates() {
  return apiClient.get<ContentInvitationTemplate[]>("/api/v1/content-invitation-templates")
}

export function createContentInvitationTemplate(payload: CreateContentInvitationTemplatePayload) {
  return apiClient.post<ContentInvitationTemplate>("/api/v1/content-invitation-templates", payload)
}

export function deleteContentInvitationTemplate(id: number) {
  return apiClient.delete(`/api/v1/content-invitation-templates/${id}`)
}
