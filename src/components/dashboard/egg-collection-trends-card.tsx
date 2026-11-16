"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { TrendingUp } from "lucide-react";

// Mock data for historical egg collection trends
const chartData = [
  { month: "May", totalEggs: 285030 },
  { month: "Jun", totalEggs: 295410 },
  { month: "Jul", totalEggs: 310890 },
  { month: "Aug", totalEggs: 305675 },
  { month: "Sep", totalEggs: 320120 },
  { month: "Oct", totalEggs: 327768 },
]

const chartConfig = {
  totalEggs: {
    label: "Total Eggs",
    color: "hsl(var(--primary))",
  },
}

export default function EggCollectionTrendsCard() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline">Historical Egg Collection</CardTitle>
        </div>
        <CardDescription>
          Monthly egg collection totals over the last six months.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        <ChartContainer config={chartConfig} className="w-full h-[250px]">
            <BarChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `${value / 1000}k`}
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
