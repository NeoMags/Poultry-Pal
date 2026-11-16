

"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Egg, Package, AlertTriangle, Box, PlusCircle } from "lucide-react";
import { useFarm } from "@/context/FarmContext";
import { Button } from "../ui/button";
import AddPOSheet from "./add-po-sheet";

const StatItem = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
        <div className="text-primary">{icon}</div>
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

export default function InventorySummaryCard() {
    const { inventoryData, customerData } = useFarm();
    const [isPOSheetOpen, setIsPOSheetOpen] = React.useState(false);

    const outstandingTrays = React.useMemo(() => {
        return customerData.reduce((sum, customer) => sum + (customer.emptyTraysHeld || 0), 0);
    }, [customerData]);


    return (
        <>
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <Package className="h-6 w-6 text-primary"/>
                        Egg Inventory Summary
                    </CardTitle>
                    <CardDescription>
                        A real-time overview of your entire egg stock lifecycle.
                    </CardDescription>
                </div>
                 <Button size="sm" className="gap-1" onClick={() => setIsPOSheetOpen(true)}>
                    <PlusCircle className="h-4 w-4" />
                    Buy Eggs & Trays
                </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatItem 
                    title="Eggs in Stock" 
                    value={(inventoryData.readyStock || 0).toLocaleString()} 
                    icon={<Egg className="h-8 w-8"/>} 
                />
                <StatItem 
                    title="Broken Stock" 
                    value={(inventoryData.brokenStock || 0).toLocaleString()} 
                    icon={<AlertTriangle className="h-8 w-8"/>} 
                />
                 <StatItem 
                    title="Trays in Stock" 
                    value={(inventoryData.emptyTrays || 0).toLocaleString()} 
                    icon={<Package className="h-8 w-8"/>} 
                />
                 <StatItem 
                    title="Outstanding Trays" 
                    value={outstandingTrays.toLocaleString()} 
                    icon={<Box className="h-8 w-8"/>} 
                />
            </CardContent>
        </Card>
        <AddPOSheet isOpen={isPOSheetOpen} onOpenChange={setIsPOSheetOpen} />
        </>
    )
}
