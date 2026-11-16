

"use client"

import * as React from "react";
import { format, parseISO } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useFarm, Expense, Payment, CreditNote, DebitNote } from "@/context/FarmContext";
import { Banknote, Building, Calendar, Download, FileText, Hash, Info, Landmark, MessageSquare, Receipt, User, Wallet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";


type Transaction = Expense | Payment | CreditNote | DebitNote;

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const InfoRow = ({ icon, label, value, children }: { icon: React.ReactNode, label: string, value?: string | number | null, children?: React.ReactNode }) => {
    if (!value && !children) return null;
    return (
        <div className="flex items-start">
            <div className="text-muted-foreground w-6 h-6 flex-shrink-0 pt-0.5">{icon}</div>
            <div className="ml-2">
              <p className="font-medium text-sm leading-none">{label}</p>
              {value && <p className="text-sm text-muted-foreground">{value}</p>}
              {children && <div className="text-sm text-muted-foreground">{children}</div>}
            </div>
        </div>
    )
}

const getTransactionType = (transaction: Transaction) => {
    if ('category' in transaction) return 'Expense';
    if ('method' in transaction) return 'Payment';
    if ('entityType' in transaction && 'reason' in transaction) {
      if ('amount' in transaction && transaction.amount > 0) {
        // Simple check, could be more robust
         const id = (transaction as any).id || '';
         if (id.startsWith('DN')) return 'Debit Note';
         if (id.startsWith('CN')) return 'Credit Note';
      }
    }
    // Fallback based on properties for older data
    if ((transaction as CreditNote).entityId && (transaction as CreditNote).reason) return 'Credit Note';
    if ((transaction as DebitNote).entityId && (transaction as DebitNote).reason) return 'Debit Note';

    return 'Transaction';
};

export default function TransactionDetailSheet({ transaction, isOpen, onOpenChange }: TransactionDetailSheetProps) {
    const { suppliersData, customerData, staffData, bankAccounts, purchaseOrders, activeCompanyName } = useFarm();
    const { toast } = useToast();

    if (!transaction) return null;

    const transactionType = getTransactionType(transaction);
    const date = 'date' in transaction ? format(parseISO(transaction.date), "PPpp") : 'N/A';
    
    let title = "Transaction Details";
    let details = <></>;
    let pdfData: { head: string[][], body: (string | number)[][], foot?: string[][] } | null = null;
    let excelData: (string | number)[][] = [];
    let fileName = `Transaction_${transaction.id}`;

    const generatePdf = () => {
        if (!pdfData) return;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text(title, 14, 22);

        autoTable(doc, {
            startY: 30,
            head: pdfData.head,
            body: pdfData.body,
            foot: pdfData.foot,
            footStyles: { fontStyle: 'bold' }
        });

        doc.save(`${fileName}.pdf`);
        toast({ title: "Success", description: "PDF has been downloaded." });
    };
    
    const generateExcel = () => {
        if (excelData.length === 0) return;
        const worksheet = XLSX.utils.aoa_to_sheet(excelData);
        worksheet['!cols'] = [ { wch: 20 }, { wch: 40 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transaction");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        toast({ title: "Success", description: "Excel file has been downloaded." });
    };


    if (transactionType === 'Expense' && 'category' in transaction) {
        title = `Expense: ${transaction.id}`;
        fileName = `Expense_${transaction.id}`;
        details = (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-2 py-4">
                <InfoRow icon={<Calendar />} label="Date" value={date} />
                <InfoRow icon={<Info />} label="Category" value={transaction.category} />
                <InfoRow icon={<Banknote />} label="Amount" value={`${transaction.amount.toFixed(2)}`} />
                <InfoRow icon={<MessageSquare />} label="Description" value={transaction.description} />
            </div>
        );
        pdfData = {
            head: [['Field', 'Value']],
            body: [
                ['ID', transaction.id],
                ['Date', date],
                ['Category', transaction.category],
                ['Description', transaction.description],
                ['Amount', transaction.amount.toFixed(2)],
            ]
        };
        excelData = pdfData.body.map(row => [String(row[0]), String(row[1])]);

    } else if (transactionType === 'Payment' && 'method' in transaction) {
        title = `Payment: ${transaction.id}`;
        fileName = `Payment_${transaction.id}`;
        const entity = transaction.customerId 
            ? customerData.find(c => c.id === transaction.customerId)
            : suppliersData.find(s => s.id === transaction.supplierId);
        const bank = transaction.bankAccountId ? bankAccounts.find(b => b.id === transaction.bankAccountId) : null;
        const linkedPO = transaction.purchaseOrderId ? purchaseOrders.find(po => po.id === transaction.purchaseOrderId) : null;
        
        let pdfBody = [
            ['ID', transaction.id],
            ['Date', date],
            ['Method', transaction.method],
            ['Amount', transaction.amount.toFixed(2)],
        ];
        if (entity) pdfBody.push([transaction.customerId ? 'From Customer' : 'To Supplier', entity.name]);
        if (bank) pdfBody.push(['Bank', `${bank.accountName} (${bank.bankName})`]);
        if (transaction.chequeNumber) pdfBody.push(['Cheque No.', transaction.chequeNumber]);
        if (transaction.utrNumber) pdfBody.push(['UTR/Ref No.', transaction.utrNumber]);
        if (transaction.description) pdfBody.push(['Notes', transaction.description]);
        if (linkedPO) pdfBody.push(['Linked PO', linkedPO.id]);
        
        pdfData = { head: [['Field', 'Value']], body: pdfBody };
        excelData = pdfData.body.map(row => [String(row[0]), String(row[1])]);

        details = (
            <>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-2 py-4">
                <InfoRow icon={<Calendar />} label="Date" value={date} />
                <InfoRow icon={<Banknote />} label="Amount" value={`${transaction.amount.toFixed(2)}`} />
                 <InfoRow icon={<Wallet />} label="Method" value={transaction.method} />
                {transaction.customerId && <InfoRow icon={<User />} label="From Customer" value={entity?.name} />}
                {transaction.supplierId && <InfoRow icon={<Building />} label="To Supplier" value={entity?.name} />}
                {bank && <InfoRow icon={<Landmark />} label="Bank Account" value={`${bank.accountName} (${bank.bankName})`} />}
                {transaction.chequeNumber && <InfoRow icon={<Hash />} label="Cheque Number" value={transaction.chequeNumber} />}
                {transaction.utrNumber && <InfoRow icon={<Hash />} label="UTR/Ref Number" value={transaction.utrNumber} />}
                {transaction.description && <InfoRow icon={<MessageSquare />} label="Reference/Notes" value={transaction.description} />}
            </div>
            {linkedPO && (
                <div className="mt-4">
                    <h4 className="font-medium mb-2 text-base flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                        Linked Purchase Order
                    </h4>
                    <div className="border rounded-lg p-4 space-y-3">
                         <div className="grid grid-cols-2 gap-4 text-sm">
                            <InfoRow icon={<Hash />} label="PO ID" value={linkedPO.id} />
                            <InfoRow icon={<Banknote />} label="PO Amount" value={`${linkedPO.totalAmount.toFixed(2)}`} />
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {linkedPO.items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            )}
            </>
        )

    } else if ((transactionType === 'Credit Note' || transactionType === 'Debit Note') && 'reason' in transaction) {
        title = `${transactionType}: ${transaction.id}`;
        fileName = `${transactionType.replace(' ', '')}_${transaction.id}`;
        const entity = 
            transaction.entityType === 'Customer' ? customerData.find(c => c.id === transaction.entityId) :
            transaction.entityType === 'Supplier' ? suppliersData.find(s => s.id === transaction.entityId) :
            staffData.find(s => s.id === transaction.entityId);

        let pdfBody = [
            ['ID', transaction.id],
            ['Date', date],
            ['Entity Type', transaction.entityType],
            ['Entity Name', entity?.name || 'N/A'],
            ['Reason', transaction.reason],
            ['Amount', transaction.amount.toFixed(2)],
        ];
        if (transaction.reference) pdfBody.push(['Reference', transaction.reference]);
        
        pdfData = { head: [['Field', 'Value']], body: pdfBody };
        excelData = pdfData.body.map(row => [String(row[0]), String(row[1])]);

        details = (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-2 py-4">
                <InfoRow icon={<Calendar />} label="Date" value={date} />
                <InfoRow icon={<User />} label={`To/From ${transaction.entityType}`} value={entity?.name} />
                <InfoRow icon={<Banknote />} label={`Amount (${transactionType === 'Credit Note' ? 'Liability' : 'Asset'})`} value={`${transaction.amount.toFixed(2)}`} />
                <InfoRow icon={<MessageSquare />} label="Reason" value={transaction.reason} />
                {transaction.reference && <InfoRow icon={<Hash />} label="Reference" value={transaction.reference} />}
            </div>
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 font-headline text-xl">
                        <Receipt className="h-6 w-6" />
                        {title}
                    </SheetTitle>
                    <SheetDescription>
                        Detailed view of the financial transaction.
                    </SheetDescription>
                </SheetHeader>
                {details}
                <SheetFooter className="mt-4">
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={generatePdf} disabled={!pdfData}><Download className="mr-2 h-4 w-4" />PDF</Button>
                        <Button variant="outline" size="sm" onClick={generateExcel} disabled={excelData.length === 0}><Download className="mr-2 h-4 w-4" />Excel</Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
