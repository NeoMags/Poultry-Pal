

"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useFarm, BankAccount, Payment, Expense, CreditNote, DebitNote } from "@/context/FarmContext"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO, isValid } from "date-fns"
import BankDetailSheet from "@/components/dashboard/bank-detail-sheet"
import TransactionDetailSheet from "@/components/dashboard/transaction-detail-sheet"
import NewTransactionSheet from "@/components/dashboard/new-transaction-sheet"
import { CreditCard, PlusCircle } from "lucide-react"

type Transaction = Expense | Payment | CreditNote | DebitNote;

export default function AccountsPage() {
    const { 
        expenseData, 
        paymentData, 
        creditNoteData,
        debitNoteData,
        bankAccounts, 
        customerData,
        suppliersData,
        staffData,
    } = useFarm();

    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const [selectedBank, setSelectedBank] = React.useState<BankAccount | null>(null);
    const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);

    const formatDateSafe = (dateStr?: string) => {
        if (!dateStr) {
            return "-";
        }
        try {
            const date = parseISO(dateStr);
            return isValid(date) ? format(date, "PP") : "-";
        } catch (error) {
            return "-";
        }
    };
    
    const calculateBankBalance = (bank: BankAccount) => {
        const balance = paymentData.reduce((acc, p) => {
            if (p.bankAccountId !== bank.id) return acc;
            if (p.customerId) return acc + p.amount; // Inward
            if (p.supplierId) return acc - p.amount; // Outward
            return acc;
        }, bank.initialBalance);
        return balance;
    };
    
    const getEntityName = (item: CreditNote | DebitNote) => {
      switch(item.entityType) {
        case 'Customer':
          return customerData.find(c => c.id === item.entityId)?.name || item.entityId;
        case 'Supplier':
          return suppliersData.find(s => s.id === item.entityId)?.name || item.entityId;
        case 'Staff':
          return staffData.find(s => s.id === item.entityId)?.name || item.entityId;
        default:
          return item.entityId;
      }
    };


  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-headline">
                <CreditCard className="h-6 w-6"/>
                Accounts Ledger
            </CardTitle>
            <CardDescription>
                Manage all financial transactions including payments, expenses, and notes.
            </CardDescription>
          </div>
           <Button size="sm" className="gap-1" onClick={() => setIsSheetOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            New Transaction
          </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">Payments</h3>
              <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paymentData?.map((item) => {
                            const entityName = item.customerId 
                                ? customerData.find(c => c.id === item.customerId)?.name || 'N/A' 
                                : suppliersData.find(s => s.id === item.supplierId)?.name || 'N/A';
                            
                            return (
                                <TableRow key={item.id} onClick={() => setSelectedTransaction(item)} className="cursor-pointer">
                                    <TableCell className="font-medium">{item.id}</TableCell>
                                    <TableCell>{formatDateSafe(item.date)}</TableCell>
                                    <TableCell>{entityName}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.customerId ? 'default' : 'destructive'}>
                                            {item.customerId ? "Inward" : "Outward"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell><Badge variant="secondary">{item.method}</Badge></TableCell>
                                    <TableCell className="text-right">{item.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            );
                        })}
                         {!paymentData || paymentData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">No payments found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Expenses</h3>
               <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenseData?.map((item) => (
                            <TableRow key={item.id} onClick={() => setSelectedTransaction(item)} className="cursor-pointer">
                                <TableCell className="font-medium">{item.id}</TableCell>
                                <TableCell>{formatDateSafe(item.date)}</TableCell>
                                <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-right">{item.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        {!expenseData || expenseData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No expenses found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Credit Notes (Money you owe)</h3>
               <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {creditNoteData?.map((item) => (
                            <TableRow key={item.id} onClick={() => setSelectedTransaction(item)} className="cursor-pointer">
                                <TableCell className="font-medium">{item.id}</TableCell>
                                <TableCell>{formatDateSafe(item.date)}</TableCell>
                                <TableCell>{getEntityName(item)}</TableCell>
                                <TableCell>{item.reason}</TableCell>
                                <TableCell className="text-right text-destructive">-{item.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        {!creditNoteData || creditNoteData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No credit notes found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
              </div>
            </div>

             <div>
              <h3 className="text-lg font-semibold mb-2">Debit Notes (Money owed to you)</h3>
               <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {debitNoteData?.map((item) => (
                            <TableRow key={item.id} onClick={() => setSelectedTransaction(item)} className="cursor-pointer">
                                <TableCell className="font-medium">{item.id}</TableCell>
                                <TableCell>{formatDateSafe(item.date)}</TableCell>
                                <TableCell>{getEntityName(item)}</TableCell>
                                <TableCell>{item.reason}</TableCell>
                                <TableCell className="text-right text-green-600">+{item.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                         {!debitNoteData || debitNoteData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No debit notes found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
              </div>
            </div>

             <div>
              <h3 className="text-lg font-semibold mb-2">Bank Accounts</h3>
               <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Account Name</TableHead>
                            <TableHead>Bank</TableHead>
                            <TableHead>Account No.</TableHead>
                            <TableHead className="text-right">Current Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bankAccounts?.map(bank => (
                            <TableRow key={bank.id} onClick={() => setSelectedBank(bank)} className="cursor-pointer">
                                <TableCell className="font-medium underline hover:text-primary">
                                    {bank.accountName}
                                </TableCell>
                                <TableCell>{bank.bankName}</TableCell>
                                <TableCell>{bank.accountNumber}</TableCell>
                                <TableCell className="text-right font-mono">{calculateBankBalance(bank).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                         {!bankAccounts || bankAccounts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">No bank accounts found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
              </div>
            </div>
        </div>
      </CardContent>
    </Card>
    <BankDetailSheet 
        bank={selectedBank}
        isOpen={!!selectedBank}
        onOpenChange={(open) => { if (!open) setSelectedBank(null) }}
    />
     <TransactionDetailSheet 
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onOpenChange={(open) => { if (!open) setSelectedTransaction(null) }}
    />
    <NewTransactionSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </>
  )
}
