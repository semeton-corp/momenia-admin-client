import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import { getCmsTransactionDetail } from "@/api/cms/transactions"
import { queryKeys } from "@/api/query-keys"
import { cn } from "@/lib/utils"
import { formatApiDateTime } from "@/utils/formatApiDate"

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

export default function TransactionDetail() {
  const { id } = useParams()

  const { data: transaction, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.cmsTransactions.detail(id ?? ""),
    queryFn: () => getCmsTransactionDetail(id!),
    enabled: Boolean(id),
  })

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <Link to="/transactions" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to transactions
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Transaction Detail</h1>
      </div>

      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-40 rounded-xl border border-border bg-card" />
          <div className="h-56 rounded-xl border border-border bg-card" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center gap-3">
          <p className="text-sm text-muted-foreground">Failed to load transaction detail.</p>
          <button onClick={() => refetch()} className="text-sm text-indigo-500 hover:text-indigo-400">
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && transaction && (
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <h2 className="mt-1 break-all text-lg font-semibold text-foreground">{transaction.orderNumber}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={transaction.paymentStatus} />
                <StatusBadge status={transaction.orderStatus} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Customer Name</p>
                <p className="mt-1 text-sm text-muted-foreground">{transaction.customerName || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Customer Email</p>
                <p className="mt-1 break-all text-sm text-muted-foreground">{transaction.customerEmail || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Total Price</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatPrice(transaction.totalPrice)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Discount</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatPrice(transaction.discount)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Amount</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatPrice(transaction.amount)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Payment Method</p>
                <p className="mt-1 text-sm capitalize text-muted-foreground">{transaction.paymentMethod || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Paid At</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatApiDateTime(transaction.paidAt)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Created At</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatApiDateTime(transaction.createdAt)}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold text-foreground">Order Items</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold">Product Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Item Type</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaction.orderItems.length === 0 ? (
                      <tr>
                        <td className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={3}>
                          No order items found.
                        </td>
                      </tr>
                    ) : transaction.orderItems.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors last:border-0">
                        <td className="px-4 py-3 text-sm text-foreground">{item.productName || "-"}</td>
                        <td className="px-4 py-3 text-sm capitalize text-muted-foreground">{item.itemType || "-"}</td>
                        <td className="px-4 py-3 text-right text-sm text-muted-foreground">{formatPrice(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
