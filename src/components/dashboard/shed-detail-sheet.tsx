

"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useFarm, Shed, Chick, HealthEntry } from "@/context/FarmContext";
import { Bird, Pill, Warehouse, TestTube2, AlertTriangle, Wheat, Clock, Egg } from "lucide-react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

interface ExtendedShed extends Shed {
    henCount: number;
    consumptionRateKgPerHour: number;
}

interface ShedDetailSheetProps {
  shed: ExtendedShed | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const eventTypeVariant = {
  Vaccination: "secondary",
  Medication: "default",
  Mortality: "destructive",
  "Check-up": "outline",
};

const formatAge = (days: number) => {
    if (isNaN(days) || days < 0) return "-";
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    let result = `${days} day${days !== 1 ? 's' : ''}`;
    if (weeks > 0) {
        result += ` (~${weeks}w`;
        if (remainingDays > 0) {
            result += ` ${remainingDays}d`;
        }
        result += ')';
    }
    return result;
}

const formatDuration = (hours: number): string => {
  if (isNaN(hours) || hours <= 0) return "N/A";

  const totalHours = Math.floor(hours);
  const remainingMinutes = Math.round((hours - totalHours) * 60);

  let result = '';
  if (totalHours > 0) {
    result += `${totalHours} hr${totalHours > 1 ? 's' : ''}`;
  }
  if (remainingMinutes > 0) {
    if (totalHours > 0) result += ' ';
    result += `${remainingMinutes} min${remainingMinutes > 1 ? 's' : ''}`;
  }
  
  if (!result) {
    return 'Less than a minute';
  }

  return result.trim();
};


export default function ShedDetailSheet({ shed, isOpen, onOpenChange }: ShedDetailSheetProps) {
  const { chickData, healthData, feedConsumptionData, feedMixes, feedStockData, eggCollectionData } = useFarm();

  const batchesInShed = React.useMemo(() => {
    if (!shed) return [];
    return chickData.filter((batch) => batch.shed === shed.name);
  }, [shed, chickData]);

  const healthHistoryForShed = React.useMemo(() => {
    if (!shed) return [];
    const batchIdsInShed = batchesInShed.map(b => b.batchId);
    return healthData
      .filter(h => batchIdsInShed.includes(h.batchId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [shed, batchesInShed, healthData]);

  const consumptionHistoryForShed = React.useMemo(() => {
    if (!shed) return [];
    return feedConsumptionData
      .filter(log => log.shed === shed.name)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [shed, feedConsumptionData]);
  
  const mortalityRate = React.useMemo(() => {
    if (!shed || batchesInShed.length === 0) return 0;

    const initialQuantities = batchesInShed.reduce((acc, batch) => {
        const mortalities = healthHistoryForShed
            .filter(h => h.batchId === batch.batchId && h.eventType === 'Mortality')
            .reduce((sum, h) => sum + h.quantity, 0);
        acc[batch.batchId] = batch.quantity + mortalities;
        return acc;
    }, {} as Record<string, number>);

    const totalInitial = Object.values(initialQuantities).reduce((sum, qty) => sum + qty, 0);
    const totalMortalities = healthHistoryForShed
        .filter(h => h.eventType === 'Mortality')
        .reduce((sum, h) => sum + h.quantity, 0);

    if (totalInitial === 0) return 0;
    return (totalMortalities / totalInitial) * 100;
  }, [shed, batchesInShed, healthHistoryForShed]);

   const eggHistoryForShed = React.useMemo(() => {
    if (!shed) return [];
    return eggCollectionData
      .filter((log) => log.shed === shed.name)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [shed, eggCollectionData]);


  if (!shed) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-headline text-2xl">
            <Warehouse className="h-7 w-7" />
            Shed Details: {shed.name}
          </SheetTitle>
          <SheetDescription>
            Detailed view of all batches and activities in this shed.
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="batches" className="py-6">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="batches">Batches</TabsTrigger>
                <TabsTrigger value="health">Health</TabsTrigger>
                <TabsTrigger value="consumption">Consumption</TabsTrigger>
                <TabsTrigger value="eggs">Egg History</TabsTrigger>
            </TabsList>
            <TabsContent value="batches" className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Bird className="h-5 w-5 text-primary" />
                    Current Batches ({batchesInShed.length})
                  </h3>
                  <div className="text-right">
                    <p className="text-sm font-medium">Mortality Rate</p>
                    <p className="text-sm text-destructive font-semibold">{mortalityRate.toFixed(2)}%</p>
                  </div>
                </div>
                {batchesInShed.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Batch ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {batchesInShed.map((batch) => (
                            <TableRow key={batch.batchId}>
                                <TableCell className="font-medium">{batch.batchId}</TableCell>
                                <TableCell><Badge variant="outline">{batch.type}</Badge></TableCell>
                                <TableCell>{formatAge(batch.age)}</TableCell>
                                <TableCell className="text-right">{batch.quantity.toLocaleString()}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground p-4 text-center border rounded-md">
                        No batches currently in this shed.
                    </p>
                )}
            </TabsContent>
             <TabsContent value="health" className="mt-4">
                 <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                    <Pill className="h-5 w-5 text-primary" />
                    Health & Vaccination History
                </h3>
                {healthHistoryForShed.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Batch</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {healthHistoryForShed.map((log) => (
                                <TableRow key={log.logId}>
                                    <TableCell>{format(new Date(log.date), "PP")}</TableCell>
                                    <TableCell>{log.batchId}</TableCell>
                                    <TableCell>
                                    <Badge variant={eventTypeVariant[log.eventType as keyof typeof eventTypeVariant] as any}>
                                        {log.eventType}
                                    </Badge>
                                    </TableCell>
                                    <TableCell>{log.details}{log.quantity > 0 ? ` (${log.quantity})` : ''}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground p-4 text-center border rounded-md">
                        No health records for the batches in this shed.
                    </p>
                )}
             </TabsContent>
             <TabsContent value="consumption" className="mt-4">
                 <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                    <Wheat className="h-5 w-5 text-primary" />
                    Consumption History
                </h3>
                {consumptionHistoryForShed.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {consumptionHistoryForShed.map((log) => {
                            let itemName = "N/A";
                                if (log.consumptionType === 'FeedMix') {
                                    const mix = feedMixes.find(m => m.id === log.itemId);
                                    itemName = mix?.name || "Deleted Mix";
                                } else if (log.consumptionType === 'Health') {
                                    const stock = feedStockData.find(s => s.id === log.itemId);
                                    itemName = stock?.name || "Deleted Item";
                                }
                            return (
                            <TableRow key={log.logId}>
                                <TableCell>{format(new Date(log.date), "PP")}</TableCell>
                                <TableCell>
                                    <Badge variant={log.consumptionType === 'FeedMix' ? 'default' : 'secondary'}>
                                    {log.consumptionType === 'FeedMix' ? 'Feed' : 'Health'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{itemName}</TableCell>
                                <TableCell className="text-right">{log.quantity} {log.unit}</TableCell>
                            </TableRow>
                            );
                        })}
                        </TableBody>
                    </Table>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground p-4 text-center border rounded-md">
                    No consumption logs for this shed.
                    </p>
                )}
             </TabsContent>
             <TabsContent value="eggs" className="mt-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                    <Egg className="h-5 w-5 text-primary" />
                    Egg Collection History
                </h3>
                {eggHistoryForShed.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Large</TableHead>
                                <TableHead className="text-right">Medium</TableHead>
                                <TableHead className="text-right">Small</TableHead>
                                <TableHead className="text-right">Damaged</TableHead>
                                <TableHead className="text-right font-bold">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {eggHistoryForShed.map((log) => (
                                <TableRow key={log.logId}>
                                    <TableCell>{format(new Date(log.date), "PP")}</TableCell>
                                    <TableCell className="text-right">{log.large.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{log.medium.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{log.small.toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-destructive">{log.damaged.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-bold">{log.total.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground p-4 text-center border rounded-md">
                        No egg collection history for this shed.
                    </p>
                )}
             </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
