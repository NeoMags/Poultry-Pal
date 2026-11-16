

"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
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
import { useFarm, FeedStock, FeedConsumptionLog, FeedMix } from "@/context/FarmContext";
import { Package, ShoppingCart, TestTube2, Wheat } from "lucide-react";
import { Badge } from "../ui/badge";

interface AggregatedItem {
    id: string;
    name: string;
    category: string;
    subCategory: string;
    unit: string;
    quantity: number;
    masterId?: string;
}

interface InventoryItemDetailSheetProps {
  item: AggregatedItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const getItemName = (log: FeedConsumptionLog, feedMixes: FeedMix[], feedStockData: FeedStock[]): string => {
    if (log.consumptionType === 'FeedMix') {
        const mix = feedMixes.find(m => m.id === log.itemId);
        return mix?.name || "Deleted Mix";
    } else { // 'Health'
        const stock = feedStockData.find(s => s.id === log.itemId);
        return stock?.name || "Deleted Item";
    }
}

export default function InventoryItemDetailSheet({ item, isOpen, onOpenChange }: InventoryItemDetailSheetProps) {
    const { feedStockData, feedConsumptionData, feedMixes, itemMaster } = useFarm();

    const purchaseHistory = React.useMemo(() => {
        if (!item || item.category === 'Eggs' || item.category === 'Packaging') return [];
        return feedStockData
            .filter(fs => fs.name.toLowerCase() === item.name.toLowerCase())
            .sort((a,b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    }, [item, feedStockData]);

    const consumptionHistory = React.useMemo(() => {
        if (!item || item.category === 'Eggs' || item.category === 'Packaging') return [];
        
        // Find all feed mixes that contain this ingredient
        const mixesWithItem = feedMixes.filter(mix => 
            mix.composition.some(ing => {
                const masterItem = itemMaster.find(mi => mi.id === ing.itemMasterId);
                return masterItem?.name.toLowerCase() === item.name.toLowerCase();
            })
        ).map(mix => mix.id);

        return feedConsumptionData.filter(log => {
            if (log.consumptionType === 'Health') {
                 const stockItem = feedStockData.find(fs => fs.id === log.itemId);
                 return stockItem?.name.toLowerCase() === item.name.toLowerCase();
            }
            if (log.consumptionType === 'FeedMix' && mixesWithItem.includes(log.itemId)) {
                return true;
            }
            return false;
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [item, feedConsumptionData, feedMixes, feedStockData, itemMaster]);

    if (!item) return null;

    const isSimpleItem = item.category === 'Eggs' || item.category === 'Packaging';

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Package className="h-7 w-7" />
                        {item.name}
                    </SheetTitle>
                    <SheetDescription>
                        Details for <span className="font-medium">{item.name}</span>. 
                        Current Stock: <span className="font-bold">{item.quantity.toLocaleString()} {item.unit}</span>
                    </SheetDescription>
                </SheetHeader>

                {isSimpleItem ? (
                     <div className="py-6 text-center text-muted-foreground">
                        Detailed history is not available for this item category.
                    </div>
                ) : (
                    <Tabs defaultValue="purchases" className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="purchases">
                                <ShoppingCart className="mr-2 h-4 w-4" /> Purchase History
                            </TabsTrigger>
                            <TabsTrigger value="consumption">
                                <Wheat className="mr-2 h-4 w-4" /> Consumption History
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="purchases" className="mt-4">
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead>PO ID</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purchaseHistory.length > 0 ? (
                                            purchaseHistory.map(p => (
                                                <TableRow key={p.id}>
                                                    <TableCell>{format(parseISO(p.purchaseDate), "PP")}</TableCell>
                                                    <TableCell>{p.supplier}</TableCell>
                                                    <TableCell>{p.purchaseOrderId}</TableCell>
                                                    <TableCell className="text-right">{p.stock.toLocaleString()} {p.unit}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">No purchase history found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                        <TabsContent value="consumption" className="mt-4">
                             <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Shed</TableHead>
                                            <TableHead>Item</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {consumptionHistory.length > 0 ? (
                                            consumptionHistory.map(log => (
                                                <TableRow key={log.logId}>
                                                    <TableCell>{format(parseISO(log.date), "PP")}</TableCell>
                                                    <TableCell>{log.shed}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={log.consumptionType === 'FeedMix' ? 'default' : 'secondary'}>{log.consumptionType === 'FeedMix' ? 'Feed' : 'Health'}</Badge>
                                                            <span>{getItemName(log, feedMixes, feedStockData)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">{log.quantity.toLocaleString()} {log.unit}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">No consumption history found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </SheetContent>
        </Sheet>
    )
}
