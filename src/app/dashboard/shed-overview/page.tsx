

"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Warehouse, Pill, Bird, PlusCircle, MoreHorizontal, Percent, Egg, Clock, Users, Wheat, HeartPulse, Shuffle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useToast } from "@/hooks/use-toast"
import { useFarm, Shed } from "@/context/FarmContext"
import { Separator } from "@/components/ui/separator"
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
import ShedDetailSheet from "@/components/dashboard/shed-detail-sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ShedAlertConfigSheet from "@/components/dashboard/shed-alert-config-sheet"


const formatDuration = (hours: number): string => {
    if (isNaN(hours) || hours <= 0) return "N/A";

    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    const remainingMinutes = Math.round((hours - (days * 24) - remainingHours) * 60);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (remainingHours > 0) result += `${remainingHours}h `;
    if (remainingMinutes > 0 && days === 0) result += `${remainingMinutes}m`;
    
    if (!result) return 'Less than a minute';
    return result.trim();
};

const formatWeight = (kg: number) => {
    if (kg >= 1) {
        return `${kg.toFixed(1)} kg`;
    }
    return `${(kg * 1000).toFixed(0)} g`;
};

const FeedStatusGauge = ({ shed, henCount, consumptionRateKgPerHour }: { shed: Shed, henCount: number, consumptionRateKgPerHour: number }) => {
    const [remainingKg, setRemainingKg] = React.useState(shed.feedAtLastRefill);
    const [remainingTime, setRemainingTime] = React.useState<string>("N/A");

    React.useEffect(() => {
        if (henCount === 0 || shed.feedAtLastRefill <= 0 || consumptionRateKgPerHour <= 0 || !shed.lastRefillDate) {
            setRemainingKg(shed.feedAtLastRefill);
            setRemainingTime("N/A");
            return;
        }

        const interval = setInterval(() => {
            const now = new Date();
            const lastLogTime = new Date(shed.lastRefillDate as string);
            const elapsedHours = (now.getTime() - lastLogTime.getTime()) / (1000 * 60 * 60);

            const consumedKg = elapsedHours * consumptionRateKgPerHour;
            const currentKg = Math.max(0, shed.feedAtLastRefill - consumedKg);
            
            const newRemainingHours = currentKg > 0 ? currentKg / consumptionRateKgPerHour : 0;

            setRemainingKg(currentKg);
            setRemainingTime(formatDuration(newRemainingHours));

        }, 1000); // Update every second for smooth countdown

        return () => clearInterval(interval);

    }, [shed.feedAtLastRefill, shed.lastRefillDate, henCount, consumptionRateKgPerHour]);

    const percentage = shed.feedAtLastRefill > 0 ? (remainingKg / shed.feedAtLastRefill) * 100 : 0;
    
    // Calculate color based on percentage (Green HSL(120) to Red HSL(0))
    const hue = (percentage / 100) * 120;
    const colorStyle = { backgroundColor: `hsl(${hue}, 80%, 45%)` };

    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between">
                <span className="font-medium">Feed Remaining</span>
                <span className="text-sm text-muted-foreground font-bold">{formatWeight(remainingKg)}</span>
            </div>
            <Progress value={percentage} aria-label={`${remainingKg}kg feed remaining`} indicatorStyle={colorStyle} />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Est. {remainingTime} left</span>
            </div>
        </div>
    )
}

const EggCollectionSheet = ({ shed, isOpen, onOpenChange }: { shed: (Shed & { layerCount: number }) | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const { toast } = useToast();
    const { logEggCollection } = useFarm();
    const [largeEggs, setLargeEggs] = React.useState("");
    const [mediumEggs, setMediumEggs] = React.useState("");
    const [smallEggs, setSmallEggs] = React.useState("");
    const [damagedEggs, setDamagedEggs] = React.useState("");
    const [notes, setNotes] = React.useState("");

    React.useEffect(() => {
        if (!isOpen) {
            setLargeEggs("");
            setMediumEggs("");
            setSmallEggs("");
            setDamagedEggs("");
            setNotes("");
        }
    }, [isOpen]);
    
    if (!shed) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const large = parseInt(largeEggs) || 0;
        const medium = parseInt(mediumEggs) || 0;
        const small = parseInt(smallEggs) || 0;

        if (large + medium + small === 0) {
            toast({ title: "Error", description: "Please enter at least one egg size quantity.", variant: "destructive" });
            return;
        }
        
        const result = logEggCollection({
            shed: shed.name,
            large, medium, small,
            damaged: parseInt(damagedEggs) || 0,
            notes,
        });
        
        if (result.success) {
            toast({ title: "Log Submitted", description: result.message });
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent>
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <SheetTitle className="font-headline">Log Egg Collection for {shed.name}</SheetTitle>
                        <SheetDescription>
                            Enter today's collection data. This will be added to any existing log for today.
                        </SheetDescription>
                    </SheetHeader>
                     <div className="!mt-2 flex items-center text-sm font-medium text-foreground">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground"/>
                        {shed.layerCount} Layers in this shed.
                    </div>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             <div className="grid gap-2">
                                <Label htmlFor="large-eggs">Large</Label>
                                <Input id="large-eggs" type="number" placeholder="e.g., 200" value={largeEggs} onChange={e => setLargeEggs(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="medium-eggs">Medium</Label>
                                <Input id="medium-eggs" type="number" placeholder="e.g., 150" value={mediumEggs} onChange={e => setMediumEggs(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="small-eggs">Small</Label>
                                <Input id="small-eggs" type="number" placeholder="e.g., 100" value={smallEggs} onChange={e => setSmallEggs(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="damaged-eggs">Damaged Eggs</Label>
                            <Input id="damaged-eggs" type="number" placeholder="e.g., 5" value={damagedEggs} onChange={e => setDamagedEggs(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" placeholder="Any observations..." value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    </div>
                    <SheetFooter>
                        <Button type="submit">Save Log</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}

const LogFeedSheet = ({ shed, isOpen, onOpenChange }: { shed: Shed | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const { toast } = useToast();
    const { logFeedConsumption, feedMixes } = useFarm();
    const [logMix, setLogMix] = React.useState("");
    const [logQuantity, setLogQuantity] = React.useState("");

    React.useEffect(() => {
        if (!isOpen) {
            setLogMix("");
            setLogQuantity("");
        }
    }, [isOpen]);

    if (!shed) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!shed || !logMix || !logQuantity) {
             toast({ title: "Error", description: "Please fill out all fields.", variant: "destructive" })
            return;
        }
        
        const result = logFeedConsumption({
            shed: shed.name,
            consumptionType: 'FeedMix',
            itemId: logMix,
            quantity: parseFloat(logQuantity),
            unit: 'kg',
        });

        if (result.success) {
            toast({ title: "Feed Log Submitted", description: result.message });
            onOpenChange(false);
        } else {
             toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent>
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <SheetTitle className="font-headline">Log Feed Consumption for {shed.name}</SheetTitle>
                        <SheetDescription>Log daily feed consumption to automatically update stock levels.</SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="feed-mix">Feed Mix</Label>
                            <Select value={logMix} onValueChange={setLogMix} disabled={feedMixes.length === 0}>
                                <SelectTrigger id="feed-mix">
                                    <SelectValue placeholder={feedMixes.length === 0 ? "Create a feed mix first" : "Select feed type"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {feedMixes.map(mix => (<SelectItem key={mix.id} value={mix.id}>{mix.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Quantity Consumed (kg)</Label>
                            <Input id="quantity" type="number" placeholder="e.g., 25" value={logQuantity} onChange={e => setLogQuantity(e.target.value)} />
                        </div>
                    </div>
                    <SheetFooter>
                        <Button type="submit" className="w-full">Submit Log & Update Stock</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}

const LogHealthSheet = ({ shed, isOpen, onOpenChange }: { shed: Shed | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const { toast } = useToast();
    const { logFeedConsumption, feedStockData } = useFarm();
    const [logMedItem, setLogMedItem] = React.useState("");
    const [logMedQuantity, setLogMedQuantity] = React.useState("");

    React.useEffect(() => {
        if (!isOpen) {
            setLogMedItem("");
            setLogMedQuantity("");
        }
    }, [isOpen]);

    if (!shed) return null;

    const healthStockItems = feedStockData.filter(fs => fs.category === 'Health');
    const selectedStockItem = healthStockItems.find(fs => fs.id === logMedItem);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!shed || !logMedItem || !logMedQuantity) {
            toast({ title: "Error", description: "Please fill out all fields.", variant: "destructive" });
            return;
        }
        
        if (!selectedStockItem) {
             toast({ title: "Error", description: "Selected health item not found.", variant: "destructive" });
             return;
        }

        const result = logFeedConsumption({
            shed: shed.name,
            consumptionType: 'Health',
            itemId: logMedItem,
            quantity: parseFloat(logMedQuantity),
            unit: selectedStockItem.unit
        });

        if (result.success) {
            toast({ title: "Health Log Submitted", description: result.message });
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };
    
    return (
         <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent>
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <SheetTitle className="font-headline">Log Health Consumption for {shed.name}</SheetTitle>
                        <SheetDescription>Log medicines or supplements given to a shed.</SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="med-item">Medicine/Supplement</Label>
                            <Select value={logMedItem} onValueChange={setLogMedItem}>
                                <SelectTrigger id="med-item"><SelectValue placeholder="Select an item" /></SelectTrigger>
                                <SelectContent>
                                    {healthStockItems.map(item => (
                                        <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="med-quantity">Quantity Consumed</Label>
                            <Input 
                                id="med-quantity" 
                                type="number" 
                                placeholder={`e.g., 100 (${selectedStockItem?.unit || 'units'})`} 
                                value={logMedQuantity} 
                                onChange={e => setLogMedQuantity(e.target.value)} 
                            />
                        </div>
                    </div>
                    <SheetFooter>
                        <Button type="submit" className="w-full">Submit Health Log</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}

const TransferChickSheet = ({ shed, isOpen, onOpenChange }: { shed: Shed | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const { toast } = useToast();
    const { transferChickBatch, chickData, allSheds } = useFarm();
    
    const [transferBatchId, setTransferBatchId] = React.useState("");
    const [transferNewType, setTransferNewType] = React.useState("");
    const [transferNewShed, setTransferNewShed] = React.useState("");
    const [transferQuantity, setTransferQuantity] = React.useState("");

    const batchesInShed = React.useMemo(() => {
        if (!shed) return [];
        return chickData.filter(b => b.shed === shed.name);
    }, [chickData, shed]);

    React.useEffect(() => {
        if (!isOpen) {
            setTransferBatchId("");
            setTransferNewType("");
            setTransferNewShed("");
            setTransferQuantity("");
        }
    }, [isOpen]);

    if (!shed) return null;

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
            onOpenChange(false);
        } else {
            toast({
                title: "Transfer Error",
                description: result.message,
                variant: "destructive"
            });
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent>
                <form onSubmit={handleTransferSubmit}>
                    <SheetHeader>
                        <SheetTitle className="font-headline">Transfer from {shed.name}</SheetTitle>
                        <SheetDescription>
                            Split a batch by transferring a specific quantity to another shed.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="transfer-batchId" className="text-right">
                                Batch ID
                            </Label>
                            <Select onValueChange={setTransferBatchId} value={transferBatchId} required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a batch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {batchesInShed.map((b) => (
                                            <SelectItem key={b.batchId} value={b.batchId}>
                                                {b.batchId} ({b.type}, {b.quantity} birds)
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="transfer-quantity" className="text-right">
                                Quantity
                            </Label>
                            <Input id="transfer-quantity" type="number" className="col-span-3" placeholder="e.g., 100" value={transferQuantity} onChange={(e) => setTransferQuantity(e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="transfer-new-shed" className="text-right">
                                New Shed
                            </Label>
                            <Select onValueChange={setTransferNewShed} value={transferNewShed} required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Move to new shed" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allSheds.filter(s => s !== shed.name).map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
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
    )
}


export default function ShedOverviewPage() {
  const { toast } = useToast()
  const { getShedsWithDetails, addShed, deleteShed, chickData, isLoading, todaysTotalEggCollection } = useFarm()
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false)
  const [newShedName, setNewShedName] = React.useState("")
  const [selectedShed, setSelectedShed] = React.useState<any | null>(null)
  const [selectedShedForEggLog, setSelectedShedForEggLog] = React.useState<(Shed & { layerCount: number }) | null>(null);
  const [selectedShedForFeedLog, setSelectedShedForFeedLog] = React.useState<Shed | null>(null);
  const [selectedShedForHealthLog, setSelectedShedForHealthLog] = React.useState<Shed | null>(null);
  const [selectedShedForTransfer, setSelectedShedForTransfer] = React.useState<Shed | null>(null);
  const [selectedShedForAlerts, setSelectedShedForAlerts] = React.useState<Shed | null>(null);


  const sheds = getShedsWithDetails ? getShedsWithDetails() : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newShedName.trim()) {
      toast({
        title: "Error",
        description: "Shed name cannot be empty.",
        variant: "destructive",
      })
      return
    }

    const result = addShed(newShedName.trim())
    
    if (result.success) {
      toast({
        title: "Shed Added",
        description: `Shed "${newShedName.trim()}" has been successfully added.`,
      })
      setNewShedName("")
      setIsAddSheetOpen(false)
    } else {
       toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handleDelete = (shedNameToDelete: string) => {
    if (chickData.some(chick => chick.shed === shedNameToDelete && chick.quantity > 0)) {
      toast({
        title: "Deletion Failed",
        description: `Cannot delete "${shedNameToDelete}" because it contains active batches. Please transfer all birds first.`,
        variant: "destructive",
      })
      return;
    }
    deleteShed(shedNameToDelete)
    toast({
      title: "Shed Deleted",
      description: `Shed "${shedNameToDelete}" has been removed.`,
    })
  }


  return (
    <>
    <div className="flex flex-col gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Egg className="h-6 w-6 text-primary"/>
                    Today's Consolidated Egg Production
                </CardTitle>
                <CardDescription>
                    Total eggs collected from all sheds for the day.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-10 w-48" />
                ) : (
                    <p className="text-4xl font-bold">{todaysTotalEggCollection.toLocaleString()} <span className="text-xl font-medium text-muted-foreground">eggs</span></p>
                )}
            </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Warehouse className="h-6 w-6" />
                Shed Overview
              </CardTitle>
              <CardDescription>
                View, add, and manage all your sheds. Click a shed for details.
              </CardDescription>
            </div>
            <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Add Shed
                </Button>
              </SheetTrigger>
              <SheetContent>
                <form onSubmit={handleSubmit}>
                  <SheetHeader>
                    <SheetTitle className="font-headline">Add New Shed</SheetTitle>
                    <SheetDescription>
                      Enter a unique name for the new shed.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="shedName" className="text-right">
                        Shed Name
                      </Label>
                      <Input
                        id="shedName"
                        className="col-span-3"
                        placeholder="e.g., Shed-D1"
                        value={newShedName}
                        onChange={(e) => setNewShedName(e.target.value)}
                      />
                    </div>
                  </div>
                  <SheetFooter>
                    <Button type="submit">Save Shed</Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {sheds.map((shed) => (
                <Card
                  key={shed.name}
                  className="flex flex-col"
                >
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div onClick={() => setSelectedShed(shed)} className="cursor-pointer flex-grow">
                          <CardTitle className="flex items-center gap-2 font-headline">
                            <Warehouse className="h-6 w-6" />
                            {shed.name}
                          </CardTitle>
                          <CardDescription>
                            Current status and inventory.
                          </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button onClick={(e) => e.stopPropagation()} aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => setSelectedShed(shed)}>View Details</DropdownMenuItem>
                          <Separator className="my-1"/>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. You can only delete sheds that are empty.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(shed.name)}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="grid gap-4 flex-grow" onClick={() => setSelectedShed(shed)} >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bird className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">Total Hens</span>
                        </div>
                        <span className="text-lg font-bold">{shed.henCount.toLocaleString()}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <p className="text-muted-foreground">Chicks</p>
                          <p className="font-bold">{shed.chickCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Layers</p>
                          <p className="font-bold">{shed.layerCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Dated</p>
                          <p className="font-bold">{shed.datedCount.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Percent className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">Production %</span>
                        </div>
                        <span className={`text-lg font-bold ${shed.productionPercentage > 0 ? '' : 'text-muted-foreground'}`}>
                          {shed.productionPercentage.toFixed(1)}%
                        </span>
                      </div>
                      
                      <Separator />

                      <FeedStatusGauge 
                          shed={shed}
                          henCount={shed.henCount}
                          consumptionRateKgPerHour={shed.consumptionRateKgPerHour}
                      />

                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                              <Pill className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">Medications Due</span>
                          </div>
                        <span className={`text-lg font-bold ${shed.medsDue > 0 ? 'text-destructive' : ''}`}>{shed.medsDue}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="grid grid-cols-5 gap-2">
                        <Button variant="outline" size="icon" onClick={() => setSelectedShedForEggLog(shed)}>
                            <Egg className="h-4 w-4"/>
                            <span className="sr-only">Log Eggs</span>
                        </Button>
                         <Button variant="outline" size="icon" onClick={() => setSelectedShedForFeedLog(shed)}>
                            <Wheat className="h-4 w-4"/>
                            <span className="sr-only">Log Feed</span>
                        </Button>
                         <Button variant="outline" size="icon" onClick={() => setSelectedShedForHealthLog(shed)}>
                            <HeartPulse className="h-4 w-4"/>
                            <span className="sr-only">Log Health</span>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setSelectedShedForTransfer(shed)}>
                            <Shuffle className="h-4 w-4"/>
                            <span className="sr-only">Transfer Batch</span>
                        </Button>
                        <Button variant="outline" size="icon" className="text-destructive" onClick={() => setSelectedShedForAlerts(shed)}>
                            <AlertTriangle className="h-4 w-4"/>
                            <span className="sr-only">Configure Alerts</span>
                        </Button>
                    </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
    </div>
    <ShedDetailSheet
        shed={selectedShed}
        isOpen={!!selectedShed}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
            setSelectedShed(null);
            }
        }}
    />
    <EggCollectionSheet
        shed={selectedShedForEggLog}
        isOpen={!!selectedShedForEggLog}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
            setSelectedShedForEggLog(null);
            }
        }}
    />
     <LogFeedSheet
        shed={selectedShedForFeedLog}
        isOpen={!!selectedShedForFeedLog}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
            setSelectedShedForFeedLog(null);
            }
        }}
    />
     <LogHealthSheet
        shed={selectedShedForHealthLog}
        isOpen={!!selectedShedForHealthLog}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
            setSelectedShedForHealthLog(null);
            }
        }}
    />
    <TransferChickSheet
        shed={selectedShedForTransfer}
        isOpen={!!selectedShedForTransfer}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
                setSelectedShedForTransfer(null);
            }
        }}
    />
    <ShedAlertConfigSheet
        shed={selectedShedForAlerts}
        isOpen={!!selectedShedForAlerts}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
                setSelectedShedForAlerts(null);
            }
        }}
    />
    </>
  )
}

    
