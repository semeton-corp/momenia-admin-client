import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconGripVertical,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const metrics = [
  {
    label: "Total Revenue",
    value: "$1,250.00",
    delta: "+12.5%",
    trend: "up",
    headline: "Trending up this month",
    description: "Visitors for the last 6 months",
  },
  {
    label: "New Customers",
    value: "1,234",
    delta: "-20%",
    trend: "down",
    headline: "Down 20% this period",
    description: "Acquisition needs attention",
  },
  {
    label: "Active Accounts",
    value: "45,678",
    delta: "+12.5%",
    trend: "up",
    headline: "Strong user retention",
    description: "Engagement exceed targets",
  },
  {
    label: "User Growth Rate",
    value: "4.5%",
    delta: "+4.5%",
    trend: "up",
    headline: "Steady performance...",
    description: "Meets growth projections",
  },
  {
    label: "Monthly Active User",
    value: "4.5%",
    delta: "+4.5%",
    trend: "up",
    headline: "Steady performance...",
    description: "Meets growth projections",
  },
];

const chartData = [
  { date: "2024-04-02", visitors: 168, returning: 86 },
  { date: "2024-04-08", visitors: 118, returning: 62 },
  { date: "2024-04-14", visitors: 82, returning: 42 },
  { date: "2024-04-21", visitors: 76, returning: 38 },
  { date: "2024-04-28", visitors: 92, returning: 48 },
  { date: "2024-05-05", visitors: 124, returning: 58 },
  { date: "2024-05-12", visitors: 154, returning: 76 },
  { date: "2024-05-19", visitors: 166, returning: 84 },
  { date: "2024-05-25", visitors: 154, returning: 74 },
  { date: "2024-06-02", visitors: 110, returning: 54 },
  { date: "2024-06-08", visitors: 78, returning: 36 },
  { date: "2024-06-15", visitors: 72, returning: 34 },
  { date: "2024-06-22", visitors: 92, returning: 46 },
  { date: "2024-06-30", visitors: 144, returning: 68 },
];

const chartConfig = {
  visitors: {
    label: "Visitors",
    color: "#635bff",
  },
  returning: {
    label: "Returning",
    color: "#635bff",
  },
} satisfies ChartConfig;

const productRows = [
  {
    title: "Cover page",
    sectionType: "Cover page",
    status: "In Process",
    target: 18,
    limit: 5,
    reviewer: "Eddie Lake",
  },
  {
    title: "Table of contents",
    sectionType: "Table of contents",
    status: "Done",
    target: 29,
    limit: 24,
    reviewer: "Eddie Lake",
  },
  {
    title: "Executive summary",
    sectionType: "Narrative",
    status: "Done",
    target: 10,
    limit: 13,
    reviewer: "Eddie Lake",
  },
  {
    title: "Technical approach",
    sectionType: "Narrative",
    status: "Done",
    target: 27,
    limit: 23,
    reviewer: "Jamik Tashpulato",
  },
  {
    title: "Design",
    sectionType: "Narrative",
    status: "In Process",
    target: 2,
    limit: 16,
    reviewer: "Jamik Tashpulato",
  },
  {
    title: "Capabilities",
    sectionType: "Narrative",
    status: "In Process",
    target: 20,
    limit: 8,
    reviewer: "Jamik Tashpulato",
  },
  {
    title: "Integration with existing systems",
    sectionType: "Narrative",
    status: "In Process",
    target: 19,
    limit: 21,
    reviewer: "Jamik Tashpulato",
  },
  {
    title: "Innovation and Advantages",
    sectionType: "Narrative",
    status: "Done",
    target: 25,
    limit: 26,
    reviewer: "",
  },
  {
    title: "Overview of EMP's Innovative Solutions",
    sectionType: "Technical content",
    status: "Done",
    target: 7,
    limit: 23,
    reviewer: "",
  },
  {
    title: "Advanced Algorithms and Machine Learning",
    sectionType: "Narrative",
    status: "Done",
    target: 30,
    limit: 28,
    reviewer: "",
  },
];

const Dashboard = () => {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-5 md:px-6">
      <h1 className="mb-6 text-xl font-semibold tracking-normal">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="mt-5 space-y-5">
        <VisitorsChart />
        <TopProductTable />
      </div>
    </main>
  );
};

type MetricCardProps = {
  metric: (typeof metrics)[number];
};

const MetricCard = ({ metric }: MetricCardProps) => {
  const isUp = metric.trend === "up";
  const TrendIcon = isUp ? IconTrendingUp : IconTrendingDown;

  return (
    <Card className="gap-5 rounded-lg py-5 shadow-sm">
      <CardHeader className="px-5">
        <CardDescription>{metric.label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {metric.value}
        </CardTitle>
        <CardAction>
          <Badge
            variant="outline"
            className={cn(
              "gap-1",
              isUp ? "text-emerald-600" : "text-destructive",
            )}
          >
            <TrendIcon className="size-3" />
            {metric.delta}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 px-5 text-sm">
        <div className="flex items-center gap-2 font-medium">
          {metric.headline}
          <TrendIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">{metric.description}</div>
      </CardFooter>
    </Card>
  );
};

const VisitorsChart = () => {
  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle>Total Visitors</CardTitle>
        <CardDescription>Total for the last 3 months</CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            defaultValue="90d"
            variant="outline"
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-3 pt-4 sm:px-6">
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <AreaChart data={chartData} margin={{ left: 0, right: 0 }}>
            <defs>
              <linearGradient id="visitorsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="10%" stopColor="#635bff" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#635bff" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
              }
            />
            <Area
              dataKey="visitors"
              type="natural"
              fill="url(#visitorsFill)"
              stroke="#635bff"
              strokeWidth={1.5}
            />
            <Area
              dataKey="returning"
              type="natural"
              fill="transparent"
              stroke="#635bff"
              strokeWidth={1}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

const TopProductTable = () => {
  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle>Top Product</CardTitle>
        <CardDescription>Total for the last 3 months</CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            defaultValue="90d"
            variant="outline"
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-9" />
                <TableHead className="w-9">
                  <Checkbox aria-label="Select all rows" />
                </TableHead>
                <TableHead>Header</TableHead>
                <TableHead>Section Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Limit</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead className="w-9" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {productRows.map((row) => (
                <TableRow key={row.title}>
                  <TableCell>
                    <IconGripVertical className="size-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <Checkbox aria-label={`Select ${row.title}`} />
                  </TableCell>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-muted-foreground">
                      {row.sectionType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-right">{row.target}</TableCell>
                  <TableCell className="text-right">{row.limit}</TableCell>
                  <TableCell>
                    {row.reviewer ? (
                      row.reviewer
                    ) : (
                      <Select>
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue placeholder="Assign reviewer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eddie">Eddie Lake</SelectItem>
                          <SelectItem value="jamik">Jamik Tashpulato</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" aria-label="Open row menu">
                      <IconDotsVertical className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-4 px-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <span>0 of 68 row(s) selected.</span>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-foreground">
            Rows per page
            <Select defaultValue="10">
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <span className="text-foreground">Page 1 of 7</span>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" disabled>
              <IconChevronsLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" disabled>
              <IconChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm">
              <IconChevronRight className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm">
              <IconChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const isDone = status === "Done";

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        isDone ? "text-emerald-600" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isDone ? "bg-emerald-500" : "bg-muted-foreground",
        )}
      />
      {status}
    </Badge>
  );
};

export default Dashboard;
