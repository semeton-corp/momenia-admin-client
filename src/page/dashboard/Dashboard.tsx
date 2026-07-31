import { useState } from "react"
import { IconMinus, IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"

import {
  getDashboardOverview,
  getTopSellingTemplates,
  type DashboardOverviewMetric,
  type DashboardPeriod,
  type DashboardTrend,
  type TopSellingTemplate,
} from "@/api/cms/dashboard"
import { queryKeys } from "@/api/query-keys"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const periodOptions: { value: DashboardPeriod; label: string }[] = [
  { value: "thisWeek", label: "This week" },
  { value: "thisMonth", label: "This month" },
  { value: "thisYear", label: "This year" },
]

const defaultMetric: DashboardOverviewMetric = {
  value: 0,
  percentage: 0,
  trend: "stable",
}

function formatNumber(value: number | string) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return "-"
  }

  return new Intl.NumberFormat("id-ID").format(numericValue)
}

function formatCurrency(value: number | string) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return "Rp -"
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numericValue)
}

function formatPercentage(value: number) {
  if (value > 0) {
    return `+${value}%`
  }

  return `${value}%`
}

function getTrendIcon(trend: DashboardTrend) {
  if (trend === "up") {
    return IconTrendingUp
  }

  if (trend === "down") {
    return IconTrendingDown
  }

  return IconMinus
}

function getTrendClass(trend: DashboardTrend) {
  if (trend === "up") {
    return "text-emerald-600"
  }

  if (trend === "down") {
    return "text-destructive"
  }

  return "text-muted-foreground"
}

type MetricCardProps = {
  label: string
  metric: DashboardOverviewMetric
  formatValue?: (value: DashboardOverviewMetric["value"]) => string
  loading?: boolean
}

function MetricCard({ label, metric, formatValue = formatNumber, loading }: MetricCardProps) {
  const TrendIcon = getTrendIcon(metric.trend)

  return (
    <Card className="gap-5 rounded-lg py-5 shadow-sm">
      <CardHeader className="px-5">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {loading ? "..." : formatValue(metric.value)}
        </CardTitle>
        <CardAction>
          <Badge variant="outline" className={cn("gap-1", getTrendClass(metric.trend))}>
            <TrendIcon className="size-3" />
            {formatPercentage(metric.percentage)}
          </Badge>
        </CardAction>
      </CardHeader>
    </Card>
  )
}

function TemplateThumbnail({ template }: { template: TopSellingTemplate }) {
  const [failed, setFailed] = useState(false)

  if (!template.thumbnail || failed) {
    return (
      <div className="flex size-14 items-center justify-center rounded-md border bg-muted text-xs font-semibold text-muted-foreground">
        {template.name.slice(0, 2).toUpperCase() || "TP"}
      </div>
    )
  }

  return (
    <img
      src={template.thumbnail}
      alt={template.name}
      className="size-14 rounded-md border object-cover"
      onError={() => setFailed(true)}
    />
  )
}

function TopSellingTemplatesTable() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.cmsDashboard.topSellingTemplates(),
    queryFn: getTopSellingTemplates,
  })

  const templates = data?.data ?? []

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle>Top Selling Templates</CardTitle>
        <CardDescription>Templates with the highest sales performance.</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead className="text-right">Total Sold</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                    Loading top selling templates...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-destructive">
                    Failed to load top selling templates.{" "}
                    <button type="button" className="font-semibold underline" onClick={() => refetch()} disabled={isFetching}>
                      Retry
                    </button>
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                    No top selling templates yet.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <TemplateThumbnail template={template} />
                        <div>
                          <p className="font-medium text-foreground">{template.name}</p>
                          <p className="text-xs text-muted-foreground">{template.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatNumber(template.totalSold)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(template.totalRevenue)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>("thisWeek")

  const { data: overview, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.cmsDashboard.overview(period),
    queryFn: () => getDashboardOverview(period),
  })

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-5 md:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-normal">Dashboard</h1>
          {isError && (
            <p className="mt-1 text-sm text-destructive">
              Failed to load overview.{" "}
              <button type="button" className="font-semibold underline" onClick={() => refetch()} disabled={isFetching}>
                Retry
              </button>
            </p>
          )}
        </div>

        <Select value={period} onValueChange={(value) => setPeriod(value as DashboardPeriod)}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Select dashboard period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total Revenue"
          metric={overview?.totalRevenue ?? defaultMetric}
          formatValue={formatCurrency}
          loading={isLoading}
        />
        <MetricCard label="New Registered User" metric={overview?.newRegisteredUser ?? defaultMetric} loading={isLoading} />
        <MetricCard label="Total Order" metric={overview?.totalOrder ?? defaultMetric} loading={isLoading} />
      </div>

      <div className="mt-5">
        <TopSellingTemplatesTable />
      </div>
    </main>
  )
}
