import { apiClient } from "@/api/http-client"

export type DashboardPeriod = "thisWeek" | "thisMonth" | "thisYear"

export type DashboardTrend = "up" | "down" | "stable"

export type DashboardOverviewMetric = {
  value: number | string
  percentage: number
  trend: DashboardTrend
}

export type DashboardOverview = {
  newRegisteredUser: DashboardOverviewMetric
  totalOrder: DashboardOverviewMetric
  totalRevenue: DashboardOverviewMetric
}

export type TopSellingTemplate = {
  id: string
  name: string
  thumbnail: string | null
  totalSold: number
  totalRevenue: string
}

export type TopSellingTemplatesResponse = {
  data: TopSellingTemplate[]
}

export function getDashboardOverview(period: DashboardPeriod) {
  return apiClient.get<DashboardOverview>("/api/v1/cms/dashboard/overview", {
    params: { period },
  })
}

export function getTopSellingTemplates() {
  return apiClient.get<TopSellingTemplatesResponse>("/api/v1/cms/dashboard/top-selling-templates")
}
