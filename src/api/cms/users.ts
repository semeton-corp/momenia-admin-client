import { apiClient } from "@/api/http-client"

export type GetCmsUsersParams = {
  keyword?: string
  pageSize?: number
  cursor?: string
}

export type CmsUser = {
  id: string
  email: string
  name: string
  phoneNumber: string
  profilePicture?: string
  createdAt: string
}

export type GetCmsUsersResponse = {
  nextCursor: string
  data: CmsUser[]
}

export type CmsUserTemplate = {
  id: string
  name: string
  slug: string
  status: string
  purchasedAt: string
}

export type CmsUserDetail = CmsUser & {
  totalPurchased: number
  activeTemplate: number
  templates: {
    nextCursor: string
    data: CmsUserTemplate[]
  }
}

export type GetCmsUserDetailParams = {
  pageSize?: number
  cursor?: string
}

export function getCmsUsers(params?: GetCmsUsersParams) {
  return apiClient.get<GetCmsUsersResponse>("/api/v1/cms/users", { params })
}

export function getCmsUserDetail(id: string, params?: GetCmsUserDetailParams) {
  return apiClient.get<CmsUserDetail>(`/api/v1/cms/users/${id}`, { params })
}
