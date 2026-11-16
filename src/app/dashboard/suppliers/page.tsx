
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle, Building, Edit } from "lucide-react"
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
import { useFarm, Supplier } from "@/context/FarmContext"
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

export default function SupplierPage() {
    const { toast } = useToast()
    const { suppliersData, addSupplier, updateSupplier, deleteSupplier } = useFarm();
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false);
    const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
    const router = useRouter();

    // State for new supplier form
    const [name, setName] = React.useState("");
    const [contact, setContact] = React.useState("");
    const [phone, setPhone] = React.useState("");
    const [products, setProducts] = React.useState("");
    
    // State for edit supplier form
    const [editedName, setEditedName] = React.useState("");
    const [editedContact, setEditedContact] = React.useState("");
    const [editedPhone, setEditedPhone] = React.useState("");
    const [editedProducts, setEditedProducts] = React.useState("");

    // State for delete confirmation
    const [supplierToDelete, setSupplierToDelete] = React.useState<Supplier | null>(null);
    const [adminUsername, setAdminUsername] = React.useState("");
    const [adminPassword, setAdminPassword] = React.useState("");


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !contact || !phone) {
            toast({
                title: "Error",
                description: "Please fill out Name, Contact, and Phone fields.",
                variant: "destructive",
            });
            return;
        }

        const result = addSupplier({
            name,
            contact,
            phone,
            products,
        });

        if (result.success) {
            toast({
                title: "Supplier Added",
                description: `Supplier "${name}" has been successfully added.`,
            });
            // Reset form and close sheet
            setName("");
            setContact("");
            setPhone("");
            setProducts("");
            setIsSheetOpen(false);
        } else {
             toast({
                title: "Error",
                description: result.message,
                variant: "destructive",
            });
        }
    };
    
    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSupplier) return;

        if (!editedName || !editedContact || !editedPhone) {
            toast({ title: "Error", description: "Name, Contact, and Phone cannot be empty.", variant: "destructive" });
            return;
        }
        
        const result = updateSupplier(editingSupplier.id, {
            name: editedName,
            contact: editedContact,
            phone: editedPhone,
            products: editedProducts
        });

        if (result.success) {
            toast({ title: "Supplier Updated", description: result.message });
            setIsEditSheetOpen(false);
            setEditingSupplier(null);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };

    const handleOpenEditSheet = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setEditedName(supplier.name);
        setEditedContact(supplier.contact);
        setEditedPhone(supplier.phone);
        setEditedProducts(supplier.products);
        setIsEditSheetOpen(true);
    };

    const handleDelete = (supplierId: string) => {
        let storedAdminEmail = "";
        let storedAdminPassword = "";
        try {
            storedAdminEmail = localStorage.getItem("adminEmail") || "";
            storedAdminPassword = localStorage.getItem("adminPassword") || "";
        } catch (e) {
            console.warn("could not read from local storage");
        }

        if (adminUsername.toLowerCase() !== storedAdminEmail.toLowerCase() || adminPassword !== storedAdminPassword) {
            toast({
                title: "Authentication Failed",
                description: "Invalid admin credentials provided.",
                variant: "destructive"
            });
            return;
        }

        const result = deleteSupplier(supplierId);
        if (result.success) {
            toast({
                title: "Supplier Deleted",
                description: result.message
            });
        } else {
             toast({
                title: "Error",
                description: result.message,
                variant: "destructive"
            });
        }
        setSupplierToDelete(null);
        setAdminUsername("");
        setAdminPassword("");
    }

    const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>, supplierId: string) => {
        const target = e.target as HTMLElement;
        // Do not navigate if the user is clicking on an interactive element inside the row
        if (target.closest('button, [role="menuitem"], [role="dialog"]')) {
            return;
        }
        router.push(`/dashboard/suppliers/${supplierId}`);
    };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Building className="h-6 w-6"/>
            Supplier Management
          </CardTitle>
          <CardDescription>
            View, add, and manage your suppliers. Click a row to see details.
          </CardDescription>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                New Supplier
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[600px]">
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                    <SheetTitle className="font-headline">Add New Supplier</SheetTitle>
                    <SheetDescription>
                        Fill in the details to add a new supplier.
                    </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" className="col-span-3" placeholder="Supplier's business name" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="contact" className="text-right">Contact Person</Label>
                            <Input id="contact" className="col-span-3" placeholder="e.g., Rajesh Gupta" value={contact} onChange={e => setContact(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Phone</Label>
                            <Input id="phone" type="tel" className="col-span-3" placeholder="e.g., 9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="products" className="text-right">Products Supplied</Label>
                             <Textarea id="products" className="col-span-3" placeholder="e.g., Feeds, Chicks, Meds" value={products} onChange={e => setProducts(e.target.value)} />
                        </div>
                    </div>
                    <SheetFooter>
                    <Button type="submit">Save Supplier</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent>
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Supplier ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {suppliersData.map((supplier) => (
                    <TableRow key={supplier.id} onClick={(e) => handleRowClick(e, supplier.id)} className="cursor-pointer">
                        <TableCell className="font-medium">{supplier.id}</TableCell>
                        <TableCell>{supplier.name}</TableCell>
                        <TableCell>{supplier.contact}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{supplier.products}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onSelect={() => handleOpenEditSheet(supplier)}>
                                        <Edit className="mr-2 h-4 w-4"/>Edit
                                    </DropdownMenuItem>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <DropdownMenuItem className="text-destructive" onSelect={(e) => { e.preventDefault(); setSupplierToDelete(supplier); }}>
                                                Delete
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>

    <AlertDialog open={!!supplierToDelete} onOpenChange={(isOpen) => !isOpen && setSupplierToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete "{supplierToDelete?.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. Please enter admin credentials to confirm deletion.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-2">
                <div className="space-y-2">
                    <Label htmlFor="admin-username">Admin Email</Label>
                    <Input 
                        id="admin-username" 
                        placeholder="admin@example.com"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="admin-password">Admin Password</Label>
                    <Input 
                        id="admin-password" 
                        type="password"
                        placeholder="Enter admin password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                    />
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSupplierToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => supplierToDelete && handleDelete(supplierToDelete.id)}>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-[600px]">
            <form onSubmit={handleEditSubmit}>
                <SheetHeader>
                <SheetTitle className="font-headline">Edit Supplier</SheetTitle>
                <SheetDescription>
                    Update the details for "{editingSupplier?.name}".
                </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">Name</Label>
                        <Input id="edit-name" className="col-span-3" value={editedName} onChange={e => setEditedName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-contact" className="text-right">Contact Person</Label>
                        <Input id="edit-contact" className="col-span-3" value={editedContact} onChange={e => setEditedContact(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-phone" className="text-right">Phone</Label>
                        <Input id="edit-phone" type="tel" className="col-span-3" value={editedPhone} onChange={e => setEditedPhone(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-products" className="text-right">Products Supplied</Label>
                            <Textarea id="edit-products" className="col-span-3" value={editedProducts} onChange={e => setEditedProducts(e.target.value)} />
                    </div>
                </div>
                <SheetFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditSheetOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </SheetFooter>
            </form>
        </SheetContent>
    </Sheet>
    </>
  )
}
