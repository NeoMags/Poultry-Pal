

"use client"

import * as React from "react"
import { format } from "date-fns"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Wheat, PlusCircle, Box, CalendarIcon, Trash2, Edit, Percent, MoreVertical, History, X, HeartPulse } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFarm, FeedStock, FeedMix, FeedMixIngredient, FeedConsumptionLog, ItemMaster, PurchaseOrderItem } from "@/context/FarmContext"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
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
import AddPOSheet from "@/components/dashboard/add-po-sheet"


export default function FeedManagerPage() {
    const { toast } = useToast()
    const { 
        feedStockData, 
        feedMixes,
        addFeedMix,
        updateFeedMix,
        deleteFeedMix,
        logFeedConsumption,
        feedConsumptionData,
        allSheds,
        itemMaster,
    } = useFarm()
    
    // State for Create/Edit Mix Sheet
    const [isMixSheetOpen, setIsMixSheetOpen] = React.useState(false);
    const [editingMix, setEditingMix] = React.useState<FeedMix | null>(null);
    const [mixName, setMixName] = React.useState("");
    const [ingredients, setIngredients] = React.useState<Omit<FeedMixIngredient, 'id'>[]>([]);

    // State for Log Consumption Form
    const [logShed, setLogShed] = React.useState("");
    const [logMix, setLogMix] = React.useState("");
    const [logQuantity, setLogQuantity] = React.useState("");

    // State for Medicine Consumption Form
    const [logMedShed, setLogMedShed] = React.useState("");
    const [logMedItem, setLogMedItem] = React.useState("");
    const [logMedQuantity, setLogMedQuantity] = React.useState("");
    
    // State for Consumption History Filters
    const [filterShed, setFilterShed] = React.useState("all");
    const [filterType, setFilterType] = React.useState("all");
    const [filterDate, setFilterDate] = React.useState<Date | undefined>();
    const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);


    const totalPercentage = React.useMemo(() => {
        return ingredients.reduce((sum, ing) => sum + (ing.percentage || 0), 0);
    }, [ingredients]);


    const resetMixForm = () => {
        setMixName("");
        setIngredients([]);
        setEditingMix(null);
        setIsMixSheetOpen(false);
    }
    
    const handleOpenEditMixSheet = (mix: FeedMix) => {
        setEditingMix(mix);
        setMixName(mix.name);
        setIngredients(mix.composition);
        setIsMixSheetOpen(true);
    };

    const handleLogSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!logShed || !logMix || !logQuantity) {
             toast({
                title: "Error",
                description: "Please fill out all consumption log fields.",
                variant: "destructive",
            })
            return;
        }
        
        const result = logFeedConsumption({
            shed: logShed,
            consumptionType: 'FeedMix',
            itemId: logMix,
            quantity: parseFloat(logQuantity),
            unit: 'kg', // Feed mixes are consumed in kg
        });

        if (result.success) {
            toast({
                title: "Feed Log Submitted",
                description: `Consumption for ${logShed} has been recorded. Stock levels updated.`,
            });
            setLogShed("");
            setLogMix("");
            setLogQuantity("");
        } else {
             toast({
                title: "Error",
                description: result.message,
                variant: "destructive",
            });
        }
    }
    
    const handleMedLogSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!logMedShed || !logMedItem || !logMedQuantity) {
            toast({
                title: "Error",
                description: "Please fill out all medicine/supplement log fields.",
                variant: "destructive",
            });
            return;
        }
        
        const healthItem = feedStockData.find(fs => fs.id === logMedItem);
        if (!healthItem) {
             toast({ title: "Error", description: "Selected health item not found.", variant: "destructive" });
             return;
        }

        const result = logFeedConsumption({
            shed: logMedShed,
            consumptionType: 'Health',
            itemId: logMedItem,
            quantity: parseFloat(logMedQuantity),
            unit: healthItem.unit
        });

        if (result.success) {
            toast({
                title: "Health Log Submitted",
                description: `Consumption for ${logMedShed} has been recorded. Stock updated.`,
            });
            setLogMedShed("");
            setLogMedItem("");
            setLogMedQuantity("");
        } else {
            toast({
                title: "Error",
                description: result.message,
                variant: "destructive",
            });
        }
    };


    const handleAddIngredient = () => {
        setIngredients([...ingredients, { itemMasterId: "", percentage: 0 }]);
    };

    const handleIngredientChange = (index: number, field: keyof Omit<FeedMixIngredient, 'id'>, value: string | number) => {
        const newIngredients = [...ingredients];
        if (field === 'percentage') {
            const strValue = String(value);
            const numValue = parseFloat(strValue);
            newIngredients[index][field] = isNaN(numValue) ? 0 : numValue;
        } else {
            newIngredients[index][field] = value as string;
        }
        setIngredients(newIngredients);
    };

    const handleRemoveIngredient = (index: number) => {
        const newIngredients = ingredients.filter((_, i) => i !== index);
        setIngredients(newIngredients);
    };

    const handleMixSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!mixName.trim()) {
            toast({ title: "Error", description: "Feed mix name is required.", variant: "destructive" });
            return;
        }
        if (ingredients.length === 0) {
            toast({ title: "Error", description: "A feed mix must have at least one ingredient.", variant: "destructive" });
            return;
        }
        if (ingredients.some(ing => !ing.itemMasterId || ing.percentage <= 0)) {
            toast({ title: "Error", description: "Please ensure all ingredients are selected and have a percentage greater than 0.", variant: "destructive" });
            return;
        }
        if (totalPercentage !== 100) {
            toast({ title: "Error", description: `Total percentage must be exactly 100%. Current total: ${totalPercentage}%`, variant: "destructive" });
            return;
        }

        if (editingMix) {
            // Update existing mix
            const result = updateFeedMix(editingMix.id, {
                name: mixName.trim(),
                composition: ingredients,
            });
            if (result.success) {
                toast({ title: "Feed Mix Updated", description: `Successfully updated "${mixName.trim()}".` });
                resetMixForm();
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } else {
            // Add new mix
            const result = addFeedMix({
                id: `FM-${Date.now()}`,
                name: mixName.trim(),
                composition: ingredients,
            });

            if (result.success) {
                toast({ title: "Feed Mix Created", description: `Successfully created "${mixName.trim()}".` });
                resetMixForm();
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        }
    };
    
    const handleDeleteMix = (mixId: string) => {
        const result = deleteFeedMix(mixId);
        if (result.success) {
            toast({ title: "Feed Mix Deleted", description: result.message });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    }
    
    const filteredConsumptionData = React.useMemo(() => {
        return feedConsumptionData.filter(log => {
            const shedMatch = filterShed === 'all' || log.shed === filterShed;
            const typeMatch = filterType === 'all' || log.consumptionType === filterType;
            const dateMatch = !filterDate || format(new Date(log.date), 'yyyy-MM-dd') === format(filterDate, 'yyyy-MM-dd');
            return shedMatch && typeMatch && dateMatch;
        });
    }, [feedConsumptionData, filterShed, filterType, filterDate]);
    
    const clearFilters = () => {
        setFilterShed("all");
        setFilterType("all");
        setFilterDate(undefined);
    };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
            {/* Feed Stock Management */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <Box className="h-6 w-6"/>
                            Stock Inventory
                        </CardTitle>
                        <CardDescription>
                            Current inventory of raw ingredients, medicines, and other items. Stock is added after a Purchase Order is paid.
                        </CardDescription>
                    </div>
                    <AddPOSheet />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Purchase Date</TableHead>
                                <TableHead>PO ID</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {feedStockData.map((feed) => (
                                <TableRow key={feed.id}>
                                    <TableCell className="font-medium">{feed.name}</TableCell>
                                    <TableCell>{feed.category}</TableCell>
                                    <TableCell>{feed.supplier}</TableCell>
                                    <TableCell>{format(new Date(feed.purchaseDate), "PP")}</TableCell>
                                    <TableCell>{feed.purchaseOrderId}</TableCell>
                                    <TableCell className="text-right">{feed.stock.toLocaleString()} {feed.unit}</TableCell>
                                </TableRow>
                            ))}
                            {feedStockData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No stock found. Create a Purchase Order to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-2">
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <History className="h-6 w-6"/>
                            Consumption History
                        </CardTitle>
                        <CardDescription>
                            Recent feed, medicine, and supplement consumption logs.
                        </CardDescription>
                    </div>
                    <div className="pt-4 flex flex-col md:flex-row gap-2">
                        <Select value={filterShed} onValueChange={setFilterShed}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filter by Shed" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sheds</SelectItem>
                                {allSheds.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filter by Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="FeedMix">Feed Mix</SelectItem>
                                <SelectItem value="Health">Health Item</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="pt-2 flex gap-2 items-center">
                        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !filterDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filterDate ? format(filterDate, "PPP") : <span>Filter by date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={filterDate}
                                    onSelect={(date) => {
                                        setFilterDate(date);
                                        setIsDatePickerOpen(false);
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {(filterShed !== 'all' || filterType !== 'all' || filterDate) && (
                            <Button variant="ghost" size="icon" onClick={clearFilters} aria-label="Clear filters">
                                <X className="h-4 w-4"/>
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Shed</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredConsumptionData.slice(0, 15).map((log) => {
                                let itemName = "N/A";
                                if (log.consumptionType === 'FeedMix') {
                                    const mix = feedMixes.find(m => m.id === log.itemId);
                                    itemName = mix?.name || "Deleted Mix";
                                } else if (log.consumptionType === 'Health') {
                                    const stock = feedStockData.find(s => s.id === log.itemId);
                                    itemName = stock?.name || "Deleted Item";
                                }

                                return (
                                    <TableRow key={log.logId}>
                                        <TableCell>{log.shed}</TableCell>
                                        <TableCell>{log.consumptionType === 'FeedMix' ? 'Feed' : 'Health'}</TableCell>
                                        <TableCell>{itemName}</TableCell>
                                        <TableCell className="text-right">{log.quantity} {log.unit}</TableCell>
                                    </TableRow>
                                )
                            })}
                            {filteredConsumptionData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        No logs for selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                     <div>
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <Wheat className="h-6 w-6"/>
                            Feed Mix Recipes
                        </CardTitle>
                        <CardDescription>
                            Create and manage feed recipes.
                        </CardDescription>
                    </div>
                     <Sheet open={isMixSheetOpen} onOpenChange={(isOpen) => {
                        if (!isOpen) resetMixForm();
                        setIsMixSheetOpen(isOpen);
                     }}>
                        <SheetTrigger asChild>
                            <Button size="sm" className="gap-1">
                                <PlusCircle className="h-4 w-4" />
                                Create Mix
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
                           <form onSubmit={handleMixSubmit}>
                             <SheetHeader>
                                <SheetTitle className="font-headline">{editingMix ? "Edit" : "Create New"} Feed Mix Recipe</SheetTitle>
                                <SheetDescription>
                                    Define a new feed recipe by specifying the percentage of each ingredient. The total must be 100%.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="py-4 grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="mix-name">Feed Mix Name</Label>
                                    <Input id="mix-name" placeholder="e.g., Layer Formula A" value={mixName} onChange={e => setMixName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ingredients</Label>
                                    <div className="space-y-3 p-3 border rounded-md">
                                        {ingredients.map((ing, index) => (
                                            <div key={index} className="flex items-end gap-2">
                                                <div className="grid gap-1.5 flex-1">
                                                    <Label htmlFor={`ing-name-${index}`} className="text-xs">Ingredient</Label>
                                                     <Select value={ing.itemMasterId} onValueChange={(val) => handleIngredientChange(index, 'itemMasterId', val)}>
                                                        <SelectTrigger id={`ing-name-${index}`}>
                                                            <SelectValue placeholder="Select ingredient" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {itemMaster.filter(fs => fs.category === "Feed Ingredient").map(fs => (
                                                                <SelectItem key={fs.id} value={fs.id} disabled={ingredients.some(i => i.itemMasterId === fs.id && i.itemMasterId !== ing.itemMasterId)}>
                                                                    {fs.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-1.5 w-28">
                                                    <Label htmlFor={`ing-perc-${index}`} className="text-xs">Percentage (%)</Label>
                                                    <div className="flex items-center">
                                                        <Input 
                                                            id={`ing-perc-${index}`} 
                                                            type="number" 
                                                            value={ing.percentage || ''} 
                                                            onChange={(e) => handleIngredientChange(index, 'percentage', parseFloat(e.target.value) || 0)} 
                                                            placeholder="e.g. 60" 
                                                        />
                                                        <Percent className="h-4 w-4 ml-2 text-muted-foreground" />
                                                    </div>
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveIngredient(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                         <Button type="button" variant="outline" size="sm" className="w-full mt-2" onClick={handleAddIngredient} disabled={ingredients.length >= feedStockData.length}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add Ingredient
                                        </Button>
                                    </div>
                                    <Alert variant={totalPercentage === 100 ? "default" : "destructive"} className={cn("mt-2", totalPercentage > 0 ? "visible" : "invisible")}>
                                        <AlertDescription>
                                            Total Percentage: <span className="font-bold">{totalPercentage}%</span>
                                            {totalPercentage !== 100 && " (Must be 100%)"}
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            </div>
                            <SheetFooter>
                                <Button type="button" variant="outline" onClick={resetMixForm}>Cancel</Button>
                                <Button type="submit">{editingMix ? "Update Mix" : "Save Mix"}</Button>
                            </SheetFooter>
                           </form>
                        </SheetContent>
                    </Sheet>
                </CardHeader>
                <CardContent>
                    {feedMixes.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No feed mix recipes created yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {feedMixes.map(mix => {
                                const findMasterItem = (id: string) => itemMaster.find(im => im.id === id);
                                return (
                                <div key={mix.id} className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-semibold">{mix.name}</h4>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4"/></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onSelect={() => handleOpenEditMixSheet(mix)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Feed Mix?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. Are you sure you want to permanently delete the "{mix.name}" recipe?
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteMix(mix.id)} className={cn(buttonVariants({ variant: "destructive" }))}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <ul className="text-sm text-muted-foreground list-disc pl-5">
                                        {mix.composition.map((ing, index) => (
                                            <li key={`${mix.id}-${ing.itemMasterId}-${index}`}>
                                                {findMasterItem(ing.itemMasterId)?.name || 'Unknown Ingredient'}: {ing.percentage}%
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )})}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <form onSubmit={handleLogSubmit}>
                    <CardHeader>
                        <CardTitle>Log Feed Consumption</CardTitle>
                        <CardDescription>
                            Log daily feed consumption to automatically update stock levels.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="shed">Shed</Label>
                            <Select value={logShed} onValueChange={setLogShed}>
                                <SelectTrigger id="shed">
                                    <SelectValue placeholder="Select a shed" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allSheds.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
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
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">Submit Log & Update Stock</Button>
                    </CardFooter>
                </form>
            </Card>

            <Card>
                <form onSubmit={handleMedLogSubmit}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HeartPulse className="h-5 w-5" />
                            Log Health Consumption
                        </CardTitle>
                        <CardDescription>
                            Log medicines or supplements given to a shed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="med-shed">Shed</Label>
                            <Select value={logMedShed} onValueChange={setLogMedShed}>
                                <SelectTrigger id="med-shed">
                                    <SelectValue placeholder="Select a shed" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allSheds.map(s => (<SelectItem key={`med-${s}`} value={s}>{s}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="med-item">Medicine/Supplement</Label>
                            <Select value={logMedItem} onValueChange={setLogMedItem}>
                                <SelectTrigger id="med-item">
                                    <SelectValue placeholder="Select an item" />
                                </SelectTrigger>
                                <SelectContent>
                                    {feedStockData.filter(fs => fs.category === 'Health').map(item => (
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
                                placeholder={`e.g., 100 (${feedStockData.find(fs => fs.id === logMedItem)?.unit || 'units'})`} 
                                value={logMedQuantity} 
                                onChange={e => setLogMedQuantity(e.target.value)} 
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">Submit Health Log</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    </div>
  )
}
