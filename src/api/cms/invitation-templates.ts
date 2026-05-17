import { apiClient } from "@/api/http-client"
import type { Template, SectionTypeDef } from "@/lib/template/types"

export type InvitationTemplateStatus = "PUBLISHED" | "DRAFT"

export type InvitationTemplate = {
  id: string
  name: string
  mobileThumbnail: string | null
  desktopThumbnail?: string | null
  status?: InvitationTemplateStatus
  category?: string
  categoryId?: number
  price?: string
  priceAfterDiscount?: string
  descriptionEn?: string
  descriptionIdn?: string
  createdAt?: string
  updatedAt?: string
}

export type GetInvitationTemplatesParams = {
  pageSize?: number
  sortOrder?: "asc" | "desc"
  sortField?: string
  categoryId?: string
  cursor?: string
  keyword?: string
}

export type TemplateBody = Omit<Template, "id" | "name"> & {
  sectionTypes: Record<string, SectionTypeDef>
}

export type CreateInvitationTemplatePayload = {
  name: string
  descriptionIdn?: string
  descriptionEn?: string
  mobileThumbnail?: string
  desktopThumbnail?: string
  categoryId?: number
  newCategory?: string
  newTags?: string[]
  tagIds?: number[]
  version?: number
  price?: string
  priceAfterDiscount?: string
  status?: InvitationTemplateStatus
  template?: TemplateBody
}

export type CreateInvitationTemplateResponse = {
  id: string
}

export function getInvitationTemplates(params?: GetInvitationTemplatesParams) {
  return apiClient.get<InvitationTemplate[]>("/api/v1/cms/invitation-templates", { params })
}

export function createInvitationTemplate(payload: CreateInvitationTemplatePayload) {
  return apiClient.post<CreateInvitationTemplateResponse>("/api/v1/invitation-templates", payload)
}
