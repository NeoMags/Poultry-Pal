
"use client"

import * as React from "react"
import { format, subDays, startOfMonth, endOfMonth, parseISO, startOfWeek, getWeek, addDays, subMonths, addMonths as dateFnsAddMonths } from "date-fns"
import { Calendar as CalendarIcon, Download, FileText } from "lucide-react"
import { type DateRange } from "react-day-picker"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useFarm } from "@/context/FarmContext"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ReportType = "egg-production" | "feed-consumption" | "dispatch-summary";
type ReportData = { name: string; value: number };
type TimeRange = "day" | "week" | "month" | "custom";

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--primary))",
  },
}

export default function ReportsPage() {
  const { 
    eggCollectionData, 
    allSheds, 
    feedConsumptionData,
    dispatchData,
  } = useFarm();
  const { toast } = useToast();

  // Filter states
  const [reportType, setReportType] = React.useState<ReportType>("egg-production");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedShed, setSelectedShed] = React.useState("all");
  const [timeRange, setTimeRange] = React.useState<TimeRange>("month");

  // Report state
  const [reportData, setReportData] = React.useState<ReportData[]>([]);
  const [reportTitle, setReportTitle] = React.useState("");
  const [reportDescription, setReportDescription] = React.useState("");
  const [yAxisLabel, setYAxisLabel] = React.useState("");


  const handleGenerateReport = () => {
    let newReportData: ReportData[] = [];
    let title = "";
    let description = "";
    let yLabel = "";
    
    const now = new Date();

    const generateTimeBasedData = (
        data: any[], 
        dateExtractor: (item: any) => Date, 
        valueExtractor: (item: any) => number,
        filterFn?: (item: any) => boolean
    ) => {
        const timeData: { [key: string]: number } = {};
        let dataToProcess = data;
        if(filterFn) {
            dataToProcess = data.filter(filterFn);
        }

        if (timeRange === "day") {
            description += ` Showing last 7 days.`;
            const sevenDaysAgo = startOfDay(subDays(now, 6));
            for (let i = 0; i < 7; i++) {
                const date = addDays(sevenDaysAgo, i);
                const dateKey = format(date, 'MMM d');
                timeData[dateKey] = 0;
            }
            dataToProcess.forEach(item => {
                const itemDate = dateExtractor(item);
                if (itemDate >= sevenDaysAgo) {
                    const dateKey = format(itemDate, 'MMM d');
                    timeData[dateKey] = (timeData[dateKey] || 0) + valueExtractor(item);
                }
            });
        } else if (timeRange === "week") {
            description += ` Showing last 8 weeks.`;
            const eightWeeksAgo = startOfWeek(subDays(now, 7 * 7));
            for (let i = 0; i < 8; i++) {
                const weekStart = addDays(eightWeeksAgo, i * 7);
                const weekKey = `W${getWeek(weekStart)}`;
                timeData[weekKey] = 0;
            }
            dataToProcess.forEach(item => {
                const itemDate = dateExtractor(item);
                if (itemDate >= eightWeeksAgo) {
                    const weekKey = `W${getWeek(itemDate)}`;
                    if (weekKey in timeData) {
                        timeData[weekKey] = (timeData[weekKey] || 0) + valueExtractor(item);
                    }
                }
            });
        } else if (timeRange === 'month') {
            description += ` Showing last 6 months.`;
            const sixMonthsAgo = startOfMonth(subMonths(now, 5));
            for (let i = 0; i < 6; i++) {
                const monthKey = format(addMonths(sixMonthsAgo, i), 'MMM');
                timeData[monthKey] = 0;
            }
            dataToProcess.forEach(item => {
                const itemDate = dateExtractor(item);
                if (itemDate >= sixMonthsAgo) {
                    const month = format(itemDate, 'MMM');
                    if (month in timeData) {
                        timeData[month] = (timeData[month] || 0) + valueExtractor(item);
                    }
                }
            });
        }
        return Object.entries(timeData).map(([name, value]) => ({ name, value }));
    };

    switch (reportType) {
        case "egg-production":
            title = "Egg Production Report";
            yLabel = "Total Eggs";
            newReportData = generateTimeBasedData(
                eggCollectionData,
                item => parseISO(item.date),
                item => item.total,
                item => selectedShed === 'all' || item.shed === selectedShed
            );
            break;
        
        case "feed-consumption":
            title = "Feed Consumption Report";
            yLabel = "Consumption (kg)";
            newReportData = generateTimeBasedData(
                feedConsumptionData,
                item => parseISO(item.date),
                item => item.quantity,
                item => selectedShed === 'all' || item.shed === selectedShed
            );
            break;

        case "dispatch-summary":
            title = "Dispatch Summary Report";
            yLabel = "No. of Dispatches";
            newReportData = generateTimeBasedData(
                dispatchData,
                item => parseISO(item.date),
                () => 1 // Count each dispatch as 1
            );
            break;
            
        default:
             toast({ title: "Notice", description: "This report type is not yet implemented.", variant: "default" });
            return;
    }
    
    setReportData(newReportData);
    setReportTitle(title);
    setReportDescription(description);
    setYAxisLabel(yLabel);
    chartConfig.value.label = yLabel;
    
    if (newReportData.length > 0 && newReportData.every(d => d.value === 0)) {
       toast({ title: "No Data", description: "No data found for the selected filters."})
    }
  };
  
  React.useEffect(() => {
    handleGenerateReport();
  }, [reportType, timeRange, selectedShed]);

  const yAxisFormatter = (value: number) => {
    if (value >= 1000) {
      return `${value / 1000}k`;
    }
    return value.toString();
  };

  return (
    <div className="grid flex-1 items-start gap-4 md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Filters</CardTitle>
          <CardDescription>
            Generate a report based on the criteria below.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={(val) => setReportType(val as ReportType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a report" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="egg-production">Egg Production</SelectItem>
                <SelectItem value="feed-consumption">Feed Consumption</SelectItem>
                <SelectItem value="dispatch-summary">Dispatch Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
           <div className="grid gap-2">
              <Label>Time Range</Label>
              <Tabs defaultValue={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
                  <TabsList className="grid w-full grid-cols-4 h-9">
                      <TabsTrigger value="day" className="h-7 text-xs">Day</TabsTrigger>
                      <TabsTrigger value="week" className="h-7 text-xs">Week</TabsTrigger>
                      <TabsTrigger value="month" className="h-7 text-xs">Month</TabsTrigger>
                      <TabsTrigger value="custom" className="h-7 text-xs">Custom</TabsTrigger>
                  </TabsList>
              </Tabs>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                  disabled={timeRange !== 'custom'}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label>Shed</Label>
            <Select value={selectedShed} onValueChange={setSelectedShed} disabled={reportType === 'dispatch-summary'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sheds</SelectItem>
                 {allSheds.map(shed => (
                    <SelectItem key={shed} value={shed}>{shed}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
            <Button className="w-full" onClick={handleGenerateReport}>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
            </Button>
        </CardFooter>
      </Card>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline">{reportTitle || "Report"}</CardTitle>
              <CardDescription>
                {reportDescription || "Select filters and generate a report."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" className="gap-1" disabled={reportData.length === 0}>
                    <Download className="h-4 w-4" />
                    PDF
                </Button>
                 <Button variant="outline" size="sm" className="gap-1" disabled={reportData.length === 0}>
                    <Download className="h-4 w-4" />
                    Excel
                </Button>
            </div>
          </CardHeader>
          <CardContent>
             {reportData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={reportData} accessibilityLayer>
                        <CartesianGrid vertical={false} />
                        <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        />
                        <YAxis 
                          label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} 
                          tickFormatter={yAxisFormatter}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                    </BarChart>
                </ChartContainer>
             ) : (
                <div className="flex h-[300px] w-full items-center justify-center text-center text-muted-foreground">
                    <p>No data to display for the selected report and filters.</p>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper functions to avoid issues with server/client time zones
const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const addMonths = (date: Date, months: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}

    