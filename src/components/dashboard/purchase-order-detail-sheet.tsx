

"use client"

import * as React from "react"
import { format } from "date-fns"
import { useFarm, PurchaseOrder } from "@/context/FarmContext"
import { useToast } from "@/hooks/use-toast"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
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
import { Banknote, Download } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

const statusVariant = {
  Paid: "secondary",
  Pending: "destructive",
}

interface PurchaseOrderDetailSheetProps {
    po: PurchaseOrder | null, 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void, 
    onLogPaymentClick: (po: PurchaseOrder) => void
}

export default function PurchaseOrderDetailSheet({ po, isOpen, onOpenChange, onLogPaymentClick }: PurchaseOrderDetailSheetProps) {
    const { suppliersData, activeCompanyName } = useFarm();
    const { toast } = useToast();
    
    if (!po) return null;

    const supplierName = suppliersData.find(s => s.id === po.supplierId)?.name || 'N/A';
    
    const generatePdf = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text("Purchase Order", 14, 22);

        doc.setFontSize(12);
        doc.text(`PO ID: ${po.id}`, 14, 32);
        doc.text(`Date: ${format(new Date(po.date), "PP")}`, 14, 38);
        doc.text(`Supplier: ${supplierName}`, 14, 44);
        doc.text(`To: ${activeCompanyName}`, 14, 50);

        autoTable(doc, {
            startY: 60,
            head: [['Item', 'Category', 'Quantity', 'Unit', 'Cost/Unit', 'Total']],
            body: po.items.map(item => [
                item.name,
                item.category,
                item.quantity,
                item.unit,
                `${item.costPerUnit.toFixed(2)}`,
                `${(item.quantity * item.costPerUnit).toFixed(2)}`
            ]),
            foot: [['', '', '', '', 'Total Amount', `${po.totalAmount.toFixed(2)}`]],
            footStyles: { fontStyle: 'bold' }
        });

        doc.save(`PO_${po.id}.pdf`);
        toast({ title: "Success", description: "PDF has been downloaded." });
    };

    const generateExcel = () => {
        const header = [
            ["Purchase Order Details"],
            ["PO ID", po.id],
            ["Date", format(new Date(po.date), "PP")],
            ["Supplier", supplierName],
            ["To", activeCompanyName],
            [], // Spacer row
            ["Item", "Category", "Quantity", "Unit", "Cost/Unit", "Total"]
        ];
        
        const body = po.items.map(item => [
            item.name,
            item.category,
            item.quantity,
            item.unit,
            item.costPerUnit,
            item.quantity * item.costPerUnit
        ]);

        const footer = [
            ["", "", "", "", "Total Amount", po.totalAmount]
        ];

        const worksheet = XLSX.utils.aoa_to_sheet([...header, ...body, ...footer]);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Order");

        XLSX.writeFile(workbook, `PO_${po.id}.xlsx`);
        toast({ title: "Success", description: "Excel file has been downloaded." });
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Purchase Order Details</SheetTitle>
                    <SheetDescription>
                        Details for PO: <span className="font-mono font-medium">{po.id}</span>
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4 grid gap-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Supplier</p>
                            <p className="font-medium">{supplierName}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">PO Date</p>
                            <p className="font-medium">{format(new Date(po.date), "PP")}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Status</p>
                            <Badge variant={statusVariant[po.status]}>{po.status}</Badge>
                        </div>
                         <div>
                            <p className="text-muted-foreground">Total Amount</p>
                            <p className="font-medium font-mono">{po.totalAmount.toFixed(2)}</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium mb-2">Items</h4>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Cost/Unit</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {po.items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell>{item.quantity} {item.unit}</TableCell>
                                            <TableCell>{item.costPerUnit.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{(item.quantity * item.costPerUnit).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
                <SheetFooter className="flex-col sm:flex-row sm:justify-between items-center gap-2">
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={generatePdf}><Download className="mr-2 h-4 w-4" />PDF</Button>
                        <Button variant="outline" size="sm" onClick={generateExcel}><Download className="mr-2 h-4 w-4" />Excel</Button>
                    </div>
                    {po.status === 'Pending' && (
                        <Button onClick={() => { onOpenChange(false); onLogPaymentClick(po); }}>
                            <Banknote className="mr-2 h-4 w-4"/> Log Payment
                        </Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};
