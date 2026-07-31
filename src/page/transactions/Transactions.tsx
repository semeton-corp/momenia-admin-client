import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getCmsTransactions, type CmsTransaction } from "@/api/cms/transactions"
import { queryKeys } from "@/api/query-keys"
import { cn } from "@/lib/utils"
import { formatApiDateTime } from "@/utils/formatApiDate"

const PAGE_SIZE_OPTIONS = [10, 20, 50]

function formatPrice(value: string) {
  const price = Number(value)

  if (!Number.isFinite(price)) {
    return "Rp -"
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price)
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
    case "success":
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
    case "pending":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
    case "failed":
    case "cancelled":
    case "canceled":
    case "expired":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", statusClass(status))}>
      {status || "unknown"}
    </span>
  )
}

export default function Transactions() {
  const [pageSize, setPageSize] = useState(10)
  const [cursor, setCursor] = useState("")
  const [cursorHistory, setCursorHistory] = useState<string[]>([])

  const queryParams = useMemo(
    () => ({
      pageSize,
      cursor: cursor || undefined,
    }),
    [cursor, pageSize],
  )

  const { data: response, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.cmsTransactions.list(queryParams),
    queryFn: () => getCmsTransactions(queryParams),
  })

  const transactions = response?.data ?? []
  const nextCursor = response?.nextCursor ?? ""

  const goNext = () => {
    if (!nextCursor) {
      return
    }

    setCursorHistory((history) => [...history, cursor])
    setCursor(nextCursor)
  }

  const goPrevious = () => {
    setCursorHistory((history) => {
      if (history.length === 0) {
        return history
      }

      const nextHistory = history.slice(0, -1)
      setCursor(history[history.length - 1] ?? "")

      return nextHistory
    })
  }

  const handlePageSizeChange = (value: number) => {
    setPageSize(value)
    setCursor("")
    setCursorHistory([])
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Transaction Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track customer orders, payment status, and purchased items.</p>
        </div>
        <select
          value={pageSize}
          onChange={(event) => handlePageSizeChange(Number(event.target.value))}
          className="h-10 w-fit rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-indigo-500 focus:outline-none"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size} rows</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-border overflow-hidden animate-pulse">
          <div className="h-12 bg-muted/50" />
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="h-16 border-t border-border bg-card" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center gap-3">
          <p className="text-sm text-muted-foreground">Failed to load transactions.</p>
          <button onClick={() => refetch()} className="text-sm text-indigo-500 hover:text-indigo-400">
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-sm text-muted-foreground">No transactions found.</p>
        </div>
      )}

      {!isLoading && !isError && transactions.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold">Order Number</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Total Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Payment</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Payment Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Order Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction: CmsTransaction) => (
                  <tr key={transaction.id} className="border-b border-border hover:bg-muted/30 transition-colors last:border-0">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{transaction.orderNumber}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">{transaction.customerName || "Unnamed customer"}</p>
                      <p className="text-xs text-muted-foreground">{transaction.customerEmail || "-"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatPrice(transaction.totalPrice)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground capitalize">{transaction.paymentMethod || "-"}</td>
                    <td className="px-6 py-4"><StatusBadge status={transaction.paymentStatus} /></td>
                    <td className="px-6 py-4"><StatusBadge status={transaction.orderStatus} /></td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatApiDateTime(transaction.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/transactions/${transaction.id}`}
                        className="inline-flex rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        View Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>{isFetching && !isLoading ? "Updating transactions..." : `${transactions.length} transaction(s) shown`}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={goPrevious}
            disabled={cursorHistory.length === 0 || isFetching}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={goNext}
            disabled={!nextCursor || isFetching}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
