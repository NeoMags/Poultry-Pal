

"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger
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
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useFarm, PurchaseOrder, Payment } from "@/context/FarmContext"
import { Banknote } from "lucide-react"

const paymentMethods = ["Bank Transfer", "Cash", "Cheque", "Online"];
const bankRequiredMethods = ["Bank Transfer", "Cheque", "Online"];

interface LogPaymentSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    defaultSupplierId?: string;
    defaultPoId?: string;
}

export default function LogPaymentSheet({ isOpen, onOpenChange, defaultSupplierId, defaultPoId }: LogPaymentSheetProps) {
    const { toast } = useToast();
    const { bankAccounts, purchaseOrders, suppliersData, addPayment, logPaymentForPO } = useFarm();
    
    const [selectedPoId, setSelectedPoId] = React.useState(defaultPoId || "");
    const [selectedSupplierId, setSelectedSupplierId] = React.useState(defaultSupplierId || "");
    const [amount, setAmount] = React.useState("");
    const [paymentMethod, setPaymentMethod] = React.useState("");
    const [bankAccountId, setBankAccountId] = React.useState("");
    const [chequeNumber, setChequeNumber] = React.useState("");
    const [utrNumber, setUtrNumber] = React.useState("");
    const [description, setDescription] = React.useState("");
    
    const pendingPOs = React.useMemo(() => {
        return purchaseOrders.filter(po => po.status === 'Pending' && (selectedSupplierId ? po.supplierId === selectedSupplierId : true));
    }, [purchaseOrders, selectedSupplierId]);

    React.useEffect(() => {
        if (defaultPoId) setSelectedPoId(defaultPoId);
        if (defaultSupplierId) setSelectedSupplierId(defaultSupplierId);
    }, [defaultPoId, defaultSupplierId]);

    React.useEffect(() => {
        if (selectedPoId) {
            const po = purchaseOrders.find(p => p.id === selectedPoId);
            if (po) {
                setAmount(po.totalAmount.toString());
                setSelectedSupplierId(po.supplierId);
                setDescription(`Payment for PO: ${po.id}`);
            }
        } else {
            setAmount("");
            setDescription("");
        }
    }, [selectedPoId, purchaseOrders]);

    const resetForm = () => {
        setSelectedPoId("");
        setSelectedSupplierId(defaultSupplierId || "");
        setAmount("");
        setPaymentMethod("");
        setBankAccountId("");
        setChequeNumber("");
        setUtrNumber("");
        setDescription("");
    }

    React.useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (selectedPoId) {
             const result = logPaymentForPO(selectedPoId, {
                method: paymentMethod,
                bankAccountId,
                chequeNumber,
                utrNumber,
            });
             if (result.success) {
                toast({ title: "Payment Logged", description: result.message });
                onOpenChange(false);
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } else {
             if (!selectedSupplierId || !amount || !paymentMethod) {
                toast({ title: "Error", description: "Supplier, Amount and Method are required for manual payments.", variant: "destructive" });
                return;
             }
             const result = addPayment({
                date: new Date().toISOString(),
                amount: parseFloat(amount),
                method: paymentMethod,
                supplierId: selectedSupplierId,
                description: description || `General payment to supplier`,
                bankAccountId,
                chequeNumber,
                utrNumber,
            });
             if (result.success) {
                toast({ title: "Payment Logged", description: result.message });
                onOpenChange(false);
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md w-full">
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <SheetTitle>Log Supplier Payment</SheetTitle>
                        <SheetDescription>
                            Record a payment to a supplier. You can link it to a PO or make a general payment.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-4 grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="supplier-id">Supplier</Label>
                            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId} disabled={!!defaultSupplierId}>
                                <SelectTrigger><SelectValue placeholder="Select a supplier" /></SelectTrigger>
                                <SelectContent>
                                    {suppliersData.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="po-id">Link to Purchase Order (Optional)</Label>
                            <Select value={selectedPoId} onValueChange={setSelectedPoId} disabled={!selectedSupplierId}>
                                <SelectTrigger><SelectValue placeholder="Select a PO" /></SelectTrigger>
                                <SelectContent>
                                    {pendingPOs.map(po => <SelectItem key={po.id} value={po.id}>{po.id} - {po.totalAmount.toFixed(2)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} disabled={!!selectedPoId} placeholder="0.00" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="payment-method">Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                                <SelectTrigger><SelectValue placeholder="Select a method" /></SelectTrigger>
                                <SelectContent>
                                    {paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         {bankRequiredMethods.includes(paymentMethod) && (
                            <div className="space-y-2">
                                <Label htmlFor="bank-account">Bank Account</Label>
                                <Select value={bankAccountId} onValueChange={setBankAccountId} required>
                                    <SelectTrigger><SelectValue placeholder="Select a bank" /></SelectTrigger>
                                    <SelectContent>
                                        {bankAccounts.map(b => <SelectItem key={b.id} value={b.id}>{b.accountName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                         )}
                         {paymentMethod === 'Cheque' && (
                             <div className="space-y-2">
                                <Label htmlFor="cheque-number">Cheque Number</Label>
                                <Input id="cheque-number" value={chequeNumber} onChange={e => setChequeNumber(e.target.value)} />
                            </div>
                         )}
                          {paymentMethod === 'Online' && (
                             <div className="space-y-2">
                                <Label htmlFor="utr-number">UTR/Transaction ID</Label>
                                <Input id="utr-number" value={utrNumber} onChange={e => setUtrNumber(e.target.value)} />
                            </div>
                         )}
                         <div className="space-y-2">
                            <Label htmlFor="description">Notes / Reference</Label>
                            <Input id="description" value={description} onChange={e => setDescription(e.target.value)} disabled={!!selectedPoId} />
                        </div>
                    </div>
                    <SheetFooter>
                        <Button type="submit">Confirm and Log Payment</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
