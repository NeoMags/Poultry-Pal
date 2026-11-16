
"use client"

import { Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EggIcon } from "@/components/icons";
import { IndianRupee, Wheat, ArrowUpRight, Bird } from "lucide-react";
import StatCard from "@/components/dashboard/stat-card";
import AIForecastCard from "@/components/dashboard/ai-forecast-card";
import RecentDispatchesCard from "@/components/dashboard/recent-dispatches-card";
import { Skeleton } from '@/components/ui/skeleton';
import ProductionHistoryCard from '@/components/dashboard/production-history-card';
import AlertsCard from '@/components/dashboard/alerts-card';
import PendingTasksCard from '@/components/dashboard/pending-tasks-card';
import QuickActionsCard from '@/components/dashboard/quick-actions-card';
import { useFarm } from '@/context/FarmContext';
import { useMemo } from 'react';
import InventorySummaryCard from '@/components/dashboard/inventory-summary-card';
import { subMonths, startOfMonth, endOfMonth, parseISO, subDays, format } from 'date-fns';

export default function DashboardPage() {
  const { 
    todaysTotalEggCollection, 
    isLoading,
    chickData,
    paymentData,
    feedStockData,
    eggCollectionData,
  } = useFarm();

  const { totalHens, henChangeDescription } = useMemo(() => {
    if (isLoading) return { totalHens: 0, henChangeDescription: "..." };
    
    const currentTotal = chickData.reduce((sum, batch) => sum + batch.quantity, 0);

    const today = new Date();
    const lastMonthStart = startOfMonth(subMonths(today, 1));
    const lastMonthEnd = endOfMonth(subMonths(today, 1));

    const hensAddedLastMonth = chickData
        .filter(batch => {
            const procurementDate = parseISO(batch.procurementDate);
            return procurementDate >= lastMonthStart && procurementDate <= lastMonthEnd;
        })
        .reduce((sum, batch) => sum + batch.quantity, 0);
    
    let description = "No data for last month";
    if (hensAddedLastMonth > 0) {
        const change = ((currentTotal - hensAddedLastMonth) / hensAddedLastMonth) * 100;
        if (isFinite(change)) {
            description = `${change >= 0 ? '+' : ''}${change.toFixed(1)}% from last month`;
        }
    }
    
    return { totalHens: currentTotal, henChangeDescription: description };

  }, [chickData, isLoading]);
  
  const eggChangeDescription = useMemo(() => {
    if (isLoading) return "...";
    
    const yesterday = subDays(new Date(), 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    const yesterdaysTotal = eggCollectionData
        .filter(log => log.date === yesterdayStr)
        .reduce((sum, log) => sum + log.total, 0);
        
    if (yesterdaysTotal === 0) {
        return "No data for yesterday";
    }

    const change = ((todaysTotalEggCollection - yesterdaysTotal) / yesterdaysTotal) * 100;
    
    if (isFinite(change)) {
        return `${change >= 0 ? '+' : ''}${change.toFixed(1)}% from yesterday`;
    }

    return "No change from yesterday";

  }, [todaysTotalEggCollection, eggCollectionData, isLoading]);

  const totalRevenue = useMemo(() => {
    if (isLoading) return 0;
    return paymentData
        .filter(p => p.customerId) // Only inward payments
        .reduce((sum, p) => sum + p.amount, 0);
  }, [paymentData, isLoading]);

  const feedStockPercentage = useMemo(() => {
    if (isLoading) return 0;
    const feedIngredients = feedStockData.filter(item => item.category === 'Feed Ingredient');
    const currentStock = feedIngredients.reduce((sum, item) => {
        // Simple assumption: 1 unit = 1 kg for percentage calculation
        const stockInKg = (item.unit === 'g' || item.unit === 'ml') ? item.stock / 1000 : item.stock;
        return sum + stockInKg;
    }, 0);
    // Arbitrary total capacity for percentage view, e.g., 20000 kg
    const totalCapacity = 20000;
    if (totalCapacity === 0) return 0;
    return Math.min(100, Math.round((currentStock / totalCapacity) * 100));
  }, [feedStockData, isLoading]);


  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Hens"
          value={isLoading ? "..." : totalHens.toLocaleString()}
          icon={<Bird className="h-6 w-6 text-muted-foreground" />}
          description={henChangeDescription}
        />
        <StatCard
          title="Total Revenue"
          value={isLoading ? '...' : `${totalRevenue.toLocaleString()}`}
          icon={<IndianRupee className="h-6 w-6 text-muted-foreground" />}
          description="Total inward payments"
        />
        <StatCard
          title="Feed Stock"
          value={isLoading ? "..." : `${feedStockPercentage}%`}
          icon={<Wheat className="h-6 w-6 text-muted-foreground" />}
          description="Feed ingredient capacity"
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Egg Collection</CardTitle>
            <EggIcon className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <div className="text-2xl font-bold">{todaysTotalEggCollection.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">{eggChangeDescription}</p>
          </CardContent>
        </Card>
      </div>
       <Suspense fallback={<Skeleton className="h-[150px] w-full" />}>
          <InventorySummaryCard />
        </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left & Middle Columns */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Suspense fallback={<Skeleton className="h-[350px] w-full" />}>
            <AIForecastCard />
          </Suspense>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Suspense fallback={<Skeleton className="h-[350px] w-full" />}>
              <ProductionHistoryCard />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <RecentDispatchesCard />
            </Suspense>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <AlertsCard />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-[250px] w-full" />}>
            <PendingTasksCard />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-[250px] w-full" />}>
            <QuickActionsCard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
