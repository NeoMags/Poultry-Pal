
"use client"

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp } from "lucide-react";
import { useFarm } from "@/context/FarmContext";
import { subMonths, format, startOfMonth, subDays, startOfWeek, getWeek, parseISO } from 'date-fns';

const chartConfig = {
  totalEggs: {
    label: "Total Eggs",
    color: "hsl(var(--primary))",
  },
}

export default function ProductionHistoryCard() {
  const { eggCollectionData } = useFarm();
  const [timeRange, setTimeRange] = React.useState<"day" | "week" | "month">("month");

  const chartData = React.useMemo(() => {
    const data: { [key: string]: number } = {};
    const now = new Date();

    if (timeRange === "day") {
        const sevenDaysAgo = startOfDay(subDays(now, 6));
        for (let i = 0; i < 7; i++) {
            const date = addDays(sevenDaysAgo, i);
            const dateKey = format(date, 'MMM d');
            data[dateKey] = 0;
        }

        eggCollectionData.forEach(log => {
            const logDate = parseISO(log.date);
            if (logDate >= sevenDaysAgo) {
                const dateKey = format(logDate, 'MMM d');
                data[dateKey] = (data[dateKey] || 0) + log.total;
            }
        });

    } else if (timeRange === "week") {
        const eightWeeksAgo = startOfWeek(subDays(now, 7 * 7));
        for (let i = 0; i < 8; i++) {
            const weekStart = addDays(eightWeeksAgo, i * 7);
            const weekKey = `W${getWeek(weekStart)}`;
            data[weekKey] = 0;
        }

        eggCollectionData.forEach(log => {
            const logDate = parseISO(log.date);
            if (logDate >= eightWeeksAgo) {
                const weekKey = `W${getWeek(logDate)}`;
                if (weekKey in data) {
                    data[weekKey] = (data[weekKey] || 0) + log.total;
                }
            }
        });
    } else { // month
        const sixMonthsAgo = startOfMonth(subMonths(now, 5));
        for (let i = 0; i < 6; i++) {
            const monthKey = format(addMonths(sixMonthsAgo, i), 'MMM');
            data[monthKey] = 0;
        }

        eggCollectionData.forEach(log => {
            const logDate = parseISO(log.date);
            if (logDate >= sixMonthsAgo) {
                const month = format(logDate, 'MMM');
                if (month in data) {
                    data[month] = (data[month] || 0) + log.total;
                }
            }
        });
    }

    return Object.entries(data).map(([name, totalEggs]) => ({ name, totalEggs }));

  }, [eggCollectionData, timeRange]);
  
  const yAxisFormatter = (value: number) => {
    if (value >= 1000) {
      return `${value / 1000}k`;
    }
    return value.toString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <CardTitle className="font-headline">Production History</CardTitle>
            </div>
             <Tabs defaultValue="month" onValueChange={(value) => setTimeRange(value as any)} className="w-[200px]">
                <TabsList className="grid w-full grid-cols-3 h-9">
                    <TabsTrigger value="day" className="h-7 text-xs">Day</TabsTrigger>
                    <TabsTrigger value="week" className="h-7 text-xs">Week</TabsTrigger>
                    <TabsTrigger value="month" className="h-7 text-xs">Month</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
        <CardDescription>
          Toggle between daily, weekly, and monthly collection totals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full h-[250px]">
            <BarChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  className="text-xs"
                />
                <YAxis
                  tickFormatter={yAxisFormatter}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="totalEggs" fill="var(--color-totalEggs)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


// Helper functions to avoid issues with server/client time zones
const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

const addMonths = (date: Date, months: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}
