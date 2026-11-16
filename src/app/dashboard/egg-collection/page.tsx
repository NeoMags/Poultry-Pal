
"use client"

import * as React from "react"
import { format } from "date-fns"
import { History, Egg } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useFarm } from "@/context/FarmContext"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import InventorySummaryCard from "@/components/dashboard/inventory-summary-card"
import { Suspense } from "react"

export default function EggCollectionPage() {
  const { eggCollectionData, isLoading } = useFarm()
  
  const sortedCollectionHistory = React.useMemo(() => {
    return [...eggCollectionData].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [eggCollectionData]);

  return (
    <div className="flex flex-col gap-6">
        <Suspense fallback={<Skeleton className="h-[150px] w-full" />}>
          <InventorySummaryCard />
        </Suspense>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <History className="h-6 w-6"/>
                    Global Collection History
                </CardTitle>
                <CardDescription>
                    A log of all past egg collections from every shed.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Shed</TableHead>
                            <TableHead className="text-right">Large</TableHead>
                            <TableHead className="text-right">Medium</TableHead>
                            <TableHead className="text-right">Small</TableHead>
                            <TableHead className="text-right">Damaged</TableHead>
                            <TableHead className="text-right font-bold">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({length: 5}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={7}><Skeleton className="h-8 w-full"/></TableCell>
                                </TableRow>
                            ))
                        ) : sortedCollectionHistory.length > 0 ? (
                            sortedCollectionHistory.map(log => (
                                <TableRow key={log.logId}>
                                    <TableCell>{format(new Date(log.date), "PP")}</TableCell>
                                    <TableCell>{log.shed}</TableCell>
                                    <TableCell className="text-right">{log.large.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{log.medium.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{log.small.toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-destructive">{log.damaged.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-bold">{log.total.toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No collection history found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
