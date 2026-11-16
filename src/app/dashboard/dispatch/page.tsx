

"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle, Route, Users, Package, IndianRupee } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFarm, Dispatch, Customer } from "@/context/FarmContext"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import DispatchDetailSheet from "@/components/dashboard/dispatch-detail-sheet"


const statusVariant = {
  Delivered: "secondary",
  "In Transit": "default",
  Pending: "destructive",
}

const DispatchForm = ({ setSheetOpen }: { setSheetOpen: (open: boolean) => void }) => {
    const { toast } = useToast();
    const { customerData, addDispatch, allSheds, inventoryData, chickData } = useFarm();

    const [dispatchType, setDispatchType] = React.useState("");
    const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
    const [assignedRoute, setAssignedRoute] = React.useState("");
    
    // Eggs state
    const [eggs, setEggs] = React.useState("");
    const [trays, setTrays] = React.useState("");
    const [pricePerEgg, setPricePerEgg] = React.useState("");
    
    // Chicks state
    const [chickQuantity, setChickQuantity] = React.useState("");
    const [chickType, setChickType] = React.useState("");
    const [chickShed, setChickShed] = React.useState("");
    const [pricePerChick, setPricePerChick] = React.useState("");

    const availableChickStock = React.useMemo(() => {
        if (!chickType || !chickShed) return 0;
        return chickData
            .filter(c => c.type === chickType && c.shed === chickShed)
            .reduce((sum, c) => sum + c.quantity, 0);
    }, [chickType, chickShed, chickData]);

    const handleCustomerChange = (customerId: string) => {
        const customer = customerData.find(c => c.id === customerId);
        setSelectedCustomerId(customerId);
        setAssignedRoute(customer ? customer.route : "");
    };

    const handleEggsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const eggCountStr = e.target.value;
        setEggs(eggCountStr);

        const eggCount = parseInt(eggCountStr, 10);
        if (!isNaN(eggCount) && eggCount >= 0) {
            const calculatedTrays = Math.ceil(eggCount / 30);
            setTrays(calculatedTrays.toString());
        } else {
            setTrays("");
        }
    };

    const handleTraysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const trayCountStr = e.target.value;
        setTrays(trayCountStr);

        const trayCount = parseInt(trayCountStr, 10);
        if (!isNaN(trayCount) && trayCount >= 0) {
            const calculatedEggs = trayCount * 30;
            setEggs(calculatedEggs.toString());
        } else {
            setEggs("");
        }
    };
    
    const eggBreakdown = React.useMemo(() => {
        const eggCount = parseInt(eggs, 10);
        if (isNaN(eggCount) || eggCount <= 0) {
            return "";
        }
        const numTrays = Math.floor(eggCount / 30);
        const remainingEggs = eggCount % 30;

        let result = `Equals: ${numTrays} ${numTrays === 1 ? 'Tray' : 'Trays'}`;
        if (remainingEggs > 0) {
            result += ` and ${remainingEggs} ${remainingEggs === 1 ? 'egg' : 'eggs'}`;
        }
        return result;
    }, [eggs]);

    const totalAmount = React.useMemo(() => {
        if (dispatchType === 'eggs') {
            const eggCount = parseInt(eggs, 10);
            const price = parseFloat(pricePerEgg);
            return (!isNaN(eggCount) && !isNaN(price)) ? (eggCount * price) : 0;
        }
        if (dispatchType === 'chicks') {
            const chickCount = parseInt(chickQuantity, 10);
            const price = parseFloat(pricePerChick);
            return (!isNaN(chickCount) && !isNaN(price)) ? (chickCount * price) : 0;
        }
        return 0;
    }, [dispatchType, eggs, pricePerEgg, chickQuantity, pricePerChick]);

    const resetForm = () => {
        setDispatchType("");
        setSelectedCustomerId("");
        setAssignedRoute("");
        setEggs("");
        setTrays("");
        setPricePerEgg("");
        setChickQuantity("");
        setChickType("");
        setChickShed("");
        setPricePerChick("");
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!dispatchType || !selectedCustomerId) {
            toast({ title: "Error", description: "Please select a dispatch type and a customer.", variant: "destructive" });
            return;
        }

        const customer = customerData.find(c => c.id === selectedCustomerId);
        if (!customer) {
            toast({ title: "Error", description: "Selected customer not found.", variant: "destructive" });
            return;
        }
        
        let dispatchDetails: Omit<Dispatch, 'invoiceId' | 'date' | 'status' | 'driver'>;

        if (dispatchType === 'eggs') {
            const eggCount = parseInt(eggs, 10);
            const trayCount = parseInt(trays, 10);
            const price = parseFloat(pricePerEgg);
            if (isNaN(eggCount) || eggCount <= 0 || isNaN(price) || price <= 0) {
                toast({ title: "Error", description: "Please enter a valid number of eggs and a valid price.", variant: "destructive" });
                return;
            }
            if (eggCount > inventoryData.readyStock) {
                toast({ title: "Error", description: `Cannot dispatch more eggs than available stock (${inventoryData.readyStock}).`, variant: "destructive" });
                return;
            }
             if (trayCount > inventoryData.emptyTrays) {
                toast({ title: "Error", description: `Cannot dispatch more trays than available stock (${inventoryData.emptyTrays}).`, variant: "destructive" });
                return;
            }

            dispatchDetails = {
                customerId: customer.id,
                customerName: customer.name,
                route: customer.route,
                dispatchType: 'Eggs',
                eggs: eggCount,
                trays: trayCount,
                pricePerEgg: price,
                totalAmount: eggCount * price,
            };
        } else if (dispatchType === 'chicks') {
            const qty = parseInt(chickQuantity, 10);
            const price = parseFloat(pricePerChick);
            if (isNaN(qty) || qty <= 0 || !chickType || !chickShed || isNaN(price) || price <= 0) {
                 toast({ title: "Error", description: "Please fill all chick dispatch details including price.", variant: "destructive" });
                 return;
            }
            if (qty > availableChickStock) {
                toast({ title: "Error", description: `Cannot dispatch more chicks than available in shed (${availableChickStock}).`, variant: "destructive" });
                return;
            }
             dispatchDetails = {
                customerId: customer.id,
                customerName: customer.name,
                route: customer.route,
                dispatchType: 'Chicks',
                chickQuantity: qty,
                chickType: chickType as 'Layer' | 'Dated',
                chickShed: chickShed,
                pricePerChick: price,
                totalAmount: qty * price,
            };
        } else {
            return;
        }
        
        const result = addDispatch(dispatchDetails);
        
        if (result.success) {
            toast({ title: "Dispatch Created", description: result.message });
            resetForm();
            setSheetOpen(false);
        } else {
             toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    }

    return (
        <SheetContent className="sm:max-w-md w-full overflow-y-auto">
        <form onSubmit={handleSubmit}>
            <SheetHeader>
            <SheetTitle className="font-headline">Create New Dispatch</SheetTitle>
            <SheetDescription>
                Fill out the form to create a new dispatch order. A credit note will be automatically generated.
            </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="dispatch-type">Dispatch Type</Label>
                    <Select onValueChange={setDispatchType} value={dispatchType}>
                        <SelectTrigger id="dispatch-type">
                            <SelectValue placeholder="Select dispatch type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="eggs">Eggs</SelectItem>
                            <SelectItem value="chicks">Chicks</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {dispatchType === 'eggs' && (
                    <div className="space-y-4 p-4 border rounded-md">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="eggs">No. of Eggs</Label>
                                <Input id="eggs" type="number" placeholder="e.g., 62" value={eggs} onChange={handleEggsChange} max={inventoryData.readyStock} />
                                <p className="text-xs text-muted-foreground">In Stock: {inventoryData.readyStock.toLocaleString()}</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="trays">No. of Trays</Label>
                                <Input id="trays" type="number" placeholder="e.g., 2" value={trays} onChange={handleTraysChange} max={inventoryData.emptyTrays} />
                                <p className="text-xs text-muted-foreground">In Stock: {inventoryData.emptyTrays.toLocaleString()}</p>
                            </div>
                        </div>
                        {eggBreakdown && (
                            <p className="text-right text-sm text-muted-foreground -mt-2">
                                {eggBreakdown}
                            </p>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="price-per-egg">Price per Egg</Label>
                            <Input id="price-per-egg" type="number" placeholder="e.g., 5.50" value={pricePerEgg} onChange={e => setPricePerEgg(e.target.value)} />
                        </div>
                    </div>
                )}

                {dispatchType === 'chicks' && (
                    <div className="space-y-4 p-4 border rounded-md">
                        <div className="space-y-2">
                            <Label htmlFor="chick-qty">Quantity</Label>
                            <Input id="chick-qty" type="number" placeholder="Number of chicks" value={chickQuantity} onChange={e => setChickQuantity(e.target.value)}/>
                            <p className="text-xs text-muted-foreground">In Stock: {availableChickStock.toLocaleString()}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="chick-type">Chick Type</Label>
                            <Select value={chickType} onValueChange={setChickType}>
                                <SelectTrigger id="chick-type">
                                    <SelectValue placeholder="Select chick type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Layer">Layer</SelectItem>
                                    <SelectItem value="Dated">Dated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="chick-shed">From Shed</Label>
                            <Select value={chickShed} onValueChange={setChickShed}>
                                <SelectTrigger id="chick-shed">
                                    <SelectValue placeholder="Select a shed" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allSheds.map(shed => <SelectItem key={shed} value={shed}>{shed}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="price-per-chick">Price per Chick</Label>
                            <Input id="price-per-chick" type="number" placeholder="e.g., 45.00" value={pricePerChick} onChange={e => setPricePerChick(e.target.value)} />
                        </div>
                    </div>
                )}
                
                <div className="space-y-2">
                    <Label htmlFor="customer-name">Customer</Label>
                    <Select onValueChange={handleCustomerChange} value={selectedCustomerId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                            {customerData.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="route">Route</Label>
                    <Input id="route" value={assignedRoute} placeholder="Assigned automatically" disabled />
                </div>
                
                {totalAmount > 0 && (
                     <div className="space-y-2">
                        <Label className="flex items-center gap-1.5"><IndianRupee className="h-4 w-4"/>Total Amount</Label>
                        <Input className="font-bold" value={`${totalAmount.toFixed(2)}`} readOnly disabled />
                    </div>
                )}
            </div>
            <SheetFooter>
                <Button type="submit">Create Dispatch</Button>
            </SheetFooter>
        </form>
        </SheetContent>
    )
}

const AddRouteSheet = () => {
    const { toast } = useToast();
    const { addRouteName } = useFarm();
    const [routeName, setRouteName] = React.useState("");
    const [isOpen, setIsOpen] = React.useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!routeName.trim()) {
            toast({ title: "Error", description: "Route name cannot be empty.", variant: "destructive" });
            return;
        }
        const result = addRouteName(routeName);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setRouteName("");
            setIsOpen(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="h-auto p-6 flex flex-col gap-2">
                    <PlusCircle className="h-8 w-8 text-muted-foreground"/>
                    <span className="text-muted-foreground">Add New Route</span>
                </Button>
            </SheetTrigger>
            <SheetContent>
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <SheetTitle>Create New Route</SheetTitle>
                        <SheetDescription>
                            Enter a name for the new delivery route. You can assign customers and drivers to it later.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="route-name" className="text-right">
                            Route Name
                        </Label>
                        <Input id="route-name" className="col-span-3" placeholder="e.g., South City Loop" value={routeName} onChange={e => setRouteName(e.target.value)} />
                        </div>
                    </div>
                    <SheetFooter>
                        <Button type="submit">Save Route</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
};


export default function DispatchPage() {
  const { dispatchData, customerData, staffData, routeNames, updateDispatchStatus } = useFarm();
  const [isSheetOpen, setSheetOpen] = React.useState(false);
  const [selectedDispatch, setSelectedDispatch] = React.useState<Dispatch | null>(null);
  
  const allRoutes = React.useMemo(() => {
    const routesFromCustomers = customerData.map(c => c.route).filter(Boolean);
    const routesFromStaff = staffData.flatMap(s => s.assignedRoutes).filter(Boolean);
    return [...new Set([...routesFromCustomers, ...routesFromStaff, ...routeNames])].sort();
  }, [customerData, staffData, routeNames]);

  const routesWithDetails = React.useMemo(() => {
    return allRoutes.map(name => {
      const customersOnRoute = customerData.filter(c => c.route === name);
      const driversOnRoute = staffData.filter(s => s.role === 'Driver' && s.assignedRoutes.includes(name));
      const recentOrders = dispatchData.filter(d => d.route === name).length; // Simplified for now
      return {
        name,
        customers: customersOnRoute,
        drivers: driversOnRoute,
        recentOrders,
      };
    });
  }, [allRoutes, customerData, staffData, dispatchData]);

  const handleStatusUpdate = (dispatchId: string, status: Dispatch['status']) => {
    updateDispatchStatus(dispatchId, status);
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Dispatch Management</CardTitle>
          <CardDescription>
            Assign and track all egg dispatches.
          </CardDescription>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
             <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              New Dispatch
            </Button>
          </SheetTrigger>
          <DispatchForm setSheetOpen={setSheetOpen} />
        </Sheet>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dispatches">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dispatches">Dispatches</TabsTrigger>
            <TabsTrigger value="routes">Route Management</TabsTrigger>
          </TabsList>
          <TabsContent value="dispatches" className="mt-4">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Dispatch Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>
                        <span className="sr-only">Actions</span>
                    </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {dispatchData.map((dispatch) => (
                    <TableRow key={dispatch.invoiceId} onClick={() => setSelectedDispatch(dispatch)} className="cursor-pointer">
                        <TableCell className="font-medium underline hover:text-primary">{dispatch.invoiceId}</TableCell>
                        <TableCell>{dispatch.customerName}</TableCell>
                        <TableCell>{dispatch.driver}</TableCell>
                        <TableCell>{dispatch.route}</TableCell>
                        <TableCell>{format(new Date(dispatch.date), 'PP')}</TableCell>
                        <TableCell>
                           {dispatch.dispatchType === 'Eggs' && `${dispatch.trays} trays`}
                           {dispatch.dispatchType === 'Chicks' && `${dispatch.chickQuantity} chicks`}
                        </TableCell>
                        <TableCell className="text-right font-mono">{(dispatch.totalAmount ?? 0).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                        <Badge variant={statusVariant[dispatch.status as keyof typeof statusVariant] as any}>{dispatch.status}</Badge>
                        </TableCell>
                        <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                             <DropdownMenuItem
                                disabled={dispatch.status === 'In Transit' || dispatch.status === 'Delivered'}
                                onClick={() => handleStatusUpdate(dispatch.invoiceId, 'In Transit')}
                              >
                                Mark as In Transit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={dispatch.status === 'Delivered'}
                                onClick={() => handleStatusUpdate(dispatch.invoiceId, 'Delivered')}
                              >
                                Mark as Delivered
                              </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                                Cancel
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                    {dispatchData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center h-24">No dispatches found.</TableCell>
                      </TableRow>
                    )}
                </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="routes" className="mt-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {routesWithDetails.map(route => (
                 <Card key={route.name}>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Route className="h-5 w-5"/>
                                {route.name}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Route Actions</DropdownMenuLabel>
                                    <DropdownMenuItem>Assign Driver</DropdownMenuItem>
                                    <DropdownMenuItem>Edit Route</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardTitle>
                        {route.drivers.length > 0 && (
                            <CardDescription>
                                Driver(s): <span className="font-medium">{route.drivers.map(d => d.name).join(', ')}</span>
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-muted-foreground"/>
                                Assigned Customers ({route.customers.length})
                            </h4>
                            {route.customers.length > 0 ? (
                                <ul className="text-sm text-muted-foreground list-disc pl-5">
                                    {route.customers.map(c => <li key={c.id}>{c.name}</li>)}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No customers assigned.</p>
                            )}
                        </div>
                         <div>
                            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                <Package className="h-4 w-4 text-muted-foreground"/>
                                Recent Orders
                            </h4>
                             <p className="text-lg font-bold">{route.recentOrders}</p>
                        </div>
                    </CardContent>
                 </Card>
              ))}
               <Card className="border-dashed flex items-center justify-center">
                    <AddRouteSheet />
                </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    <DispatchDetailSheet 
        dispatch={selectedDispatch}
        isOpen={!!selectedDispatch}
        onOpenChange={(open) => { if(!open) setSelectedDispatch(null) }}
    />
    </>
  )
}
