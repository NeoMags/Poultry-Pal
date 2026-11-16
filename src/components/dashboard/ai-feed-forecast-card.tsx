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
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { getFeedForecast } from "@/app/dashboard/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useFarm } from "@/context/FarmContext";

type ForecastData = {
  day: string;
  forecast: number;
};

export default function AIFeedForecastCard() {
  const { chickData } = useFarm();
  const [forecastData, setForecastData] = useState<ForecastData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chartConfig = {
    forecast: {
      label: "Consumption (kg)",
      color: "hsl(var(--accent))",
    },
  };

  const generateForecast = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const birdCount = chickData.reduce((acc, batch) => {
        if (batch.type === 'Chick') acc.chicks += batch.quantity;
        else if (batch.type === 'Layer') acc.layers += batch.quantity;
        else if (batch.type === 'Dated') acc.dated += batch.quantity;
        return acc;
      }, { chicks: 0, layers: 0, dated: 0 });

      const result = await getFeedForecast(birdCount);
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      const parsedForecast = JSON.parse(result.forecast);

      const formattedData: ForecastData[] = parsedForecast.map((item: any, index: number) => ({
        day: `Day ${index + 1}`,
        forecast: item.predicted_consumption_kg,
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
                <BrainCircuit className="h-6 w-6 text-accent" />
                <CardTitle className="font-headline">AI Feed Consumption Forecast</CardTitle>
            </div>
          <Button size="sm" onClick={generateForecast} disabled={isLoading}>
            {isLoading ? "Generating..." : "Regenerate"}
          </Button>
        </div>
        <CardDescription>
          Predicted feed consumption for the next 7 days based on bird count.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        {isLoading && <Skeleton className="w-full h-[250px]" />}
        {error && !isLoading && <div className="text-destructive text-center">{error}</div>}
        {!isLoading && !error && forecastData && (
          <ChartContainer config={chartConfig} className="w-full h-[250px]">
            <LineChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis />
              <Tooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                dot={true}
              />
            </LineChart>
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
