import { apiClient } from "@/api/http-client"

export type InvitationTemplateTag = {
  id: number
  name: string
}

export function getInvitationTemplateTags(keyword?: string) {
  return apiClient.get<InvitationTemplateTag[]>("/api/v1/invitation-templates/tags", {
    params: keyword ? { keyword } : undefined,
  })
}
