import { apiClient } from "@/api/http-client"
import type { Template, SectionTypeDef } from "@/lib/template/types"

export type InvitationTemplateStatus = "PUBLISHED" | "DRAFT"

export type InvitationTemplateCategory = {
  id: number
  name: string
}

export type InvitationTemplateTag = {
  id: number
  name: string
}

export type InvitationTemplate = {
  id: string
  name: string
  mobileThumbnail: string | null
  desktopThumbnail?: string | null
  status?: InvitationTemplateStatus
  category?: string | InvitationTemplateCategory
  tags?: InvitationTemplateTag[]
  categoryId?: number
  price?: string
  priceAfterDiscount?: string
  descriptionEn?: string
  descriptionIdn?: string
  createdAt?: string
  updatedAt?: string
  template?: TemplateBody
}

export type GetInvitationTemplatesParams = {
  pageSize?: number
  sortOrder?: "asc" | "desc"
  sortField?: string
  categoryId?: string
  cursor?: string
  keyword?: string
  statuses?: string[]
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
  status?: "draft" | "active" | "inactive"
  template?: TemplateBody
}

export type CreateInvitationTemplateResponse = {
  id: string
}

export type GetInvitationTemplatesResponse = {
  data: InvitationTemplate[]
  nextCursor: string
}

export function getInvitationTemplates(params?: GetInvitationTemplatesParams) {
  return apiClient.get<GetInvitationTemplatesResponse>("/api/v1/cms/invitation-templates", { params })
}

export function getInvitationTemplateDetail(id: string) {
  return apiClient.get<InvitationTemplate>(`/api/v1/cms/invitation-templates/${id}`)
}

export function createInvitationTemplate(payload: CreateInvitationTemplatePayload) {
  return apiClient.post<CreateInvitationTemplateResponse>("/api/v1/invitation-templates", payload)
}
