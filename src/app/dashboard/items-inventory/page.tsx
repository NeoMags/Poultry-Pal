

"use client"

import * as React from "react"
import { useFarm, ItemMaster, ItemCategory } from "@/context/FarmContext"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Egg, Package, Box, PlusCircle, Trash2, Settings, AlertCircle, Receipt, MoreHorizontal, Edit, Search, ArrowUpDown, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import InventoryItemDetailSheet from "@/components/dashboard/inventory-item-detail-sheet"
import AddPOSheet from "@/components/dashboard/add-po-sheet"
import { cn } from "@/lib/utils"


const StatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
        {icon}
        <p className="text-2xl font-bold mt-2">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
    </div>
);


const ItemSheet = ({ 
    isOpen, 
    onOpenChange,
    itemToEdit,
} : { 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void,
    itemToEdit?: ItemMaster | null 
}) => {
    const { toast } = useToast();
    const { addItemToMaster, updateItemMaster, itemCategories, itemTypes } = useFarm();
    
    const [name, setName] = React.useState("");
    const [category, setCategory] = React.useState("");
    const [subCategory, setSubCategory] = React.useState("");
    const [type, setType] = React.useState("");
    const [unit, setUnit] = React.useState("");
    const [initialStock, setInitialStock] = React.useState("");
    
    const isEditMode = !!itemToEdit;
    
    const availableSubCategories = React.useMemo(() => {
        if (!category) return [];
        const selectedCat = itemCategories.find(c => c.name === category);
        return selectedCat?.subCategories || [];
    }, [category, itemCategories]);


    React.useEffect(() => {
        if (isOpen) {
            if (isEditMode && itemToEdit) {
                setName(itemToEdit.name);
                setCategory(itemToEdit.category);
                setSubCategory(itemToEdit.subCategory);
                setType(itemToEdit.type);
                setUnit(itemToEdit.unit);
                setInitialStock(""); // Don't show initial stock when editing
            } else {
                setName("");
                setCategory("");
                setSubCategory("");
                setType("");
                setUnit("");
                setInitialStock("");
            }
        }
    }, [itemToEdit, isEditMode, isOpen]);
    
    React.useEffect(() => {
        // Reset subcategory if category changes and it's no longer valid
        if (category && !availableSubCategories.includes(subCategory)) {
            setSubCategory("");
        }
    }, [category, subCategory, availableSubCategories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !category || !unit || !type || !subCategory) {
            toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
            return;
        }

        let result;
        const stock = initialStock ? parseFloat(initialStock) : 0;
        
        if (isEditMode && itemToEdit) {
            result = updateItemMaster(itemToEdit.id, { name, category, subCategory, unit, type });
        } else {
            result = addItemToMaster({ name, category, subCategory, unit, type, initialStock: stock > 0 ? stock : undefined });
        }

        if (result.success) {
            toast({ title: `Item ${isEditMode ? 'Updated' : 'Added'}`, description: result.message });
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
                        <SheetTitle>{isEditMode ? 'Edit' : 'Add New'} Item</SheetTitle>
                        <SheetDescription>
                            {isEditMode ? 'Update the details for this item.' : 'Define a new item that can be used across your farm inventory.'}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-name" className="text-right">Item Name</Label>
                            <Input id="item-name" className="col-span-3" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Corn, Vitamin C" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-category" className="text-right">Category</Label>
                            <Select onValueChange={setCategory} value={category}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a category" /></SelectTrigger>
                                <SelectContent>
                                    {itemCategories.map((c, index) => <SelectItem key={`${c.id}-${index}`} value={c.name}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-subcategory" className="text-right">Sub-Category</Label>
                            <Select onValueChange={setSubCategory} value={subCategory} disabled={!category}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a sub-category" /></SelectTrigger>
                                <SelectContent>
                                    {(availableSubCategories || []).map((sc, index) => <SelectItem key={`${sc}-${index}`} value={sc}>{sc}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-type" className="text-right">Type</Label>
                            <Select onValueChange={setType} value={type}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select an item type" /></SelectTrigger>
                                <SelectContent>
                                    {itemTypes.map((t, index) => <SelectItem key={`${t}-${index}`} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-unit" className="text-right">Base Unit</Label>
                             <Select onValueChange={setUnit} value={unit}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a unit" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kg">kg</SelectItem>
                                    <SelectItem value="g">g</SelectItem>
                                    <SelectItem value="l">l</SelectItem>
                                    <SelectItem value="ml">ml</SelectItem>
                                    <SelectItem value="pcs">pcs</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {!isEditMode && (
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="initial-stock" className="text-right">Initial Stock</Label>
                                <Input id="initial-stock" type="number" className="col-span-3" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} placeholder="Optional"/>
                            </div>
                        )}
                    </div>
                    <SheetFooter>
                        <Button type="submit">Save Item</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}


const SetupManager = () => {
    const { toast } = useToast();
    const { 
        itemCategories, addItemCategory, deleteItemCategory,
        addSubCategory, deleteSubCategory, 
        itemTypes, addItemType, deleteItemType,
        itemMaster 
    } = useFarm();
    const [newCategory, setNewCategory] = React.useState("");
    const [newType, setNewType] = React.useState("");
    const [newSubCategory, setNewSubCategory] = React.useState<Record<string, string>>({});

    const handleAddCategory = () => {
        if (!newCategory.trim()) return;
        const result = addItemCategory(newCategory);
        if (result.success) setNewCategory("");
        else toast({ title: "Error", description: result.message, variant: "destructive" });
    };

    const handleAddSubCategory = (categoryId: string) => {
        const subCategoryName = newSubCategory[categoryId]?.trim();
        if (!subCategoryName) return;
        const result = addSubCategory(categoryId, subCategoryName);
        if(result.success) {
            setNewSubCategory(prev => ({ ...prev, [categoryId]: "" }));
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };

    const handleDeleteCategory = (categoryId: string, categoryName: string) => {
        if (itemMaster.some(item => item.category === categoryName)) {
            toast({ title: "Cannot Delete", description: `"${categoryName}" is in use by an item.`, variant: "destructive" });
            return;
        }
        deleteItemCategory(categoryId);
    };

    const handleDeleteSubCategory = (categoryId: string, subCategoryName: string) => {
        if (itemMaster.some(item => item.subCategory === subCategoryName)) {
            toast({ title: "Cannot Delete", description: `"${subCategoryName}" is in use by an item.`, variant: "destructive" });
            return;
        }
        deleteSubCategory(categoryId, subCategoryName);
    }

     const handleAddType = () => {
        if (!newType.trim()) return;
        const result = addItemType(newType);
        if (result.success) setNewType("");
        else toast({ title: "Error", description: result.message, variant: "destructive" });
    };

    const handleDeleteType = (type: string) => {
        if (itemMaster.some(item => item.type === type)) {
            toast({ title: "Cannot Delete", description: `"${type}" is in use by an item.`, variant: "destructive" });
            return;
        }
        deleteItemType(type);
    };
    
    return (
        <Tabs defaultValue="categories">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="categories">Categories & Sub-Categories</TabsTrigger>
                <TabsTrigger value="types">Types</TabsTrigger>
            </TabsList>
            <TabsContent value="categories" className="mt-4 space-y-4">
                <div className="flex gap-2">
                    <Input placeholder="New category name..." value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                    <Button onClick={handleAddCategory}>Add Category</Button>
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {itemCategories.map(category => (
                        <Card key={category.id}>
                            <CardHeader className="flex flex-row items-center justify-between p-4">
                                <CardTitle className="text-lg">{category.name}</CardTitle>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Delete "{category.name}"?</AlertDialogTitle></AlertDialogHeader>
                                        <AlertDialogDescription>This action cannot be undone and will delete all its sub-categories. You can only delete unused categories.</AlertDialogDescription>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteCategory(category.id, category.name)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-2">
                                {(category.subCategories ?? []).length > 0 ? (
                                    (category.subCategories ?? []).map((sc, index) => (
                                        <div key={`${sc}-${index}`} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                            <span>{sc}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteSubCategory(category.id, sc)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-center text-muted-foreground py-2">No sub-categories added.</p>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Input 
                                        placeholder="New sub-category..." 
                                        className="h-9"
                                        value={newSubCategory[category.id] || ""}
                                        onChange={(e) => setNewSubCategory(prev => ({...prev, [category.id]: e.target.value}))}
                                    />
                                    <Button size="sm" onClick={() => handleAddSubCategory(category.id)}>Add</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabsContent>
            <TabsContent value="types" className="mt-4 space-y-4">
                <div className="flex gap-2">
                    <Input placeholder="New type..." value={newType} onChange={e => setNewType(e.target.value)} />
                    <Button onClick={handleAddType}>Add</Button>
                </div>
                <div className="space-y-2">
                    {itemTypes.map((type, index) => (
                        <div key={`${type}-${index}`} className="flex items-center justify-between p-2 border rounded-md">
                            <span className="text-sm font-medium">{type}</span>
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete "{type}"?</AlertDialogTitle></AlertDialogHeader>
                                    <AlertDialogDescription>This action cannot be undone. You can only delete unused types.</AlertDialogDescription>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteType(type)}>Delete</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </div>
            </TabsContent>
        </Tabs>
    );
}

interface AggregatedItem {
    id: string;
    name: string;
    category: string;
    subCategory: string;
    unit: string;
    quantity: number;
    masterId?: string;
}

const AlertThresholdDialog = ({ item, open, onOpenChange }: { item: ItemMaster | null, open: boolean, onOpenChange: (open: boolean) => void }) => {
    const { toast } = useToast();
    const { updateItemMaster } = useFarm();
    const [threshold, setThreshold] = React.useState<string>("");

    React.useEffect(() => {
        if (item && item.lowStockAlert) {
            setThreshold(item.lowStockAlert.toString());
        } else {
            setThreshold("");
        }
    }, [item]);
    
    if (!item) return null;

    const handleSave = () => {
        const value = threshold ? parseFloat(threshold) : undefined;
        if (threshold && (isNaN(value) || value < 0)) {
            toast({ title: "Invalid Input", description: "Please enter a valid, non-negative number.", variant: "destructive" });
            return;
        }
        updateItemMaster(item.id, { lowStockAlert: value });
        toast({ title: "Alert Updated", description: `Low stock alert for ${item.name} has been set.` });
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Set Low Stock Alert for "{item.name}"</AlertDialogTitle>
                    <AlertDialogDescription>
                        You will be notified when the stock quantity for this item falls below the specified threshold.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                    <Label htmlFor="alert-threshold">Alert Threshold ({item.unit})</Label>
                    <Input 
                        id="alert-threshold" 
                        type="number" 
                        placeholder="e.g., 100" 
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

export default function ItemsInventoryPage() {
    const farmProps = useFarm();
    const { itemMaster, feedStockData, inventoryData, isLoading, deleteItemMaster } = farmProps;
    const [selectedItemForDetail, setSelectedItemForDetail] = React.useState<AggregatedItem | null>(null);
    const [selectedItemForAlert, setSelectedItemForAlert] = React.useState<ItemMaster | null>(null);
    const [itemToEdit, setItemToEdit] = React.useState<ItemMaster | null>(null);
    const [isAlertDialogOpen, setIsAlertDialogOpen] = React.useState(false);
    const [isItemSheetOpen, setIsItemSheetOpen] = React.useState(false);
    const { toast } = useToast();

    // State for filtering and sorting
    const [filterCategory, setFilterCategory] = React.useState("all");
    const [filterSubCategory, setFilterSubCategory] = React.useState("all");
    const [searchTerm, setSearchTerm] = React.useState("");
    const [sortKey, setSortKey] = React.useState<keyof AggregatedItem>('name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
    
     const availableSubCategoriesForFilter = React.useMemo(() => {
        if (filterCategory === 'all') return [];
        const cat = farmProps.itemCategories.find(c => c.name === filterCategory);
        return cat?.subCategories || [];
    }, [filterCategory, farmProps.itemCategories]);

    React.useEffect(() => {
        setFilterSubCategory("all");
    }, [filterCategory]);

    const allInventoryItems = React.useMemo(() => {
        if (isLoading) return [];
        
        const aggregatedMap = new Map<string, AggregatedItem>();

        const getNormalizedName = (name: string) => {
            const lowerName = name.toLowerCase();
            if (lowerName === 'egg' || lowerName === 'eggs') return 'Eggs';
            if (lowerName === 'tray' || lowerName === 'trays') return 'Trays';
            return name;
        };
        
        itemMaster.forEach(masterItem => {
            const normalizedName = getNormalizedName(masterItem.name);
            let quantity = 0;

            if (normalizedName === 'Eggs') {
                quantity = inventoryData.readyStock;
            } else if (normalizedName === 'Trays') {
                quantity = inventoryData.emptyTrays;
            } else {
                quantity = feedStockData
                    .filter(fs => fs.name.toLowerCase() === masterItem.name.toLowerCase())
                    .reduce((sum, item) => sum + item.stock, 0);
            }
            
            if (quantity <= 0) return;

            const existing = aggregatedMap.get(normalizedName);
            if (existing) {
                existing.quantity += quantity;
            } else {
                 aggregatedMap.set(normalizedName, {
                    id: masterItem.id, // Use the first encountered ID
                    name: normalizedName, // Use the normalized name for display
                    category: masterItem.category,
                    subCategory: masterItem.subCategory,
                    unit: masterItem.unit,
                    quantity: quantity,
                    masterId: masterItem.id
                });
            }
        });
        
        return Array.from(aggregatedMap.values());

    }, [feedStockData, inventoryData, isLoading, itemMaster]);

    const processedInventory = React.useMemo(() => {
        return allInventoryItems
            .filter(item => {
                const categoryMatch = filterCategory === 'all' || item.category === filterCategory;
                const subCategoryMatch = filterSubCategory === 'all' || item.subCategory === filterSubCategory;
                const searchMatch = searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase());
                return categoryMatch && subCategoryMatch && searchMatch;
            })
            .sort((a, b) => {
                const valA = a[sortKey];
                const valB = b[sortKey];
                
                let comparison = 0;
                if (typeof valA === 'string' && typeof valB === 'string') {
                    comparison = valA.localeCompare(valB);
                } else if (typeof valA === 'number' && typeof valB === 'number') {
                    comparison = valA - valB;
                }

                return sortDirection === 'asc' ? comparison : -comparison;
            });
    }, [allInventoryItems, filterCategory, filterSubCategory, searchTerm, sortKey, sortDirection]);
    
    const handleSort = (key: keyof AggregatedItem) => {
        if (key === sortKey) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

     const SortableHeader = ({ sortKey: key, children, className }: { sortKey: keyof AggregatedItem, children: React.ReactNode, className?: string }) => (
        <TableHead onClick={() => handleSort(key)} className={cn("cursor-pointer hover:bg-muted", className)}>
            <div className="flex items-center gap-2">
                {children}
                {sortKey === key && <ArrowUpDown className="h-4 w-4" />}
            </div>
        </TableHead>
    );
    
    const handleOpenNewItemSheet = () => {
        setItemToEdit(null);
        setIsItemSheetOpen(true);
    };

    const handleOpenEditItemSheet = (item: ItemMaster) => {
        setItemToEdit(item);
        setIsItemSheetOpen(true);
    };

    const handleAlertClick = (e: React.MouseEvent, item: AggregatedItem) => {
        e.stopPropagation();
        if (item.masterId) {
            const master = itemMaster.find(im => im.id === item.masterId);
            if (master) {
                setSelectedItemForAlert(master);
                setIsAlertDialogOpen(true);
            }
        }
    };
    
    const handleDeleteItem = (itemId: string) => {
        const result = deleteItemMaster(itemId);
        toast({
            title: result.success ? "Item Deleted" : "Error",
            description: result.message,
            variant: result.success ? "default" : "destructive",
        });
    }


    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 font-headline">
                                <Package className="h-6 w-6 text-primary"/>
                                Aggregated Inventory
                            </CardTitle>
                            <CardDescription>
                                A comprehensive list of all items currently in stock. Click a row for details.
                            </CardDescription>
                        </div>
                        <AddPOSheet />
                    </CardHeader>
                    <CardContent>
                         <div className="flex flex-col md:flex-row items-center gap-2 mb-4">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search by item name..."
                                    className="pl-8 w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Filter by Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {farmProps.itemCategories.map((c, i) => <SelectItem key={`${c.id}-${i}`} value={c.name}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                 <Select value={filterSubCategory} onValueChange={setFilterSubCategory} disabled={availableSubCategoriesForFilter.length === 0}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Filter by Sub-Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sub-Categories</SelectItem>
                                        {(availableSubCategoriesForFilter || []).map((sc, index) => <SelectItem key={`${sc}-${index}`} value={sc}>{sc}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableHeader sortKey="name">Item Name</SortableHeader>
                                    <SortableHeader sortKey="category">Category</SortableHeader>
                                    <SortableHeader sortKey="subCategory">Sub-Category</SortableHeader>
                                    <SortableHeader sortKey="quantity" className="text-right">Current Stock</SortableHeader>
                                    <TableHead className="text-center">Alerts</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={5}>
                                                <Skeleton className="h-8 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : processedInventory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            No inventory items found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    processedInventory.map((item) => (
                                        <TableRow key={item.id} onClick={() => setSelectedItemForDetail(item)} className="cursor-pointer">
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.category === 'Health' ? 'secondary' : 'outline'}>{item.category}</Badge>
                                            </TableCell>
                                            <TableCell>{item.subCategory}</TableCell>
                                            <TableCell className="text-right">{item.quantity.toLocaleString()} {item.unit}</TableCell>
                                            <TableCell className="text-center">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8"
                                                    onClick={(e) => handleAlertClick(e, item)}
                                                    >
                                                    <AlertCircle className="h-4 w-4"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 font-headline">
                                <Package className="h-6 w-6 text-primary"/>
                            Items Master
                            </CardTitle>
                            <CardDescription>
                                Define all items used in your farm.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1">
                                        <Settings className="h-4 w-4" />
                                        Setup
                                    </Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Inventory Setup</SheetTitle>
                                        <SheetDescription>Manage categories and types for your inventory items.</SheetDescription>
                                    </SheetHeader>
                                    <div className="py-4">
                                        <SetupManager />
                                    </div>
                                </SheetContent>
                            </Sheet>
                            <Button size="sm" className="gap-1" onClick={handleOpenNewItemSheet}>
                                <PlusCircle className="h-4 w-4" />
                                New Item
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Sub-Category</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : (itemMaster || []).filter(item => !item.id.startsWith('SYS_')).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">No user-defined items.</TableCell>
                                    </TableRow>
                                ) : (
                                    (itemMaster || []).filter(item => !item.id.startsWith('SYS_')).map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                                            <TableCell>{item.subCategory}</TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => handleOpenEditItemSheet(item)}>
                                                            <Edit className="mr-2 h-4 w-4"/> Edit
                                                        </DropdownMenuItem>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">
                                                                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete "{item.name}"?</AlertDialogTitle>
                                                                    <AlertDialogDescription>This action cannot be undone. You can only delete unused items.</AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>Delete</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <InventoryItemDetailSheet 
                item={selectedItemForDetail}
                isOpen={!!selectedItemForDetail}
                onOpenChange={(open) => {
                    if (!open) setSelectedItemForDetail(null);
                }}
            />
            <AlertThresholdDialog 
                item={selectedItemForAlert}
                open={isAlertDialogOpen}
                onOpenChange={setIsAlertDialogOpen}
            />
            <ItemSheet
                isOpen={isItemSheetOpen}
                onOpenChange={setIsItemSheetOpen}
                itemToEdit={itemToEdit}
            />
        </>
    )
}

    

