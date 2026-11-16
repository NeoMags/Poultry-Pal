"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, AreaChart } from "recharts";
import { getEggProductionForecast } from "@/app/dashboard/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useFarm } from "@/context/FarmContext";

type ForecastData = {
  day: string;
  forecast: number;
  lowerBound: number;
  upperBound: number;
};

export default function AIForecastCard() {
  const { chickData } = useFarm();
  const [forecastData, setForecastData] = useState<ForecastData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chartConfig = {
    forecast: {
      label: "Forecast",
      color: "hsl(var(--primary))",
    },
    confidence: {
      label: "Confidence Interval",
      color: "hsl(var(--primary))",
    },
  };

  const generateForecast = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currentHenCount = chickData.filter(b => b.type === 'Layer').reduce((sum, b) => sum + b.quantity, 0);

      const result = await getEggProductionForecast(currentHenCount);
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      const parsedForecast = JSON.parse(result.forecast);
      const parsedConfidence = JSON.parse(result.confidenceInterval);

      const formattedData: ForecastData[] = parsedForecast.map((item: any, index: number) => ({
        day: `Day ${index + 1}`,
        forecast: item.predicted_eggs,
        lowerBound: parsedConfidence[index].lower_bound,
        upperBound: parsedConfidence[index].upper_bound,
      }));
      setForecastData(formattedData);
    } catch (e: any) {
      setError(e.message || "Failed to generate forecast.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Auto-generate forecast on component mount
  useEffect(() => {
    generateForecast();
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-primary" />
                <CardTitle className="font-headline">AI Egg Production Forecast</CardTitle>
            </div>
          <Button size="sm" onClick={generateForecast} disabled={isLoading}>
            {isLoading ? "Generating..." : "Regenerate"}
          </Button>
        </div>
        <CardDescription>
          Predicted egg production for the next 7 days based on historical data.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        {isLoading && <Skeleton className="w-full h-[250px]" />}
        {error && !isLoading && <div className="text-destructive text-center">{error}</div>}
        {!isLoading && !error && forecastData && (
          <ChartContainer config={chartConfig} className="w-full h-[250px]">
            <AreaChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis />
              <Tooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <defs>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                dataKey="upperBound" 
                stackId="confidence" 
                stroke="0" 
                fill="hsl(var(--accent))" 
                fillOpacity={0.3} 
                type="monotone"
              />
               <Area 
                dataKey="lowerBound" 
                stackId="confidence" 
                stroke="0" 
                fill="hsl(var(--background))" 
                fillOpacity={1}
                type="monotone"
               />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={true}
              />
            </AreaChart>
          </ChartContainer>
        )}
         {!isLoading && !error && !forecastData && (
          <div className="text-center text-muted-foreground">
            <p>Click "Generate" to see the forecast.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
