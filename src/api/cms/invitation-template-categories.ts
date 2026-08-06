import { apiClient } from "@/api/http-client"

export type InvitationTemplateCategory = {
  id: number
  name: string
}

export function getInvitationTemplateCategories(keyword?: string) {
  return apiClient.get<InvitationTemplateCategory[]>("/api/v1/invitation-templates/categories", {
    params: keyword ? { keyword } : undefined,
  })
}
