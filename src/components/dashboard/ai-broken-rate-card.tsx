"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, BrainCircuit } from "lucide-react";
import { getBrokenRatePrediction } from "@/app/dashboard/actions";
import { Skeleton } from "@/components/ui/skeleton";

export default function AIBrokenRateCard() {
  const [prediction, setPrediction] = useState<{ predictedBrokenRate: number; analysis: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePrediction = async () => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const result = await getBrokenRatePrediction();
      if ('error' in result) {
        throw new Error(result.error);
      }
      setPrediction(result);
    } catch (e: any) {
      setError(e.message || "Failed to generate prediction.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Auto-generate on mount
  useEffect(() => {
    generatePrediction();
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle className="font-headline">AI Broken Rate Analysis</CardTitle>
            </div>
          <Button size="sm" onClick={generatePrediction} disabled={isLoading}>
            {isLoading ? "Analyzing..." : "Re-analyze"}
          </Button>
        </div>
        <CardDescription>
          Detects trends and predicts broken egg rates based on various factors.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        {isLoading && <Skeleton className="w-full h-[150px]" />}
        {error && !isLoading && <div className="text-destructive text-center">{error}</div>}
        {!isLoading && !error && prediction && (
            <div className="text-center flex flex-col items-center gap-4">
                 <div>
                    <p className="text-sm text-muted-foreground">Predicted Broken Rate</p>
                    <p className="text-4xl font-bold text-destructive">{prediction.predictedBrokenRate.toFixed(1)}%</p>
                </div>
                 <div>
                    <p className="text-sm text-muted-foreground">AI Analysis</p>
                    <p className="text-base max-w-md">{prediction.analysis}</p>
                 </div>
            </div>
        )}
         {!isLoading && !error && !prediction && (
          <div className="text-center text-muted-foreground">
            <p>Click "Re-analyze" to generate a prediction.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
