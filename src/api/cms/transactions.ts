import { apiClient } from "@/api/http-client"

export type GetCmsTransactionsParams = {
  cursor?: string
  pageSize?: number
}

export type CmsTransaction = {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  totalPrice: string
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
  paidAt: string
  createdAt: string
}

export type GetCmsTransactionsResponse = {
  data: CmsTransaction[]
  nextCursor: string
}

export type CmsTransactionOrderItem = {
  id: string
  itemType: string
  price: string
  productName: string
}

export type CmsTransactionDetail = CmsTransaction & {
  discount: string
  amount: string
  orderItems: CmsTransactionOrderItem[]
}

export function getCmsTransactions(params?: GetCmsTransactionsParams) {
  return apiClient.get<GetCmsTransactionsResponse>("/api/v1/cms/transactions", { params })
}

export function getCmsTransactionDetail(id: string) {
  return apiClient.get<CmsTransactionDetail>(`/api/v1/cms/transactions/${id}`)
}
