

"use client"

import * as React from "react"
import { notFound, useParams } from "next/navigation"
import { useFarm, Supplier, SupplierReturn, PurchaseOrder } from "@/context/FarmContext"
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Building, IndianRupee, Package, Phone, Undo2, User, PlusCircle, Trash2, X, Receipt, Banknote, AlertTriangle } from "lucide-react"
import { format, parseISO } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import AddPOSheet from "@/components/dashboard/add-po-sheet"
import LogPaymentSheet from "@/components/dashboard/log-payment-sheet"
import { Badge } from "@/components/ui/badge"
import PurchaseOrderDetailSheet from "@/components/dashboard/purchase-order-detail-sheet"
import NewTransactionSheet from "@/components/dashboard/new-transaction-sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

const StatCard = ({ title, value, icon, description, children }: { title: string, value: string, icon: React.ReactNode, description?: string, children?: React.ReactNode }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-1">
          {children}
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
);

const SetThresholdDialog = ({ supplier, open, onOpenChange }: { supplier: Supplier | null, open: boolean, onOpenChange: (open: boolean) => void }) => {
    const { toast } = useToast();
    const { updateSupplier } = useFarm();
    const [threshold, setThreshold] = React.useState<string>("");

    React.useEffect(() => {
        if (supplier && supplier.outstandingBalanceAlertThreshold) {
            setThreshold(supplier.outstandingBalanceAlertThreshold.toString());
        } else {
            setThreshold("");
        }
    }, [supplier]);
    
    if (!supplier) return null;

    const handleSave = () => {
        const value = threshold ? parseFloat(threshold) : undefined;
        if (threshold && (isNaN(value) || value < 0)) {
            toast({ title: "Invalid Input", description: "Please enter a valid, non-negative number.", variant: "destructive" });
            return;
        }
        updateSupplier(supplier.id, { outstandingBalanceAlertThreshold: value });
        toast({ title: "Alert Updated", description: `Outstanding balance alert for ${supplier.name} has been set.` });
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Set Outstanding Balance Alert for "{supplier.name}"</AlertDialogTitle>
                    <AlertDialogDescription>
                        You will be notified when the outstanding balance exceeds this threshold.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                    <Label htmlFor="alert-threshold">Alert Threshold (₹)</Label>
                    <Input 
                        id="alert-threshold" 
                        type="number" 
                        placeholder="e.g., 50000" 
                        value={threshold} 
                        onChange={e => setThreshold(e.target.value)} 
                    />
                     <p className="text-xs text-muted-foreground mt-1">Leave blank to disable the alert.</p>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSave}>Save</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};


export default function SupplierDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { suppliersData, isLoading, paymentData, purchaseOrders, updateSupplier } = useFarm()
  const [supplier, setSupplier] = React.useState<Supplier | null>(null)
  const [isReturnSheetOpen, setIsReturnSheetOpen] = React.useState(false);
  const [isPOSheetOpen, setIsPOSheetOpen] = React.useState(false);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = React.useState(false);
  const [selectedPoForView, setSelectedPoForView] = React.useState<PurchaseOrder | null>(null);
  const [selectedPoForPayment, setSelectedPoForPayment] = React.useState<PurchaseOrder | null>(null);
  const [isNoteSheetOpen, setIsNoteSheetOpen] = React.useState(false);
  const [noteType, setNoteType] = React.useState<'Credit Note' | 'Debit Note'>('Credit Note');
  const [isThresholdDialogOpen, setIsThresholdDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && suppliersData) {
      const foundSupplier = suppliersData.find((s) => s.id === id)
      if (foundSupplier) {
        setSupplier(foundSupplier)
      } else {
        notFound()
      }
    }
  }, [id, suppliersData, isLoading])

  const { purchaseHistory, totalSpend } = React.useMemo(() => {
      if (!supplier) return { purchaseHistory: [], totalSpend: 0 };
      const history = purchaseOrders.filter(po => po.supplierId === supplier.id);
      const total = history.reduce((sum, item) => sum + item.totalAmount, 0);
      return { purchaseHistory: history, totalSpend: total };
  }, [supplier, purchaseOrders]);

  const { paymentHistory, totalPaid } = React.useMemo(() => {
    if (!supplier) return { paymentHistory: [], totalPaid: 0 };
    const history = paymentData.filter(p => p.supplierId === supplier.id);
    const total = history.reduce((sum, item) => sum + item.amount, 0);
    return { paymentHistory: history, totalPaid: total };
  }, [supplier, paymentData]);
  
  const handleLogPaymentClick = (po: PurchaseOrder) => {
    setSelectedPoForPayment(po);
    setIsPaymentSheetOpen(true);
  };
  
  const handleNoteClick = (type: 'Credit Note' | 'Debit Note') => {
    setNoteType(type);
    setIsNoteSheetOpen(true);
  }

  if (isLoading || !supplier) {
      return (
          <div className="space-y-6">
              <Skeleton className="h-12 w-1/2"/>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
              </div>
              <Skeleton className="h-96 w-full" />
          </div>
      )
  }

  const outstandingBalance = totalSpend - totalPaid;
  const isBalanceAlertTriggered = supplier.outstandingBalanceAlertThreshold && outstandingBalance > supplier.outstandingBalanceAlertThreshold;


  return (
    <>
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <Building className="h-8 w-8 text-primary"/>
                    {supplier.name}
                </h1>
                <p className="text-muted-foreground">Detailed view of supplier activity and history.</p>
            </div>
            <div className="flex items-center gap-2">
                 <Button size="sm" variant="outline" onClick={() => handleNoteClick('Credit Note')}>Credit Note</Button>
                 <Button size="sm" variant="outline" onClick={() => handleNoteClick('Debit Note')}>Debit Note</Button>
                 <Button size="sm" variant="outline" onClick={() => setIsPaymentSheetOpen(true)}>
                    <Banknote className="mr-2 h-4 w-4"/> Make Payment
                </Button>
                <Button size="sm" onClick={() => setIsPOSheetOpen(true)}>
                    <Receipt className="mr-2 h-4 w-4"/> New Purchase Order
                </Button>
            </div>
        </div>

        {isBalanceAlertTriggered && (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Outstanding balance of <strong>{outstandingBalance.toLocaleString()}</strong> has exceeded the set threshold of <strong>{supplier.outstandingBalanceAlertThreshold?.toLocaleString()}</strong>.
                </AlertDescription>
            </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Spend" value={`${totalSpend.toLocaleString()}`} icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />} description="From all POs" />
            <StatCard title="Total Paid" value={`${totalPaid.toLocaleString()}`} icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />} />
            <StatCard 
                title="Outstanding Balance" 
                value={`${outstandingBalance.toLocaleString()}`} 
                icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />}
            >
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsThresholdDialogOpen(true)}>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground hover:text-primary"/>
                </Button>
            </StatCard>
            <StatCard title="Total Orders" value={purchaseHistory.length.toString()} icon={<Package className="h-4 w-4 text-muted-foreground" />} />
        </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="purchase-history">Purchase History</TabsTrigger>
          <TabsTrigger value="payment-history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Supplier Details</CardTitle>
                    <CardDescription>Contact and product information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground"/>
                        <span className="font-medium">Contact Person:</span>
                        <span>{supplier.contact}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-muted-foreground"/>
                        <span className="font-medium">Phone Number:</span>
                        <span>{supplier.phone}</span>
                    </div>
                     <div className="flex items-start gap-2">
                        <Package className="h-5 w-5 text-muted-foreground mt-1"/>
                        <div>
                            <span className="font-medium">Products Supplied:</span>
                            <p className="text-sm text-muted-foreground">{supplier.products}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="purchase-history" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Purchase History</CardTitle>
                    <CardDescription>List of all purchase orders from this supplier.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PO ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchaseHistory.map(po => (
                                <TableRow key={po.id} onClick={() => setSelectedPoForView(po)} className="cursor-pointer">
                                    <TableCell className="font-medium">{po.id}</TableCell>
                                    <TableCell>{format(new Date(po.date), "PP")}</TableCell>
                                    <TableCell>{po.items.length}</TableCell>
                                     <TableCell>
                                        <Badge variant={po.status === 'Paid' ? 'secondary' : 'destructive'}>{po.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{po.totalAmount.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                             {purchaseHistory.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No purchase orders found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="payment-history" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>List of all payments made to this supplier.</CardDescription>
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
                                    <TableCell>{p.purchaseOrderId ? `PO: ${p.purchaseOrderId}` : p.description || 'N/A'}</TableCell>
                                    <TableCell className="text-right">{p.amount.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                            {paymentHistory.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No payments found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
    <AddPOSheet supplierId={supplier.id} isOpen={isPOSheetOpen} onOpenChange={setIsPOSheetOpen}/>
    <LogPaymentSheet
      isOpen={isPaymentSheetOpen}
      onOpenChange={setIsPaymentSheetOpen}
      defaultSupplierId={supplier.id}
      defaultPoId={selectedPoForPayment?.id || undefined}
    />
     <PurchaseOrderDetailSheet
        po={selectedPoForView}
        isOpen={!!selectedPoForView}
        onOpenChange={(open) => { if (!open) setSelectedPoForView(null) }}
        onLogPaymentClick={handleLogPaymentClick}
    />
     <NewTransactionSheet
      isOpen={isNoteSheetOpen}
      onOpenChange={setIsNoteSheetOpen}
      defaultTransactionType={noteType}
      defaultEntityType="Supplier"
      defaultEntityId={supplier.id}
    />
    <SetThresholdDialog 
        supplier={supplier}
        open={isThresholdDialogOpen}
        onOpenChange={setIsThresholdDialogOpen}
    />
    </>
  )
}
