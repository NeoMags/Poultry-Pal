"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, BrainCircuit } from "lucide-react";
import { getHealthAnomalyAlerts } from "@/app/dashboard/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useFarm } from "@/context/FarmContext";

type Alert = {
    severity: 'High' | 'Medium' | 'Low';
    description: string;
}

const severityVariant = {
    High: "destructive",
    Medium: "default",
    Low: "secondary",
}

export default function AIHealthAnomalyCard() {
  const { healthData, feedConsumptionData, eggCollectionData } = useFarm();
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAlerts = async () => {
    setIsLoading(true);
    setError(null);
    setAlerts(null);
    try {
      const mortalityData = JSON.stringify(healthData.filter(h => h.eventType === 'Mortality').slice(0, 20));
      const consumptionData = JSON.stringify(feedConsumptionData.slice(0, 50));
      const eggData = JSON.stringify(eggCollectionData.slice(0, 50));

      const result = await getHealthAnomalyAlerts(mortalityData, consumptionData, eggData);
      if ('error' in result) {
        throw new Error(result.error);
      }
      setAlerts(result.alerts);
    } catch (e: any) {
      setError(e.message || "Failed to generate alerts.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    generateAlerts();
  }, []);

  const getSeverityIcon = (severity: Alert['severity']) => {
      const color = severity === 'High' ? 'text-destructive' : severity === 'Medium' ? 'text-orange-500' : 'text-yellow-500';
      return <AlertTriangle className={`h-5 w-5 ${color}`} />
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-primary" />
                <CardTitle className="font-headline">AI Health Anomaly Detection</CardTitle>
            </div>
          <Button size="sm" onClick={generateAlerts} disabled={isLoading}>
            {isLoading ? "Analyzing..." : "Re-analyze"}
          </Button>
        </div>
        <CardDescription>
          Identifies potential health issues based on mortality, feed consumption, and broken egg patterns.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center gap-4">
        {isLoading && <Skeleton className="w-full h-[150px]" />}
        {error && !isLoading && <div className="text-destructive text-center">{error}</div>}
        {!isLoading && !error && alerts && (
            alerts.length > 0 ? (
                alerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg w-full">
                        <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                        <div className="flex-1">
                            <p className="font-bold">{alert.severity} Severity Alert</p>
                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-muted-foreground text-center py-8">No health anomalies detected.</p>
            )
        )}
         {!isLoading && !error && !alerts && (
          <div className="text-center text-muted-foreground">
            <p>Click "Re-analyze" to check for health anomalies.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
