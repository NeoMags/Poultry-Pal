

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
import { BankAccount, useFarm, Payment, Expense, CreditNote } from "@/context/FarmContext";
import { Banknote, Building2, User, Hash, Scan, TrendingUp, TrendingDown, Landmark, Scale, QrCode } from "lucide-react";
import Image from 'next/image';
import TransactionDetailSheet from "./transaction-detail-sheet";

type Transaction = Expense | Payment | CreditNote;

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number | null }) => {
    if (!value) return null;
    return (
        <div className="flex items-start">
            <div className="text-muted-foreground w-6 h-6 flex-shrink-0">{icon}</div>
            <div className="ml-2">
              <p className="font-medium text-sm leading-none">{label}</p>
              <p className="text-sm text-muted-foreground">{value}</p>
            </div>
        </div>
    )
}

interface BankDetailSheetProps {
  bank: BankAccount | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BankDetailSheet({ bank, isOpen, onOpenChange }: BankDetailSheetProps) {
    const { paymentData, customerData, suppliersData } = useFarm();
    const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);

    const transactionHistory = React.useMemo(() => {
        if (!bank) return [];
        return paymentData
            .filter(p => p.bankAccountId === bank.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [bank, paymentData]);


    const calculateRunningBalance = () => {
        if (!bank) return [];
        
        let runningBalance = bank.initialBalance;
        const balanceHistory = [...transactionHistory].reverse().map(tx => {
            const amount = tx.customerId ? tx.amount : -tx.amount;
            runningBalance += amount;
            return {
                ...tx,
                runningBalance,
            }
        });
        return balanceHistory.reverse();
    }
    
    const transactionsWithBalance = calculateRunningBalance();

    if (!bank) return null;

    return (
        <>
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Building2 className="h-7 w-7" />
                        {bank.accountName}
                    </SheetTitle>
                    <SheetDescription>
                        Detailed view of the bank account and its transaction history.
                    </SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="details" className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">Account Details</TabsTrigger>
                        <TabsTrigger value="history">Transaction History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-2 py-4">
                            <InfoRow icon={<Landmark />} label="Bank Name" value={bank.bankName} />
                            <InfoRow icon={<Scale />} label="Account Type" value={bank.accountType} />
                            <InfoRow icon={<Hash />} label="Account No" value={bank.accountNumber} />
                            <InfoRow icon={<Hash />} label="IFSC Code" value={bank.ifscCode} />
                            <InfoRow icon={<Scan />} label="UPI Address" value={bank.upiAddress} />
                            <InfoRow icon={<Banknote />} label="Initial Balance" value={`${bank.initialBalance.toFixed(2)}`} />
                        </div>
                         {bank.qrCodeUrl && (
                            <div className="mt-4">
                                <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                                    <QrCode className="h-4 w-4 text-muted-foreground"/>
                                    UPI QR Code
                                </h3>
                                <div className="p-2 border rounded-md inline-block">
                                    <Image 
                                        src={bank.qrCodeUrl}
                                        alt="UPI QR Code"
                                        width={150}
                                        height={150}
                                        data-ai-hint="payment barcode"
                                    />
                                </div>
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="history" className="mt-4">
                         <div className="border rounded-lg overflow-hidden">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactionsWithBalance.length > 0 ? (
                                        transactionsWithBalance.map(tx => {
                                            const isCredit = !!tx.customerId;
                                            const entity = isCredit 
                                                ? customerData.find(c => c.id === tx.customerId) 
                                                : suppliersData.find(s => s.id === tx.supplierId);
                                            
                                            return (
                                                <TableRow key={tx.id} onClick={() => setSelectedTransaction(tx)} className="cursor-pointer">
                                                    <TableCell className="text-xs">{format(parseISO(tx.date), "dd/MM/yy")}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {isCredit ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                                                            <div>
                                                                <p className="font-medium text-sm">{entity?.name || tx.description || 'N/A'}</p>
                                                                <p className="text-xs text-muted-foreground">{tx.description && entity ? tx.description : isCredit ? "Customer Payment" : "Supplier Payment"}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={`font-mono text-sm ${isCredit ? 'text-green-600' : 'text-destructive'}`}>
                                                        {isCredit ? '+' : '-'}{tx.amount.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs">
                                                        {tx.runningBalance.toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">No transactions for this account.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
        <TransactionDetailSheet 
            transaction={selectedTransaction}
            isOpen={!!selectedTransaction}
            onOpenChange={(open) => { if (!open) setSelectedTransaction(null) }}
        />
        </>
    )
}
