

"use client"

import * as React from "react"
import { format } from "date-fns"
import { useFarm, PurchaseOrder, Payment } from "@/context/FarmContext"
import { useToast } from "@/hooks/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Receipt, Banknote, ArrowUpDown } from "lucide-react"
import LogPaymentSheet from "@/components/dashboard/log-payment-sheet"
import PurchaseOrderDetailSheet from "@/components/dashboard/purchase-order-detail-sheet"


const statusVariant = {
  Paid: "secondary",
  Pending: "destructive",
} as const

type SortKey = keyof PurchaseOrder | 'supplierName';
type SortDirection = "asc" | "desc";


export default function PurchaseOrdersPage() {
    const { purchaseOrders, suppliersData } = useFarm();
    const [selectedPoForPayment, setSelectedPoForPayment] = React.useState<PurchaseOrder | null>(null);
    const [selectedPoForView, setSelectedPoForView] = React.useState<PurchaseOrder | null>(null);
    const [isPaymentSheetOpen, setIsPaymentSheetOpen] = React.useState(false);

    // State for filtering and sorting
    const [filterStatus, setFilterStatus] = React.useState("all");
    const [filterSupplier, setFilterSupplier] = React.useState("all");
    const [sortKey, setSortKey] = React.useState<SortKey>("date");
    const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");

    const getSupplierName = (supplierId: string) => {
        return suppliersData.find(s => s.id === supplierId)?.name || 'N/A';
    };
    
    const handleLogPaymentClick = (po: PurchaseOrder) => {
        setSelectedPoForPayment(po);
        setIsPaymentSheetOpen(true);
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };
    
    const SortableHeader = ({ sortKey: key, children }: { sortKey: SortKey, children: React.ReactNode }) => (
     <TableHead onClick={() => handleSort(key)} className="cursor-pointer hover:bg-muted">
        <div className="flex items-center gap-2">
            {children}
            {sortKey === key && <ArrowUpDown className="h-4 w-4" />}
        </div>
    </TableHead>
    );

    const processedPOs = React.useMemo(() => {
        return purchaseOrders
            .filter(po => {
                const statusMatch = filterStatus === 'all' || po.status === filterStatus;
                const supplierMatch = filterSupplier === 'all' || po.supplierId === filterSupplier;
                return statusMatch && supplierMatch;
            })
            .sort((a, b) => {
                let valA: unknown;
                let valB: unknown;

                if (sortKey === 'supplierName') {
                    valA = getSupplierName(a.supplierId);
                    valB = getSupplierName(b.supplierId);
                } else if (sortKey === 'date') {
                    valA = new Date(a.date).getTime();
                    valB = new Date(b.date).getTime();
                } else {
                    valA = a[sortKey as keyof PurchaseOrder];
                    valB = b[sortKey as keyof PurchaseOrder];
                }

                if (typeof valA === 'string' && typeof valB === 'string') {
                    return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
                 if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortDirection === 'asc' ? valA - valB : valB - valA;
                }
                return 0;
            });

    }, [purchaseOrders, filterStatus, filterSupplier, sortKey, sortDirection]);

    React.useEffect(() => {
        if (!isPaymentSheetOpen) {
            setSelectedPoForPayment(null);
        }
    }, [isPaymentSheetOpen]);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <Receipt className="h-6 w-6"/>
                        Purchase Orders
                    </CardTitle>
                    <CardDescription>
                        Manage pending and completed purchase orders for stock items. Click a row to see details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                            </SelectContent>
                        </Select>
                         <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Supplier" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Suppliers</SelectItem>
                                {suppliersData.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHeader sortKey="id">PO ID</SortableHeader>
                                <SortableHeader sortKey="date">Date</SortableHeader>
                                <SortableHeader sortKey="supplierName">Supplier</SortableHeader>
                                <TableHead>Items</TableHead>
                                <SortableHeader sortKey="totalAmount">Total Amount</SortableHeader>
                                <SortableHeader sortKey="status">Status</SortableHeader>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processedPOs.map(po => (
                                <TableRow key={po.id} onClick={() => setSelectedPoForView(po)} className="cursor-pointer">
                                    <TableCell className="font-medium">{po.id}</TableCell>
                                    <TableCell>{format(new Date(po.date), "PP")}</TableCell>
                                    <TableCell>{getSupplierName(po.supplierId)}</TableCell>
                                    <TableCell>{po.items.length}</TableCell>
                                    <TableCell className="text-right font-mono">{po.totalAmount.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={statusVariant[po.status]}>{po.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {po.status === 'Pending' && (
                                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleLogPaymentClick(po); }}>
                                                <Banknote className="mr-2 h-4 w-4"/>
                                                Log Payment
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {processedPOs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No purchase orders found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <LogPaymentSheet
                isOpen={isPaymentSheetOpen}
                onOpenChange={setIsPaymentSheetOpen}
                defaultPoId={selectedPoForPayment?.id}
            />
            <PurchaseOrderDetailSheet
                po={selectedPoForView}
                isOpen={!!selectedPoForView}
                onOpenChange={(open) => { if (!open) setSelectedPoForView(null) }}
                onLogPaymentClick={handleLogPaymentClick}
            />
        </>
    )
}
