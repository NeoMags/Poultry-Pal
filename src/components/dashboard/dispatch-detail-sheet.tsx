
"use client"

import * as React from "react"
import { format } from "date-fns"
import { useFarm, Dispatch } from "@/context/FarmContext"
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
import { Banknote, Download, Package, Truck, User, Route as RouteIcon, Calendar as CalendarIcon, Hash } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

const statusVariant = {
  Delivered: "secondary",
  "In Transit": "default",
  Pending: "destructive",
} as const

interface DispatchDetailSheetProps {
    dispatch: Dispatch | null, 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void, 
}

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number | null }) => {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2">
            <div className="text-muted-foreground w-5 h-5 flex-shrink-0">{icon}</div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium text-sm leading-tight">{value}</p>
            </div>
        </div>
    )
}

export default function DispatchDetailSheet({ dispatch, isOpen, onOpenChange }: DispatchDetailSheetProps) {
    const { activeCompanyName } = useFarm();
    const { toast } = useToast();
    
    if (!dispatch) return null;
    
    const generatePdf = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text("Dispatch Note / Invoice", 14, 22);

        doc.setFontSize(12);
        doc.text(`Invoice ID: ${dispatch.invoiceId}`, 14, 32);
        doc.text(`Date: ${format(new Date(dispatch.date), "PP")}`, 14, 38);
        doc.text(`Customer: ${dispatch.customerName}`, 14, 44);
        doc.text(`From: ${activeCompanyName}`, 14, 50);

        const tableBody = dispatch.dispatchType === 'Eggs'
            ? [['Eggs', dispatch.eggs ?? '', dispatch.trays ?? '', dispatch.pricePerEgg?.toFixed(2) ?? '', dispatch.totalAmount.toFixed(2)]]
            : [['Chicks', dispatch.chickQuantity ?? '', '-', dispatch.pricePerChick?.toFixed(2) ?? '', dispatch.totalAmount.toFixed(2)]];

        autoTable(doc, {
            startY: 60,
            head: [['Item', 'Quantity', 'Trays', 'Price/Unit', 'Total']],
            body: tableBody,
            foot: [['', '', '', 'Total Amount', `${dispatch.totalAmount.toFixed(2)}`]],
            footStyles: { fontStyle: 'bold' }
        });

        doc.save(`Dispatch_${dispatch.invoiceId}.pdf`);
        toast({ title: "Success", description: "PDF has been downloaded." });
    };

    const generateExcel = () => {
        const header = [
            ["Dispatch Details"],
            ["Invoice ID", dispatch.invoiceId],
            ["Date", format(new Date(dispatch.date), "PP")],
            ["Customer", dispatch.customerName],
            ["From", activeCompanyName],
            [], // Spacer row
            ["Item", "Quantity", "Trays", "Price/Unit", "Total"]
        ];
        
        const body = dispatch.dispatchType === 'Eggs'
            ? [[ 'Eggs', dispatch.eggs, dispatch.trays, dispatch.pricePerEgg, dispatch.totalAmount ]]
            : [[ 'Chicks', dispatch.chickQuantity, '-', dispatch.pricePerChick, dispatch.totalAmount ]];

        const footer = [
            ["", "", "", "Total Amount", dispatch.totalAmount]
        ];

        const worksheet = XLSX.utils.aoa_to_sheet([...header, ...body, ...footer]);

        worksheet['!cols'] = [ { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 } ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dispatch");

        XLSX.writeFile(workbook, `Dispatch_${dispatch.invoiceId}.xlsx`);
        toast({ title: "Success", description: "Excel file has been downloaded." });
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="font-headline">Dispatch Details</SheetTitle>
                    <SheetDescription>
                        Details for Invoice: <span className="font-mono font-medium">{dispatch.invoiceId}</span>
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4 grid gap-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <InfoRow icon={<User />} label="Customer" value={dispatch.customerName} />
                        <InfoRow icon={<CalendarIcon />} label="Dispatch Date" value={format(new Date(dispatch.date), "PP")} />
                        <InfoRow icon={<Truck />} label="Driver" value={dispatch.driver} />
                        <InfoRow icon={<RouteIcon />} label="Route" value={dispatch.route} />
                        <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant={statusVariant[dispatch.status]}>{dispatch.status}</Badge>
                        </div>
                         <div>
                            <p className="text-xs text-muted-foreground">Total Amount</p>
                            <p className="font-medium font-mono text-sm">{dispatch.totalAmount.toFixed(2)}</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium mb-2">Items Dispatched</h4>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Price/Unit</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dispatch.dispatchType === 'Eggs' && (
                                        <TableRow>
                                            <TableCell>Eggs (in {dispatch.trays} trays)</TableCell>
                                            <TableCell>{dispatch.eggs}</TableCell>
                                            <TableCell>{dispatch.pricePerEgg?.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{dispatch.totalAmount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )}
                                     {dispatch.dispatchType === 'Chicks' && (
                                        <TableRow>
                                            <TableCell>{dispatch.chickType} Chicks (from Shed {dispatch.chickShed})</TableCell>
                                            <TableCell>{dispatch.chickQuantity}</TableCell>
                                            <TableCell>{dispatch.pricePerChick?.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{dispatch.totalAmount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )}
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
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};
