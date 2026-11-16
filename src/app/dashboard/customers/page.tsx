

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
import { MoreHorizontal, PlusCircle, Users, Upload } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useFarm } from "@/context/FarmContext"

const typeVariant = {
  "Sub-distributor": "secondary",
  "Hotel": "default",
  "Retail": "outline",
  "Restaurant": "accent",
  "Cart": "destructive",
  "Other": "outline"
} as const;

export default function CustomerPage() {
    const { toast } = useToast()
    const { customerData, staffData, routeNames, addCustomer } = useFarm();
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const router = useRouter();

    const [name, setName] = React.useState("");
    const [type, setType] = React.useState("");
    const [contact, setContact] = React.useState("");
    const [phone, setPhone] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [address, setAddress] = React.useState("");
    const [route, setRoute] = React.useState("");

    const allRoutes = React.useMemo(() => {
        const routesFromCustomers = customerData.map(c => c.route).filter(Boolean);
        const routesFromStaff = staffData.flatMap(s => s.assignedRoutes).filter(Boolean);
        return [...new Set([...routesFromCustomers, ...routesFromStaff, ...routeNames])].sort();
    }, [customerData, staffData, routeNames]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !type || !contact || !phone) {
            toast({
                title: "Error",
                description: "Please fill out all required fields.",
                variant: "destructive",
            });
            return;
        }

        const result = addCustomer({
            name,
            type,
            contact,
            phone,
            email,
            address,
            route,
        });

        if (result.success) {
            toast({
                title: "Customer Added",
                description: `Customer "${name}" has been successfully added.`,
            });
            // Reset form and close sheet
            setName("");
            setType("");
            setContact("");
            setPhone("");
            setEmail("");
            setAddress("");
            setRoute("");
            setIsSheetOpen(false);
        } else {
            toast({
                title: "Error",
                description: result.message,
                variant: "destructive",
            });
        }
    };
    
    const handleRowClick = (customerId: string) => {
        router.push(`/dashboard/customers/${customerId}`);
    };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Users className="h-6 w-6"/>
            Customer Management
          </CardTitle>
          <CardDescription>
            View, add, and manage your customers. Click a row for full details.
          </CardDescription>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                New Customer
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[600px]">
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                    <SheetTitle className="font-headline">Add New Customer</SheetTitle>
                    <SheetDescription>
                        Fill in the details to add a new customer to your database.
                    </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" className="col-span-3" placeholder="Customer's business name" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">Type</Label>
                            <Select onValueChange={setType} value={type}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select customer type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sub-distributor">Sub-distributor</SelectItem>
                                    <SelectItem value="Hotel">Hotel</SelectItem>
                                    <SelectItem value="Retail">Retail</SelectItem>
                                    <SelectItem value="Restaurant">Restaurant</SelectItem>
                                    <SelectItem value="Cart">Cart</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="contact" className="text-right">Contact Person</Label>
                            <Input id="contact" className="col-span-3" placeholder="e.g., Anil Kumar" value={contact} onChange={e => setContact(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Phone</Label>
                            <Input id="phone" type="tel" className="col-span-3" placeholder="e.g., 9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" type="email" className="col-span-3" placeholder="e.g., contact@business.com" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">Address</Label>
                            <Input id="address" className="col-span-3" placeholder="e.g., 123 Main St, City" value={address} onChange={e => setAddress(e.target.value)} />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="route" className="text-right">Assign Route</Label>
                             <Select onValueChange={setRoute} value={route}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a route" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allRoutes.map((r, index) => <SelectItem key={`${r}-${index}`} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="image" className="text-right">Upload Image</Label>
                             <div className="col-span-3 flex items-center gap-2">
                                <Input id="image" type="file" className="flex-1"/>
                                <Button type="button" variant="ghost" size="icon"><Upload className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    </div>
                    <SheetFooter>
                    <Button type="submit">Save Customer</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent>
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customerData.map((customer) => (
                    <TableRow key={customer.id} onClick={() => handleRowClick(customer.id)} className="cursor-pointer">
                        <TableCell className="font-medium">{customer.id}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>
                            <Badge variant={typeVariant[customer.type as keyof typeof typeVariant] || 'default'}>{customer.type}</Badge>
                        </TableCell>
                        <TableCell>{customer.contact}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell className="text-right">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleRowClick(customer.id)}}>View Details</DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
