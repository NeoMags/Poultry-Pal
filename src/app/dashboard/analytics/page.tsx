import { Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart as LineChartIcon } from 'lucide-react';
import AIForecastCard from "@/components/dashboard/ai-forecast-card";
import EggCollectionTrendsCard from '@/components/dashboard/egg-collection-trends-card';
import AIFeedForecastCard from '@/components/dashboard/ai-feed-forecast-card';
import AIBrokenRateCard from '@/components/dashboard/ai-broken-rate-card';
import AIHealthAnomalyCard from '@/components/dashboard/ai-health-anomaly-card';

export default function AnalyticsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <LineChartIcon className="h-6 w-6" />
          Analytics Panel
        </CardTitle>
        <CardDescription>
          Deep dive into your farm's performance with historical trends and AI-powered forecasts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="egg-forecast">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="egg-forecast">AI Egg Forecast</TabsTrigger>
            <TabsTrigger value="collection-trends">Collection Trends</TabsTrigger>
            <TabsTrigger value="feed-forecast">AI Feed Forecast</TabsTrigger>
            <TabsTrigger value="broken-rate">AI Broken Rate</TabsTrigger>
            <TabsTrigger value="health-alerts">AI Health Alerts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="egg-forecast" className="mt-6">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <AIForecastCard />
            </Suspense>
          </TabsContent>

          <TabsContent value="collection-trends" className="mt-6">
             <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <EggCollectionTrendsCard />
            </Suspense>
          </TabsContent>

          <TabsContent value="feed-forecast" className="mt-6">
             <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <AIFeedForecastCard />
            </Suspense>
          </TabsContent>

          <TabsContent value="broken-rate" className="mt-6">
             <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <AIBrokenRateCard />
            </Suspense>
          </TabsContent>

           <TabsContent value="health-alerts" className="mt-6">
             <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <AIHealthAnomalyCard />
            </Suspense>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
