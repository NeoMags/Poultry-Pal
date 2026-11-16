

"use client"

import * as React from "react"
import { notFound, useParams } from "next/navigation"
import { useFarm, Customer, Payment, Dispatch } from "@/context/FarmContext"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { User, IndianRupee, Package, Phone, Mail, Home, Truck, FileText, Box, Egg, Banknote, Receipt, AlertTriangle } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import DispatchDetailSheet from "@/components/dashboard/dispatch-detail-sheet"
import NewTransactionSheet from "@/components/dashboard/new-transaction-sheet"
import { Textarea } from "@/components/ui/textarea"


const StatCard = ({ title, value, icon, description }: { title: string, value: string, icon: React.ReactNode, description?: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
);

const statusVariant = {
  Delivered: "secondary",
  "In Transit": "default",
  Pending: "destructive",
}

const paymentMethods = ["Bank Transfer", "Cash", "Cheque", "Online"];
const bankRequiredMethods = ["Bank Transfer", "Cheque", "Online"];

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { 
      customerData, 
      paymentData,
      dispatchData,
      creditNoteData,
      bankAccounts,
      addPayment,
      logTrayCollection,
      processReturn,
      isLoading,
  } = useFarm()
  const { toast } = useToast();
  const [customer, setCustomer] = React.useState<Customer | null>(null)
  const [selectedDispatch, setSelectedDispatch] = React.useState<Dispatch | null>(null);

  // Form state for new payment
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("");
  const [paymentBankId, setPaymentBankId] = React.useState("");
  const [paymentDescription, setPaymentDescription] = React.useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState("");
  
  // Return form state
  const [returnDispatchId, setReturnDispatchId] = React.useState("");
  const [undeliveredEggs, setUndeliveredEggs] = React.useState("");
  const [damagedEggs, setDamagedEggs] = React.useState("");
  const [returnRemarks, setReturnRemarks] = React.useState("");
  const [returnTrays, setReturnTrays] = React.useState("");


  // State for note sheet
  const [isNoteSheetOpen, setIsNoteSheetOpen] = React.useState(false);
  const [noteType, setNoteType] = React.useState<'Credit Note' | 'Debit Note'>('Credit Note');

  const handleNoteClick = (type: 'Credit Note' | 'Debit Note') => {
    setNoteType(type);
    setIsNoteSheetOpen(true);
  }


  React.useEffect(() => {
    if (!isLoading && customerData) {
      const foundCustomer = customerData.find((c) => c.id === id)
      if (foundCustomer) {
        setCustomer(foundCustomer)
      } else {
        notFound()
      }
    }
  }, [id, customerData, isLoading])
  
    const { 
      paymentHistory, 
      dispatchHistory, 
      lifetimeValue, 
      totalCreditNotes, 
      outstandingBalance, 
      pendingDispatches,
      totalEggsDispatched,
      averageEggRate
    } = React.useMemo(() => {
    if (!customer) return { paymentHistory: [], dispatchHistory: [], lifetimeValue: 0, totalCreditNotes: 0, outstandingBalance: 0, pendingDispatches: [], totalEggsDispatched: 0, averageEggRate: 0 };
    
    const payments = paymentData.filter(p => p.customerId === customer.id);
    const dispatches = dispatchData.filter(d => d.customerId === customer.id);
    const eggDispatches = dispatches.filter(d => d.dispatchType === 'Eggs');
    const notes = creditNoteData.filter(cn => cn.entityType === 'Customer' && cn.entityId === customer.id);
    
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalFromDispatches = dispatches.reduce((sum, d) => sum + (d.totalAmount || 0), 0);
    
    const outstanding = totalFromDispatches - totalPaid;
    
    const eggsDispatched = eggDispatches.reduce((sum, d) => sum + (d.eggs || 0), 0);
    const eggDispatchesValue = eggDispatches.reduce((sum, d) => sum + (d.totalAmount || 0), 0);
    const avgRate = eggsDispatched > 0 ? eggDispatchesValue / eggsDispatched : 0;

    return { 
        paymentHistory: payments, 
        dispatchHistory: dispatches,
        lifetimeValue: totalPaid,
        totalCreditNotes: notes.reduce((sum, cn) => sum + (cn.amount || 0), 0),
        outstandingBalance: outstanding,
        pendingDispatches: dispatches.filter(d => {
            const correspondingCN = creditNoteData.find(cn => cn.id === `CN-${d.invoiceId}`);
            return !correspondingCN;
        }),
        totalEggsDispatched: eggsDispatched,
        averageEggRate: avgRate
    };
  }, [customer, paymentData, dispatchData, creditNoteData]);


  React.useEffect(() => {
    if (selectedInvoiceId) {
        const dispatch = pendingDispatches.find(d => d.invoiceId === selectedInvoiceId);
        if (dispatch && dispatch.totalAmount) {
            setPaymentAmount(Math.round(dispatch.totalAmount).toString());
            setPaymentDescription(`Payment for Invoice #${dispatch.invoiceId}`);
        }
    } else {
        setPaymentAmount("");
        setPaymentDescription("");
    }
  }, [selectedInvoiceId, pendingDispatches]);


  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !paymentAmount || !paymentMethod) {
        toast({ title: "Error", description: "Amount and Method are required.", variant: "destructive" });
        return;
    }
    
    let creditNoteToPay: string | undefined = undefined;
    if (selectedInvoiceId) {
        creditNoteToPay = `CN-${selectedInvoiceId}`;
    }

    const result = addPayment({
        date: new Date().toISOString(),
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        customerId: customer.id,
        bankAccountId: paymentBankId,
        description: paymentDescription,
        creditNoteId: creditNoteToPay,
    });

    if (result.success) {
        toast({ title: "Payment Recorded", description: `Payment of ${paymentAmount} from ${customer.name} has been logged.` });
        resetPaymentForm();
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  }

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnDispatchId) {
      toast({ title: "Error", description: "Please select a dispatch ID to process a return.", variant: "destructive" });
      return;
    }
    
    const result = processReturn({
        dispatchId: returnDispatchId,
        undeliveredEggs: parseInt(undeliveredEggs) || 0,
        damagedEggs: parseInt(damagedEggs) || 0,
        collectedTrays: parseInt(returnTrays) || 0,
        remarks: returnRemarks,
    });
    
    if (result.success) {
        toast({ title: "Return Logged", description: result.message });
        // Reset form
        setReturnDispatchId("");
        setUndeliveredEggs("");
        setDamagedEggs("");
        setReturnTrays("");
        setReturnRemarks("");
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  }

  const resetPaymentForm = () => {
    setPaymentAmount("");
    setPaymentMethod("");
    setPaymentBankId("");
    setPaymentDescription("");
    setSelectedInvoiceId("");
  };

  if (isLoading || !customer) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-12 w-1/2"/>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                <User className="h-8 w-8 text-primary"/>
                {customer.name}
            </h1>
            <p className="text-muted-foreground">Detailed view of customer activity and history.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => handleNoteClick('Credit Note')}>Credit Note</Button>
            <Button size="sm" variant="outline" onClick={() => handleNoteClick('Debit Note')}>Debit Note</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Lifetime Value" value={`${lifetimeValue.toLocaleString()}`} icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />} description="Total payments received" />
        <StatCard 
            title="Total Dispatches" 
            value={dispatchHistory.length.toString()} 
            icon={<Truck className="h-4 w-4 text-muted-foreground" />} 
            description={totalEggsDispatched > 0 ? `${totalEggsDispatched.toLocaleString()} eggs @ ₹${averageEggRate.toFixed(2)}/egg` : "No egg dispatches"}
        />
        <StatCard title="Credit Notes Issued" value={`${totalCreditNotes.toLocaleString()}`} icon={<FileText className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Outstanding Balance" value={`${outstandingBalance.toLocaleString()}`} icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />} description="Value of dispatches minus payments" />
        <StatCard title="Outstanding Trays" value={(customer.emptyTraysHeld || 0).toString()} icon={<Box className="h-4 w-4 text-muted-foreground" />} description="Empty trays to be collected" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dispatch-history">Dispatch History</TabsTrigger>
          <TabsTrigger value="payment-history">Payment History</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Details</CardTitle>
                        <CardDescription>Contact and location information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-muted-foreground"/>
                            <span className="font-medium">Contact Person:</span>
                            <span>{customer.contact}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="h-5 w-5 text-muted-foreground"/>
                            <span className="font-medium">Phone Number:</span>
                            <span>{customer.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-muted-foreground"/>
                            <span className="font-medium">Email:</span>
                            <span>{customer.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Home className="h-5 w-5 text-muted-foreground"/>
                            <span className="font-medium">Address:</span>
                            <span>{customer.address || 'N/A'}</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <form onSubmit={handleReturnSubmit}>
                        <CardHeader>
                            <CardTitle>Return Management</CardTitle>
                            <CardDescription>Process returns for this customer.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid gap-2">
                                <Label htmlFor="return-dispatch-id">Link to Dispatch</Label>
                                <Select value={returnDispatchId} onValueChange={setReturnDispatchId}>
                                    <SelectTrigger id="return-dispatch-id"><SelectValue placeholder="Select an invoice" /></SelectTrigger>
                                    <SelectContent>
                                        {dispatchHistory.map(d => <SelectItem key={d.invoiceId} value={d.invoiceId}>{d.invoiceId} - {format(new Date(d.date), "PP")}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="undelivered-eggs">Undelivered Eggs</Label>
                                    <Input id="undelivered-eggs" type="number" placeholder="e.g., 25" value={undeliveredEggs} onChange={(e) => setUndeliveredEggs(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="damaged-eggs">Damaged Eggs</Label>
                                    <Input id="damaged-eggs" type="number" placeholder="e.g., 10" value={damagedEggs} onChange={(e) => setDamagedEggs(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="return-trays">Empty Trays Collected</Label>
                                <Input id="return-trays" type="number" placeholder="e.g., 5" value={returnTrays} onChange={(e) => setReturnTrays(e.target.value)} />
                                <p className="text-xs text-muted-foreground">Customer has {customer.emptyTraysHeld || 0} trays.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="return-remarks">Remarks</Label>
                                <Textarea id="return-remarks" placeholder="Notes on the return..." value={returnRemarks} onChange={(e) => setReturnRemarks(e.target.value)} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" type="submit">Process Return</Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </TabsContent>
        <TabsContent value="dispatch-history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Dispatch History</CardTitle>
              <CardDescription>List of all dispatches sent to {customer.name}.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatchHistory.map(dispatch => (
                    <TableRow key={dispatch.invoiceId} onClick={() => setSelectedDispatch(dispatch)} className="cursor-pointer">
                      <TableCell>{dispatch.invoiceId}</TableCell>
                      <TableCell>{format(new Date(dispatch.date), "PP")}</TableCell>
                      <TableCell>
                        {dispatch.dispatchType === 'Eggs' && `${dispatch.trays} trays`}
                        {dispatch.dispatchType === 'Chicks' && `${dispatch.chickQuantity} chicks`}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={statusVariant[dispatch.status as keyof typeof statusVariant] as any}>{dispatch.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payment-history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Record of all payments received from {customer.name}.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.id}</TableCell>
                      <TableCell>{format(new Date(p.date), "PP")}</TableCell>
                      <TableCell>{p.method}</TableCell>
                      <TableCell>{p.description || 'N/A'}</TableCell>
                      <TableCell className="text-right">{p.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="actions" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <form onSubmit={handlePaymentSubmit}>
                        <CardHeader>
                            <CardTitle>Record Payment</CardTitle>
                            <CardDescription>Log a new payment received from this customer.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="payment-invoice">Link to Invoice (Optional)</Label>
                                <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                                    <SelectTrigger id="payment-invoice"><SelectValue placeholder="Select an invoice" /></SelectTrigger>
                                    <SelectContent>
                                        {pendingDispatches.map(d => <SelectItem key={d.invoiceId} value={d.invoiceId}>{d.invoiceId} - {(d.totalAmount || 0).toFixed(2)}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment-amount">Amount Received</Label>
                                <Input id="payment-amount" type="number" placeholder="0.00" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required disabled={!!selectedInvoiceId} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment-method">Payment Method</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                                    <SelectTrigger id="payment-method"><SelectValue placeholder="Select a method" /></SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {bankRequiredMethods.includes(paymentMethod) && (
                                <div className="space-y-2">
                                    <Label htmlFor="payment-bank">Bank Account</Label>
                                    <Select value={paymentBankId} onValueChange={setPaymentBankId} required>
                                        <SelectTrigger id="payment-bank"><SelectValue placeholder="Select bank" /></SelectTrigger>
                                        <SelectContent>
                                            {bankAccounts.map(b => <SelectItem key={b.id} value={b.id}>{b.accountName}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="payment-desc">Reference / Notes</Label>
                                <Input id="payment-desc" placeholder="e.g., Invoice #123" value={paymentDescription} onChange={e => setPaymentDescription(e.target.value)} disabled={!!selectedInvoiceId} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">Save Payment</Button>
                        </CardFooter>
                    </form>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Log Empty Tray Collection</CardTitle>
                        <CardDescription>Use this for standalone tray collections not associated with a return.</CardDescription>
                    </CardHeader>
                    <form onSubmit={(e) => { e.preventDefault(); logTrayCollection(customer.id, parseInt(returnTrays)); setReturnTrays(''); }}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="trays-collected">Number of Trays Collected</Label>
                                <Input id="trays-collected" type="number" placeholder="e.g., 30" value={returnTrays} onChange={e => setReturnTrays(e.target.value)} required />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">Save Collection</Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
     <DispatchDetailSheet
        dispatch={selectedDispatch}
        isOpen={!!selectedDispatch}
        onOpenChange={(open) => { if (!open) setSelectedDispatch(null); }}
    />
     <NewTransactionSheet
      isOpen={isNoteSheetOpen}
      onOpenChange={setIsNoteSheetOpen}
      defaultTransactionType={noteType}
      defaultEntityType="Customer"
      defaultEntityId={customer.id}
    />
    </>
  )
}
    

    



    




