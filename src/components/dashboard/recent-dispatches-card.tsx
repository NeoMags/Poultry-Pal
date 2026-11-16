
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFarm, Dispatch } from "@/context/FarmContext";

const statusVariant = {
  Delivered: "secondary",
  "In Transit": "default",
  Pending: "destructive",
};

export default function RecentDispatchesCard() {
  const { dispatchData } = useFarm();
  const router = useRouter();
  const [filter, setFilter] = React.useState<"all" | Dispatch['status']>("all");

  const filteredDispatches = React.useMemo(() => {
    if (filter === "all") {
        // Return latest 20 dispatches if filter is all
        return dispatchData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0,20);
    }
    return dispatchData.filter(d => d.status === filter)
                       .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dispatchData, filter]);

  const handleRowClick = (customerId: string) => {
    router.push(`/dashboard/customers/${customerId}`);
  };


  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="grid gap-2">
                <CardTitle className="font-headline">Dispatches Overview</CardTitle>
                <CardDescription>
                    Scrollable list of recent dispatches. Click a row to view customer.
                </CardDescription>
            </div>
            <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Recent</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Transit">In Transit</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[300px]">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredDispatches.length > 0 ? filteredDispatches.map((dispatch) => (
                <TableRow key={dispatch.invoiceId} onClick={() => handleRowClick(dispatch.customerId)} className="cursor-pointer">
                    <TableCell>
                    <div className="font-medium">{dispatch.customerName}</div>
                    </TableCell>
                    <TableCell className="text-right">
                    {dispatch.dispatchType === 'Eggs' ? `${dispatch.trays} trays` : `${dispatch.chickQuantity} chicks`}
                    </TableCell>
                    <TableCell className="text-right">
                    <Badge
                        variant={
                        statusVariant[
                            dispatch.status as keyof typeof statusVariant
                        ] as any
                        }
                        className="capitalize"
                    >
                        {dispatch.status}
                    </Badge>
                    </TableCell>
                </TableRow>
                )) : (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        No dispatches found for this filter.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
