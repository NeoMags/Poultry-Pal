

"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useFarm } from "@/context/FarmContext"

const expenseCategories = ["Feed", "Medication", "Utilities", "Maintenance", "Salaries", "Other"];
const paymentMethods = ["Bank Transfer", "Cash", "Cheque", "Online"];
const bankRequiredMethods = ["Bank Transfer", "Cheque", "Online"];
const transactionTypes = ["Payment", "Expense", "Credit Note", "Debit Note"];
const entityTypes = ["Customer", "Supplier", "Staff"];

interface NewTransactionSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTransactionType?: string;
    defaultEntityType?: string;
    defaultEntityId?: string;
}

export default function NewTransactionSheet({ 
    isOpen, 
    onOpenChange,
    defaultTransactionType,
    defaultEntityType,
    defaultEntityId,
}: NewTransactionSheetProps) {
    const { toast } = useToast();
    const { 
        bankAccounts,
        suppliersData,
        customerData,
        staffData,
        purchaseOrders,
        dispatchData,
        creditNoteData,
        addExpense,
        addPayment,
        logPaymentForPO,
        addCreditNote,
        addDebitNote,
    } = useFarm();
    
    // Form State
    const [transactionType, setTransactionType] = React.useState(defaultTransactionType || "");
    const [amount, setAmount] = React.useState("");
    const [description, setDescription] = React.useState("");

    // Payment State
    const [paymentDirection, setPaymentDirection] = React.useState(""); // Inward, Outward
    const [paymentEntityId, setPaymentEntityId] = React.useState("");
    const [paymentMethod, setPaymentMethod] = React.useState("");
    const [paymentBankId, setPaymentBankId] = React.useState("");
    const [chequeNumber, setChequeNumber] = React.useState("");
    const [utrNumber, setUtrNumber] = React.useState("");
    const [selectedPoId, setSelectedPoId] = React.useState("");
    const [selectedInvoiceId, setSelectedInvoiceId] = React.useState("");


    // Expense State
    const [expenseCategory, setExpenseCategory] = React.useState("");

    // Note State (Credit/Debit)
    const [noteEntityType, setNoteEntityType] = React.useState(defaultEntityType || "");
    const [noteEntityId, setNoteEntityId] = React.useState(defaultEntityId || "");
    const [noteReason, setNoteReason] = React.useState("");
    const [noteReference, setNoteReference] = React.useState("");

    const pendingPOs = React.useMemo(() => {
        if (!paymentEntityId) return [];
        return purchaseOrders.filter(po => po.status === 'Pending' && po.supplierId === paymentEntityId);
    }, [purchaseOrders, paymentEntityId]);

    const pendingInvoices = React.useMemo(() => {
        if (!paymentEntityId) return [];
        const dispatches = dispatchData.filter(d => d.customerId === paymentEntityId);
        
        return dispatches.filter(d => {
            const correspondingCN = creditNoteData.find(cn => cn.id === `CN-${d.invoiceId}`);
            // A dispatch is pending if it has no paid credit note.
            return !correspondingCN;
        });
    }, [dispatchData, creditNoteData, paymentEntityId]);


     React.useEffect(() => {
        if (selectedPoId) {
            const po = purchaseOrders.find(p => p.id === selectedPoId);
            if (po) {
                setAmount(po.totalAmount.toString());
                setDescription(`Payment for PO: ${po.id}`);
            }
        } else if (!defaultTransactionType) {
             setAmount("");
             setDescription("");
        }
    }, [selectedPoId, purchaseOrders, defaultTransactionType]);
    
    React.useEffect(() => {
        if (selectedInvoiceId) {
            const invoice = dispatchData.find(d => d.invoiceId === selectedInvoiceId);
            if (invoice) {
                setAmount(invoice.totalAmount.toString());
                setDescription(`Payment for Invoice: ${invoice.invoiceId}`);
            }
        } else if (!defaultTransactionType) {
             setAmount("");
             setDescription("");
        }
    }, [selectedInvoiceId, dispatchData, defaultTransactionType]);
    
    // Pre-fill form if default values are provided
    React.useEffect(() => {
        if (defaultTransactionType) setTransactionType(defaultTransactionType);
        if (defaultEntityType) setNoteEntityType(defaultEntityType);
        if (defaultEntityId) setNoteEntityId(defaultEntityId);
    }, [defaultTransactionType, defaultEntityType, defaultEntityId, isOpen]);


    const resetForm = () => {
        setTransactionType(defaultTransactionType || "");
        setAmount("");
        setDescription("");
        setPaymentDirection("");
        setPaymentEntityId("");
        setPaymentMethod("");
        setPaymentBankId("");
        setChequeNumber("");
        setUtrNumber("");
        setExpenseCategory("");
        setNoteEntityType(defaultEntityType || "");
        setNoteEntityId(defaultEntityId || "");
        setNoteReason("");
        setNoteReference("");
        setSelectedPoId("");
        setSelectedInvoiceId("");
    };

    React.useEffect(() => {
      if (!isOpen) {
        resetForm();
      }
    }, [isOpen]);
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const regex = /^[0-9]*\.?[0-9]*$/;
        if (regex.test(value)) {
            setAmount(value);
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (transactionType === 'Payment' && selectedPoId) {
            if (!paymentMethod) {
                toast({ title: "Error", description: "Payment Method is required.", variant: "destructive" });
                return;
            }
             const result = logPaymentForPO(selectedPoId, {
                method: paymentMethod,
                bankAccountId: paymentBankId,
                chequeNumber,
                utrNumber,
            });
             if (result.success) {
                toast({ title: "Payment Logged", description: result.message });
                onOpenChange(false);
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
            return;
        }

        const amountValue = parseFloat(amount);
        if (!transactionType || isNaN(amountValue) || amountValue <= 0) {
            toast({ title: "Error", description: "Please select a transaction type and enter a valid amount.", variant: "destructive" });
            return;
        }

        let result: { success: boolean, message: string } | undefined;

        switch (transactionType) {
            case "Payment":
                if (!paymentDirection || !paymentEntityId || !paymentMethod) {
                    toast({ title: "Error", description: "Direction, Entity, and Method are required for payments.", variant: "destructive" });
                    return;
                }
                result = addPayment({
                    amount: amountValue,
                    method: paymentMethod,
                    customerId: paymentDirection === 'Inward' ? paymentEntityId : undefined,
                    supplierId: paymentDirection === 'Outward' ? paymentEntityId : undefined,
                    description,
                    bankAccountId: paymentBankId,
                    chequeNumber,
                    utrNumber,
                    // Link to invoice via credit note ID
                    creditNoteId: selectedInvoiceId ? `CN-${selectedInvoiceId}` : undefined,
                });
                break;
            case "Expense":
                if (!expenseCategory || !description) {
                    toast({ title: "Error", description: "Category and Description are required for expenses.", variant: "destructive" });
                    return;
                }
                result = addExpense({
                    amount: amountValue,
                    category: expenseCategory,
                    description,
                });
                break;
            case "Credit Note":
                if (!noteEntityType || !noteEntityId || !noteReason) {
                    toast({ title: "Error", description: "Entity type, entity, and reason are required.", variant: "destructive" });
                    return;
                }
                result = addCreditNote({
                    amount: amountValue,
                    entityId: noteEntityId,
                    entityType: noteEntityType as any,
                    reason: noteReason,
                    reference: noteReference,
                });
                break;
            case "Debit Note":
                 if (!noteEntityType || !noteEntityId || !noteReason) {
                    toast({ title: "Error", description: "Entity type, entity, and reason are required.", variant: "destructive" });
                    return;
                }
                result = addDebitNote({
                    amount: amountValue,
                    entityId: noteEntityId,
                    entityType: noteEntityType as any,
                    reason: noteReason,
                    reference: noteReference,
                });
                break;
            default:
                toast({ title: "Error", description: "Invalid transaction type selected.", variant: "destructive" });
                return;
        }

        if (result && result.success) {
            toast({ title: "Success", description: result.message });
            onOpenChange(false);
        } else if (result) {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };

    const renderPaymentEntityOptions = () => {
        if (paymentDirection === 'Inward') {
            return customerData.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>);
        }
        if (paymentDirection === 'Outward') {
            return suppliersData.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>);
        }
        return null;
    }

    const renderNoteEntityOptions = () => {
        if (noteEntityType === 'Customer') return customerData.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>);
        if (noteEntityType === 'Supplier') return suppliersData.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>);
        if (noteEntityType === 'Staff') return staffData.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.role})</SelectItem>);
        return null;
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md w-full">
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <SheetTitle>New Transaction</SheetTitle>
                        <SheetDescription>
                            Record a new financial transaction for your ledger.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-4 grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="transaction-type">Transaction Type</Label>
                            <Select value={transactionType} onValueChange={setTransactionType} disabled={!!defaultTransactionType}>
                                <SelectTrigger id="transaction-type"><SelectValue placeholder="Select a type..." /></SelectTrigger>
                                <SelectContent>
                                    {transactionTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         
                        {/* Payment Fields */}
                        {transactionType === 'Payment' && (
                            <div className="p-4 border rounded-md space-y-4">
                                <div className="space-y-2">
                                    <Label>Direction</Label>
                                     <Select value={paymentDirection} onValueChange={(value) => { setPaymentDirection(value); setPaymentEntityId(''); setSelectedPoId(''); setSelectedInvoiceId(''); }}>
                                        <SelectTrigger><SelectValue placeholder="Select Inward/Outward" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Inward">Inward (Receiving Money)</SelectItem>
                                            <SelectItem value="Outward">Outward (Paying Money)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>From/To</Label>
                                    <Select value={paymentEntityId} onValueChange={(value) => { setPaymentEntityId(value); setSelectedPoId(''); setSelectedInvoiceId(''); }} disabled={!paymentDirection}>
                                        <SelectTrigger><SelectValue placeholder="Select an entity" /></SelectTrigger>
                                        <SelectContent>
                                            {renderPaymentEntityOptions()}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                {paymentDirection === 'Outward' && paymentEntityId && (
                                     <div className="space-y-2">
                                        <Label htmlFor="po-id">Link to Purchase Order (Optional)</Label>
                                        <Select value={selectedPoId} onValueChange={setSelectedPoId} disabled={pendingPOs.length === 0}>
                                            <SelectTrigger><SelectValue placeholder={pendingPOs.length > 0 ? "Select a pending PO" : "No pending POs"} /></SelectTrigger>
                                            <SelectContent>
                                                {pendingPOs.map(po => <SelectItem key={po.id} value={po.id}>{po.id} - {po.totalAmount.toFixed(2)}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                
                                {paymentDirection === 'Inward' && paymentEntityId && (
                                    <div className="space-y-2">
                                        <Label htmlFor="invoice-id">Link to Invoice (Optional)</Label>
                                        <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId} disabled={pendingInvoices.length === 0}>
                                            <SelectTrigger><SelectValue placeholder={pendingInvoices.length > 0 ? "Select an invoice" : "No pending invoices"} /></SelectTrigger>
                                            <SelectContent>
                                                {pendingInvoices.map(inv => <SelectItem key={inv.invoiceId} value={inv.invoiceId}>{inv.invoiceId} - {inv.totalAmount.toFixed(2)}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                 <div className="space-y-2">
                                    <Label htmlFor="amount">Amount</Label>
                                    <Input id="amount" type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={handleAmountChange} required disabled={!!selectedPoId || !!selectedInvoiceId} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Payment Method</Label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <SelectTrigger><SelectValue placeholder="Select a payment method" /></SelectTrigger>
                                        <SelectContent>
                                            {paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {bankRequiredMethods.includes(paymentMethod) && (
                                     <div className="space-y-2">
                                        <Label>Bank Account</Label>
                                        <Select value={paymentBankId} onValueChange={setPaymentBankId}>
                                            <SelectTrigger><SelectValue placeholder="Select a bank" /></SelectTrigger>
                                            <SelectContent>
                                                {bankAccounts.map(b => <SelectItem key={b.id} value={b.id}>{b.accountName}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {paymentMethod === 'Cheque' && <div className="space-y-2"><Label>Cheque No.</Label><Input value={chequeNumber} onChange={e => setChequeNumber(e.target.value)} /></div>}
                                {paymentMethod === 'Online' && <div className="space-y-2"><Label>UTR/Ref No.</Label><Input value={utrNumber} onChange={e => setUtrNumber(e.target.value)} /></div>}

                                <div className="space-y-2">
                                    <Label>Description / Notes</Label>
                                    <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Invoice #12345" disabled={!!selectedPoId || !!selectedInvoiceId} />
                                </div>
                            </div>
                        )}

                        {/* Expense Fields */}
                        {transactionType === 'Expense' && (
                             <div className="p-4 border rounded-md space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount_exp">Amount</Label>
                                    <Input id="amount_exp" type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={handleAmountChange} required />
                                </div>
                                 <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                        <SelectContent>
                                            {expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter details..." required />
                                </div>
                            </div>
                        )}

                        {/* Credit/Debit Note Fields */}
                        {(transactionType === 'Credit Note' || transactionType === 'Debit Note') && (
                            <div className="p-4 border rounded-md space-y-4">
                                 <div className="space-y-2">
                                    <Label htmlFor="amount_note">Amount</Label>
                                    <Input id="amount_note" type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={handleAmountChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Entity Type</Label>
                                     <Select value={noteEntityType} onValueChange={setNoteEntityType} disabled={!!defaultEntityType}>
                                        <SelectTrigger><SelectValue placeholder="Select an entity type" /></SelectTrigger>
                                        <SelectContent>
                                            {entityTypes.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Entity Name</Label>
                                    <Select value={noteEntityId} onValueChange={setNoteEntityId} disabled={!noteEntityType || !!defaultEntityId}>
                                        <SelectTrigger><SelectValue placeholder="Select an entity" /></SelectTrigger>
                                        <SelectContent>
                                            {renderNoteEntityOptions()}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Reason</Label>
                                    <Input value={noteReason} onChange={e => setNoteReason(e.target.value)} placeholder="e.g., Goods returned, Price correction" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Reference</Label>
                                    <Input value={noteReference} onChange={e => setNoteReference(e.target.value)} placeholder="e.g., Invoice #, Original PO #" />
                                </div>
                            </div>
                        )}
                    </div>
                    <SheetFooter>
                        <Button type="submit" className="w-full">Save Transaction</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
