

"use client"

import * as React from "react"
import { format } from "date-fns"
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
  CardFooter,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  PlusCircle,
  CalendarIcon,
  Bird,
  CalendarClock,
  Shuffle,
  ArrowUpDown,
  Users,
} from "lucide-react"
import { EggIcon } from "@/components/icons"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useFarm, Chick, HealthEntry } from "@/context/FarmContext"
import { Skeleton } from "@/components/ui/skeleton"

const eventTypeVariant = {
  Vaccination: "secondary",
  Medication: "default",
  Mortality: "destructive",
  "Check-up": "outline",
}

type SortKey = keyof Chick | 'age' | 'quantity';
type SortDirection = "asc" | "desc";

const healthEventTypes = ["Vaccination", "Medication", "Mortality", "Check-up"];
const paymentMethods = ["Bank Transfer", "Cash", "Cheque", "Online"];

export default function ChickManagementPage() {
  const { toast } = useToast()
  const {
    chickData,
    directAddChickBatch,
    transferChickBatch,
    allSheds,
    suppliersData,
    isLoading,
    healthData,
    addHealthLog,
    bankAccounts,
    itemMaster
  } = useFarm()
  const [isBatchSheetOpen, setIsBatchSheetOpen] = React.useState(false)
  const [isHealthSheetOpen, setIsHealthSheetOpen] = React.useState(false)
  const [isTransferSheetOpen, setIsTransferSheetOpen] = React.useState(false)

  // State for new batch form
  const [breed, setBreed] = React.useState("")
  const [type, setType] = React.useState("")
  const [quantity, setQuantity] = React.useState("")
  const [age, setAge] = React.useState("")
  const [shed, setShed] = React.useState("")
  const [supplierId, setSupplierId] = React.useState("")
  const [referenceNumber, setReferenceNumber] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [costPerChick, setCostPerChick] = React.useState("");
  const [totalAmount, setTotalAmount] = React.useState("");
  
  // State for transfer batch form
  const [transferFromShed, setTransferFromShed] = React.useState("")
  const [transferBatchId, setTransferBatchId] = React.useState("")
  const [transferNewType, setTransferNewType] = React.useState("")
  const [transferNewShed, setTransferNewShed] = React.useState("")
  const [transferQuantity, setTransferQuantity] = React.useState("")

  // State for new health record form
  const [healthBatchId, setHealthBatchId] = React.useState("");
  const [healthEventType, setHealthEventType] = React.useState("");
  const [healthDetails, setHealthDetails] = React.useState("");
  const [healthQuantity, setHealthQuantity] = React.useState("");

  // State for filters and sorting
  const [filterType, setFilterType] = React.useState("all")
  const [filterShed, setFilterShed] = React.useState("all")
  const [filterSupplier, setFilterSupplier] = React.useState("all")
  const [sortKey, setSortKey] = React.useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");

  const ageInWeeks = React.useMemo(() => {
    const ageInDays = parseInt(age, 10);
    if (isNaN(ageInDays) || ageInDays <= 0) return null;
    const weeks = Math.floor(ageInDays / 7);
    const days = ageInDays % 7;
    let result = `${weeks} week${weeks !== 1 ? 's' : ''}`;
    if (days > 0) {
      result += `, ${days} day${days !== 1 ? 's' : ''}`;
    }
    return `(~${result})`;
  }, [age]);

  const chickMasterItems = React.useMemo(() => {
    return itemMaster.filter(item => item.category === "Chicks");
  }, [itemMaster]);

  const resetBatchForm = () => {
    setBreed("");
    setQuantity("");
    setAge("");
    setShed("");
    setSupplierId("");
    setType("");
    setReferenceNumber("");
    setNotes("");
    setCostPerChick("");
    setTotalAmount("");
    setIsBatchSheetOpen(false);
  }
  
  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    const qty = parseFloat(value);
    const cost = parseFloat(costPerChick);
    if (!isNaN(qty) && !isNaN(cost) && qty > 0 && cost > 0) {
        setTotalAmount(Math.round(qty * cost).toString());
    } else if (value === "" || qty === 0) {
        setTotalAmount("");
    }
  };

  const handleCostChange = (value: string) => {
    setCostPerChick(value);
    const qty = parseFloat(quantity);
    const cost = parseFloat(value);
    if (!isNaN(qty) && !isNaN(cost) && qty > 0 && cost > 0) {
        setTotalAmount(Math.round(qty * cost).toString());
    } else {
        setTotalAmount("");
    }
  };
  
  const handleTotalAmountChange = (value: string) => {
    const intValue = value.replace(/\D/g, ''); // Remove non-digits
    setTotalAmount(intValue);
    const total = parseInt(intValue, 10);
    const qty = parseFloat(quantity);
    if (!isNaN(total) && !isNaN(qty) && total >= 0 && qty > 0) {
        setCostPerChick((total / qty).toFixed(2));
    } else if (intValue === "") {
        setCostPerChick("");
    }
  };


  const resetHealthForm = () => {
    setHealthBatchId("");
    setHealthEventType("");
    setHealthDetails("");
    setHealthQuantity("");
    setIsHealthSheetOpen(false);
  }

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!breed || !type || !quantity || !age || !shed || !supplierId) {
      toast({
        title: "Error",
        description: "Please fill out all required fields.",
        variant: "destructive",
      })
      return
    }
    
     if ((!costPerChick && !totalAmount) || (parseFloat(costPerChick) <= 0 && parseInt(totalAmount) <= 0)) {
        toast({ title: "Error", description: "Please provide a valid cost.", variant: "destructive"});
        return;
    }

    const supplierDetails = suppliersData.find(s => s.id === supplierId);
    if (!supplierDetails) {
        toast({ title: "Error", description: "Selected supplier not found.", variant: "destructive" });
        return;
    }

    const result = directAddChickBatch({
      breed,
      shed,
      quantity: parseInt(quantity, 10),
      age: parseInt(age, 10),
      supplier: supplierDetails.name,
      type: type as "Chick" | "Layer" | "Dated",
      referenceNumber,
      notes,
      costPerChick: parseFloat(costPerChick),
      totalAmount: parseFloat(totalAmount),
      supplierId: supplierId,
    });

    if (result.success) {
        toast({
            title: "PO Created",
            description: result.message,
        });
        resetBatchForm();
    } else {
        toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
        })
    }
  }

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const transferQty = parseInt(transferQuantity, 10);
    
    if (!transferBatchId) {
      toast({ title: "Error", description: "Please select a valid batch to transfer from.", variant: "destructive" });
      return;
    }
    if (transferQty <= 0) {
      toast({ title: "Error", description: "Please enter a positive quantity to transfer.", variant: "destructive" });
      return;
    }
    if (!transferNewShed) {
      toast({ title: "Error", description: "Please select a new shed for the transferred batch.", variant: "destructive" });
      return;
    }

    const sourceBatch = chickData.find((b) => b.batchId === transferBatchId);

    if (!sourceBatch) {
      toast({ title: "Error", description: "Source batch not found. Please refresh.", variant: "destructive" });
      return;
    }

    if (transferQty > sourceBatch.quantity) {
      toast({
        title: "Error",
        description: `Transfer quantity (${transferQty}) cannot be more than the available quantity in the batch (${sourceBatch.quantity}).`,
        variant: "destructive",
      });
      return;
    }
    
    const result = transferChickBatch(
        transferBatchId,
        transferQty,
        transferNewType as any,
        transferNewShed
    );

    if (result.success) {
        toast({
            title: "Batch Transfer Successful",
            description: result.message,
        });
        handleTransferSheetOpenChange(false);
    } else {
        toast({
            title: "Transfer Error",
            description: result.message,
            variant: "destructive"
        });
    }
  };


  const handleHealthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!healthBatchId || !healthEventType || !healthDetails) {
       toast({
        title: "Error",
        description: "Batch ID, Event Type, and Details are required.",
        variant: "destructive",
      });
      return;
    }

    if (healthEventType === 'Mortality' && (!healthQuantity || parseInt(healthQuantity) <= 0)) {
        toast({
            title: "Error",
            description: "Please enter a valid, positive quantity for mortality.",
            variant: "destructive",
        });
        return;
    }
    
    const result = addHealthLog({
        batchId: healthBatchId,
        eventType: healthEventType,
        details: healthDetails,
        quantity: parseInt(healthQuantity) || 0,
    });

    if(result.success) {
        toast({
          title: "Record Added",
          description: result.message,
        });
        resetHealthForm();
    } else {
         toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
    }
  }
  
  const handleTransferSheetOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        setTransferFromShed("")
        setTransferBatchId("")
        setTransferNewType("")
        setTransferNewShed("")
        setTransferQuantity("")
    }
    setIsTransferSheetOpen(isOpen)
  }

  // Calculate totals
  const totals = React.useMemo(() => {
    if (isLoading) return { chicks: 0, layers: 0, dated: 0, total: 0 };
    const result = chickData.reduce(
      (acc, batch) => {
        if (batch.type === "Chick") acc.chicks += batch.quantity
        if (batch.type === "Layer") acc.layers += batch.quantity
        if (batch.type === "Dated") acc.dated += batch.quantity
        return acc
      },
      { chicks: 0, layers: 0, dated: 0 }
    );
    return {
      ...result,
      total: result.chicks + result.layers + result.dated,
    }
  }, [chickData, isLoading])

  // Unique values for filters from context
  const uniqueShedsForFilter = useFarm().allSheds;
  const uniqueSuppliersForFilter = useFarm().uniqueSuppliers;

  // Filtered and sorted data for table
   const processedChickData = React.useMemo(() => {
    return chickData
      .filter((batch) => {
        const typeMatch = filterType === "all" || batch.type === filterType
        const shedMatch = filterShed === "all" || batch.shed === filterShed
        const supplierMatch = filterSupplier === "all" || batch.supplier === filterSupplier
        return typeMatch && shedMatch && supplierMatch
      })
      .sort((a, b) => {
        let valA, valB;

        switch (sortKey) {
            case 'age':
                valA = a.age || 0;
                valB = b.age || 0;
                break;
            case 'quantity':
                valA = a.quantity;
                valB = b.quantity;
                break;
            case 'createdAt':
                valA = new Date(a.createdAt).getTime();
                valB = new Date(b.createdAt).getTime();
                break;
            default:
                valA = a[sortKey as keyof Chick];
                valB = b[sortKey as keyof Chick];
        }
        
        if(valA === undefined || valA === null) return 1;
        if(valB === undefined || valB === null) return -1;

        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        
        if (typeof valA === 'number' && typeof valB === 'number') {
           return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [chickData, filterType, filterShed, filterSupplier, sortKey, sortDirection]);

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
  )


  const StatCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">
            {value.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Chick Management</CardTitle>
          <CardDescription>
            Manage all chick batches from arrival to transfer, and monitor their
            health.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
            <Sheet open={isTransferSheetOpen} onOpenChange={handleTransferSheetOpenChange}>
                <SheetTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1">
                        <Shuffle className="h-4 w-4" />
                        Transfer Batch
                    </Button>
                </SheetTrigger>
                <SheetContent>
                    <form onSubmit={handleTransferSubmit}>
                        <SheetHeader>
                            <SheetTitle className="font-headline">
                                Transfer / Split Chick Batch
                            </SheetTitle>
                            <SheetDescription>
                                Split a batch by transferring a specific quantity. This will reduce the source batch quantity and create a new batch with the specified type and shed.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="transfer-from-shed" className="text-right">
                                    From Shed
                                </Label>
                                <Select
                                    onValueChange={(value) => {
                                        setTransferFromShed(value)
                                        setTransferBatchId("") // Reset batch when shed changes
                                    }}
                                    value={transferFromShed}
                                    required
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a shed" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allSheds.map((s, index) => (
                                            <SelectItem key={`${s}-${index}`} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="transfer-batchId" className="text-right">
                                    Batch ID
                                </Label>
                                <Select
                                    onValueChange={setTransferBatchId}
                                    value={transferBatchId}
                                    required
                                    disabled={!transferFromShed}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {chickData
                                            .filter((b) => b.shed === transferFromShed)
                                            .map((b) => (
                                                <SelectItem key={b.batchId} value={b.batchId}>
                                                    {b.batchId} ({b.type}, {b.quantity} birds)
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="transfer-quantity" className="text-right">
                                    Quantity to Transfer
                                </Label>
                                <Input
                                    id="transfer-quantity"
                                    type="number"
                                    className="col-span-3"
                                    placeholder="e.g., 100"
                                    value={transferQuantity}
                                    onChange={(e) => setTransferQuantity(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="transfer-new-shed" className="text-right">
                                    New Shed
                                </Label>
                                <Select onValueChange={setTransferNewShed} value={transferNewShed} required>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Move to new shed (Required)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allSheds.filter(s => s !== transferFromShed).map((s, index) => (
                                            <SelectItem key={`${s}-${index}`} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="transfer-new-type" className="text-right">
                                    New Type
                                </Label>
                                <Select onValueChange={setTransferNewType} value={transferNewType}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Change type (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Chick">Chick</SelectItem>
                                        <SelectItem value="Layer">Layer</SelectItem>
                                        <SelectItem value="Dated">Dated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <SheetFooter>
                            <Button type="submit">Confirm Transfer</Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <Sheet open={isBatchSheetOpen} onOpenChange={setIsBatchSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-4 w-4" />
                  New Batch
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                <form onSubmit={handleBatchSubmit}>
                  <SheetHeader>
                    <SheetTitle className="font-headline">
                      Procure New Chick Batch
                    </SheetTitle>
                    <SheetDescription>
                      This will create a pending Purchase Order for the new batch. Payment must be logged separately.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 py-4 px-1">
                    <div className="grid grid-cols-4 items-center gap-x-4">
                      <Label htmlFor="breed" className="text-right">
                        Breed
                      </Label>
                       <Select onValueChange={setBreed} value={breed}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a chick breed" />
                          </SelectTrigger>
                          <SelectContent>
                            {chickMasterItems.map((item) => (
                              <SelectItem key={item.id} value={item.name}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-x-4">
                      <Label htmlFor="type" className="text-right">
                        Type
                      </Label>
                      <Select onValueChange={setType} value={type}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select batch type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Chick">Chick</SelectItem>
                          <SelectItem value="Layer">Layer</SelectItem>
                          <SelectItem value="Dated">Dated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-x-4">
                      <Label htmlFor="supplier" className="text-right">
                        Supplier
                      </Label>
                      <Select onValueChange={setSupplierId} value={supplierId}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliersData.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-x-4">
                      <Label htmlFor="quantity" className="text-right">
                        Quantity
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        className="col-span-3"
                        placeholder="e.g., 1500"
                        value={quantity}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                      />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-x-4">
                       <div className="text-right space-y-1">
                          <Label htmlFor="age">Age (days)</Label>
                       </div>
                       <div className="col-span-3 flex items-center gap-2">
                        <Input
                            id="age"
                            type="number"
                            className="flex-1"
                            placeholder="e.g., 21"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                          />
                         {ageInWeeks && (
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {ageInWeeks}
                            </span>
                          )}
                       </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-x-4">
                        <Label htmlFor="cost-per-chick" className="text-right">Cost Per Chick</Label>
                        <Input id="cost-per-chick" type="number" placeholder="e.g., 42.50" className="col-span-3" value={costPerChick} onChange={(e) => handleCostChange(e.target.value)} />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-x-4">
                        <Label htmlFor="total-amount" className="text-right">Total Amount</Label>
                        <Input id="total-amount" type="text" inputMode="numeric" placeholder="Calculated automatically" className="col-span-3" value={totalAmount} onChange={(e) => handleTotalAmountChange(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-x-4">
                      <Label htmlFor="shed" className="text-right">
                        Initial Shed
                      </Label>
                      <Select onValueChange={setShed} value={shed}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Assign a shed" />
                        </SelectTrigger>
                        <SelectContent>
                          {allSheds.map((s, index) => <SelectItem key={`${s}-${index}`} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-x-4">
                      <Label htmlFor="ref-no" className="text-right">
                        Ref. Number
                      </Label>
                      <Input
                        id="ref-no"
                        className="col-span-3"
                        placeholder="e.g., Supplier's Invoice No."
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                      />
                    </div>
                     <div className="grid grid-cols-4 items-start gap-x-4">
                      <Label htmlFor="notes" className="text-right pt-2">
                        Notes
                      </Label>
                       <Textarea
                        id="notes"
                        className="col-span-3"
                        placeholder="Any comments or notes about this procurement..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <SheetFooter>
                    <Button type="submit">Create Purchase Order</Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Hens" value={totals.total} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
          <StatCard title="Total Chicks" value={totals.chicks} icon={<Bird className="h-4 w-4 text-muted-foreground" />} />
          <StatCard title="Total Layers" value={totals.layers} icon={<EggIcon className="h-4 w-4 text-muted-foreground" />} />
          <StatCard title="Total Dated" value={totals.dated} icon={<CalendarClock className="h-4 w-4 text-muted-foreground" />} />
        </div>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Batch Overview</TabsTrigger>
            <TabsTrigger value="health">Health & Vaccination</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <div className="mb-4 flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Chick">Chick</SelectItem>
                  <SelectItem value="Layer">Layer</SelectItem>
                  <SelectItem value="Dated">Dated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterShed} onValueChange={setFilterShed}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Shed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sheds</SelectItem>
                  {uniqueShedsForFilter.map((shed, index) => (
                    <SelectItem key={`${shed}-${index}`} value={shed}>
                      {shed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterSupplier}
                onValueChange={setFilterSupplier}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {uniqueSuppliersForFilter.map((sup, index) => (
                    <SelectItem key={`${sup}-${index}`} value={sup}>
                      {sup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader sortKey="batchId">Batch ID</SortableHeader>
                  <SortableHeader sortKey="type">Type</SortableHeader>
                  <SortableHeader sortKey="breed">Breed</SortableHeader>
                  <SortableHeader sortKey="supplier">Supplier</SortableHeader>
                  <SortableHeader sortKey="createdAt">Created At</SortableHeader>
                  <SortableHeader sortKey="shed">Shed</SortableHeader>
                  <SortableHeader sortKey="quantity">Quantity</SortableHeader>
                  <SortableHeader sortKey="age">Age (days)</SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={8}>
                                <Skeleton className="h-8 w-full" />
                            </TableCell>
                        </TableRow>
                    ))
                ) : processedChickData.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center h-24">
                            No batches found.
                        </TableCell>
                    </TableRow>
                ) : (
                    processedChickData.map((batch) => (
                    <TableRow key={batch.batchId}>
                        <TableCell className="font-medium">
                        {batch.batchId}
                        </TableCell>
                        <TableCell>
                        <Badge variant="outline">{batch.type}</Badge>
                        </TableCell>
                        <TableCell>{batch.breed}</TableCell>
                        <TableCell>{batch.supplier}</TableCell>
                        <TableCell>{format(new Date(batch.createdAt), "PPpp")}</TableCell>
                        <TableCell>{batch.shed}</TableCell>
                        <TableCell className="text-right">
                        {batch.quantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">{batch.age}</TableCell>
                    </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="health" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Health Log</CardTitle>
                  <CardDescription>
                    Track vaccinations, medications, and mortality.
                  </CardDescription>
                </div>
                <Sheet
                  open={isHealthSheetOpen}
                  onOpenChange={setIsHealthSheetOpen}
                >
                  <SheetTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1">
                      <PlusCircle className="h-4 w-4" />
                      Add Record
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <form onSubmit={handleHealthSubmit}>
                      <SheetHeader>
                        <SheetTitle className="font-headline">
                          Add Health Record
                        </SheetTitle>
                        <SheetDescription>
                          Log a new health event for a batch.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label
                            htmlFor="health-batch"
                            className="text-right"
                          >
                            Batch ID
                          </Label>
                          <Select value={healthBatchId} onValueChange={setHealthBatchId}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select batch" />
                            </SelectTrigger>
                            <SelectContent>
                              {chickData.map((b) => (
                                <SelectItem key={b.batchId} value={b.batchId}>
                                  {b.batchId} ({b.shed})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="event-type" className="text-right">
                            Event Type
                          </Label>
                          <Select value={healthEventType} onValueChange={setHealthEventType}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {healthEventTypes.map((type, index) => (
                                <SelectItem key={`${type}-${index}`} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="details" className="text-right">
                            Details
                          </Label>
                          <Input
                            id="details"
                            className="col-span-3"
                            placeholder="e.g., Lasota vaccine, Number of deaths"
                            value={healthDetails}
                            onChange={e => setHealthDetails(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                           <Label htmlFor="quantity" className="text-right">
                            {healthEventType === 'Mortality' ? 'Number of Mortalities' : 'Quantity'}
                          </Label>
                          <Input
                            id="quantity"
                            type="number"
                            className="col-span-3"
                            placeholder={healthEventType === 'Mortality' ? 'e.g., 5' : "e.g., 15 (if applicable)"}
                            value={healthQuantity}
                            onChange={e => setHealthQuantity(e.target.value)}
                            required={healthEventType === 'Mortality'}
                          />
                        </div>
                      </div>
                      <SheetFooter>
                        <Button type="submit">Save Record</Button>
                      </SheetFooter>
                    </form>
                  </SheetContent>
                </Sheet>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {healthData.map((log) => (
                      <TableRow key={log.logId}>
                        <TableCell className="font-medium">
                          {log.batchId}
                        </TableCell>
                        <TableCell>{format(new Date(log.date), "PP")}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              eventTypeVariant[
                                log.eventType as keyof typeof eventTypeVariant
                              ] as any
                            }
                          >
                            {log.eventType}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.details}</TableCell>
                        <TableCell className="text-right">
                          {log.quantity > 0 ? log.quantity : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {healthData.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                                No health records found.
                            </TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

    
