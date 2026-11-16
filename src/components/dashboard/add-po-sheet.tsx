

"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
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
import { useFarm, PurchaseOrderItem } from "@/context/FarmContext"
import { PlusCircle, X } from "lucide-react"

interface AddPOSheetProps {
  supplierId?: string;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
}

export default function AddPOSheet({ supplierId: preselectedSupplierId, onOpenChange, isOpen: controlledIsOpen }: AddPOSheetProps) {
    const { toast } = useToast();
    const { itemMaster, suppliersData, addPurchaseOrder, itemCategories } = useFarm();
    
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : isSheetOpen;
    const setIsOpen = onOpenChange || setIsSheetOpen;

    const [supplierId, setSupplierId] = React.useState(preselectedSupplierId || "");
    const [items, setItems] = React.useState<Omit<PurchaseOrderItem, 'id'>[]>([]);

    React.useEffect(() => {
        if (preselectedSupplierId) {
            setSupplierId(preselectedSupplierId);
        }
    }, [preselectedSupplierId]);

    const totalAmount = items.reduce((sum, item) => sum + (item.costPerUnit * item.quantity), 0);
    
    const userItemCategories = itemCategories;


    const handleAddItem = () => {
        setItems([...items, { name: '', category: 'Feed Ingredient', quantity: 0, unit: '', costPerUnit: 0 }]);
    };

    const handleItemChange = (index: number, field: keyof Omit<PurchaseOrderItem, 'id'>, value: any) => {
        const newItems = [...items];
        const currentItem = newItems[index];

        if (field === 'category') {
             (currentItem as any)[field] = value;
             currentItem.name = '';
             currentItem.unit = '';
        } else if (field === 'name') {
            const masterItem = itemMaster.find(i => i.name === value && i.category === currentItem.category);
            if (masterItem) {
                currentItem.name = masterItem.name;
                currentItem.unit = masterItem.unit;
            } else {
                 (currentItem as any)[field] = value;
            }
        } else {
             (currentItem as any)[field] = value;
        }

        if (field === 'quantity' || field === 'costPerUnit' || field === 'age') {
             (currentItem as any)[field] = parseFloat(value) || 0;
        }

        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        if (!preselectedSupplierId) {
            setSupplierId("");
        }
        setItems([]);
        setIsOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || items.length === 0 || items.some(i => !i.name || i.quantity <= 0 || i.costPerUnit <= 0)) {
            toast({ title: "Error", description: "Please select a supplier and fill out all item details correctly.", variant: "destructive" });
            return;
        }
        
        const result = addPurchaseOrder({
            supplierId,
            items,
        });

        if (result.success) {
            toast({ title: "Purchase Order Created", description: result.message });
            resetForm();
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };
    
    const availableMasterItems = (category: string) => {
        return itemMaster.filter(i => i.category === category);
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            {!preselectedSupplierId && (
                <SheetTrigger asChild>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-4 w-4" />
                        Create Purchase Order
                    </Button>
                </SheetTrigger>
            )}
            <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <SheetTitle>New Purchase Order</SheetTitle>
                        <SheetDescription>
                            Create a purchase order for stock items. Stock will be added to inventory after payment is logged.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-4 grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="po-supplier">Supplier</Label>
                            <Select onValueChange={setSupplierId} value={supplierId} disabled={!!preselectedSupplierId}>
                                <SelectTrigger id="po-supplier">
                                    <SelectValue placeholder="Select a supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliersData.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Items</Label>
                            <div className="space-y-3 p-3 border rounded-md">
                                {items.map((item, index) => (
                                    <div key={index} className="flex items-end gap-2 p-2 border rounded-md relative">
                                        <div className="grid gap-2 w-full">
                                            <div className="grid grid-cols-2 gap-2">
                                                 <div className="space-y-1">
                                                    <Label htmlFor={`item-category-${index}`} className="text-xs">Category</Label>
                                                    <Select value={item.category} onValueChange={(val) => handleItemChange(index, 'category', val)}>
                                                        <SelectTrigger id={`item-category-${index}`}><SelectValue placeholder="Select a category" /></SelectTrigger>
                                                        <SelectContent>
                                                            {userItemCategories.map((c, catIndex) => <SelectItem key={`${c.id}-${index}-${catIndex}`} value={c.name}>{c.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor={`item-name-${index}`} className="text-xs">Item Name</Label>
                                                    <Select 
                                                        value={item.name} 
                                                        onValueChange={(val) => handleItemChange(index, 'name', val)}
                                                        disabled={!item.category}
                                                    >
                                                        <SelectTrigger id={`item-name-${index}`}>
                                                            <SelectValue placeholder="Select an item" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableMasterItems(item.category).map(masterItem => (
                                                                <SelectItem key={masterItem.id} value={masterItem.name}>
                                                                    {masterItem.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {item.category === 'Chicks' && (
                                                <div className="grid grid-cols-2 gap-2">
                                                     <div className="space-y-1">
                                                        <Label htmlFor={`item-breed-${index}`} className="text-xs">Breed</Label>
                                                        <Input id={`item-breed-${index}`} value={item.breed || ''} onChange={(e) => handleItemChange(index, 'breed', e.target.value)} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor={`item-age-${index}`} className="text-xs">Age (days)</Label>
                                                        <Input id={`item-age-${index}`} type="number" value={item.age || ''} onChange={(e) => handleItemChange(index, 'age', e.target.value)} />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="space-y-1">
                                                     <Label htmlFor={`item-qty-${index}`} className="text-xs">Quantity</Label>
                                                    <Input id={`item-qty-${index}`} type="number" placeholder="0" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor={`item-unit-${index}`} className="text-xs">Unit</Label>
                                                    <Input id={`item-unit-${index}`} value={item.unit} disabled />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor={`item-cost-${index}`} className="text-xs">Cost per Unit</Label>
                                                    <Input id={`item-cost-${index}`} type="number" placeholder="0.00" value={item.costPerUnit} onChange={(e) => handleItemChange(index, 'costPerUnit', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                         <Button type="button" variant="ghost" size="icon" className="text-destructive absolute -top-1 -right-1 h-6 w-6" onClick={() => handleRemoveItem(index)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleAddItem}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                                </Button>
                            </div>
                        </div>
                        {totalAmount > 0 && (
                            <div className="text-right font-medium">
                                Total Amount: <span className="font-bold">₹{totalAmount.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                    <SheetFooter>
                        <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                        <Button type="submit">Create PO</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
