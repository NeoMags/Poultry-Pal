

"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFarm, Vehicle, FuelLog, VehicleMaintenanceLog } from "@/context/FarmContext"
import { Truck, Hash, Gauge, Droplets, Calendar, Wrench, PlusCircle } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils";

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number | null }) => {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2">
            <div className="text-muted-foreground w-5 h-5 flex-shrink-0">{icon}</div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium text-sm leading-tight">{value}</p>
            </div>
        </div>
    )
}

interface VehicleDetailSheetProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VehicleDetailSheet({ vehicle, isOpen, onOpenChange }: VehicleDetailSheetProps) {
    const { toast } = useToast();
    const { fuelLogData, vehicleMaintenanceLogData, addFuelLog, addVehicleMaintenanceLog } = useFarm();

    const [isFuelSheetOpen, setIsFuelSheetOpen] = React.useState(false);
    const [isMaintSheetOpen, setIsMaintSheetOpen] = React.useState(false);
    
    // Fuel form state
    const [fuelDate, setFuelDate] = React.useState<Date>();
    const [isFuelDatePickerOpen, setIsFuelDatePickerOpen] = React.useState(false);
    const [liters, setLiters] = React.useState("");
    const [cost, setCost] = React.useState("");
    const [odometer, setOdometer] = React.useState("");

    // Maintenance form state
    const [maintDate, setMaintDate] = React.useState<Date>();
    const [isMaintDatePickerOpen, setIsMaintDatePickerOpen] = React.useState(false);
    const [description, setDescription] = React.useState("");
    const [maintCost, setMaintCost] = React.useState("");

    React.useEffect(() => {
      if (!isFuelSheetOpen) {
        setFuelDate(undefined);
        setLiters("");
        setCost("");
        setOdometer("");
      }
    }, [isFuelSheetOpen]);

    React.useEffect(() => {
      if (!isMaintSheetOpen) {
        setMaintDate(undefined);
        setDescription("");
        setMaintCost("");
      }
    }, [isMaintSheetOpen]);

    const handleFuelSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!vehicle || !fuelDate || !liters || !cost) {
            toast({ title: "Error", description: "Date, Liters, and Cost are required.", variant: "destructive" });
            return;
        }
        const result = addFuelLog({
            vehicleId: vehicle.id,
            date: format(fuelDate, 'yyyy-MM-dd'),
            liters: parseFloat(liters),
            cost: parseFloat(cost),
            odometerReading: odometer ? parseFloat(odometer) : undefined
        });
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setIsFuelSheetOpen(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    }

    const handleMaintSubmit = (e: React.FormEvent) => {
         e.preventDefault();
        if (!vehicle || !maintDate || !description || !maintCost) {
            toast({ title: "Error", description: "Date, Description, and Cost are required.", variant: "destructive" });
            return;
        }
        const result = addVehicleMaintenanceLog({
            vehicleId: vehicle.id,
            date: format(maintDate, 'yyyy-MM-dd'),
            description,
            cost: parseFloat(maintCost),
        });
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setIsMaintSheetOpen(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    }

    const historyForVehicle = React.useMemo(() => {
        if (!vehicle) return { fuel: [], maintenance: [] };
        return {
            fuel: fuelLogData.filter(f => f.vehicleId === vehicle.id),
            maintenance: vehicleMaintenanceLogData.filter(m => m.vehicleId === vehicle.id)
        }
    }, [vehicle, fuelLogData, vehicleMaintenanceLogData]);

    if (!vehicle) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Truck className="h-7 w-7" />
                        <div className="flex flex-col">
                            <span>{vehicle.make} {vehicle.model}</span>
                            <span className="text-sm font-mono font-normal text-muted-foreground">{vehicle.registrationNumber}</span>
                        </div>
                    </SheetTitle>
                </SheetHeader>

                <Tabs defaultValue="details" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="fuel">Fuel Log</TabsTrigger>
                        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="mt-4">
                       <div className="grid grid-cols-2 gap-y-4 gap-x-2 py-4">
                           <InfoRow icon={<Hash />} label="Chassis Number" value={vehicle.chassisNumber} />
                           <InfoRow icon={<Hash />} label="Engine Number" value={vehicle.engineNumber} />
                           <InfoRow icon={<Calendar />} label="Registration Date" value={format(parseISO(vehicle.registrationDate), 'PP')} />
                           <InfoRow icon={<Calendar />} label="Insurance Expiry" value={format(parseISO(vehicle.insuranceDate), 'PP')} />
                       </div>
                    </TabsContent>
                    <TabsContent value="fuel" className="mt-4">
                       <Card>
                         <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2"><Droplets className="h-5 w-5"/>Fuel History</CardTitle>
                            </div>
                             <Sheet open={isFuelSheetOpen} onOpenChange={setIsFuelSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button size="sm" className="gap-1"><PlusCircle className="h-4 w-4" />Log Fuel</Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <form onSubmit={handleFuelSubmit}>
                                        <SheetHeader>
                                            <SheetTitle>Log Fuel Entry</SheetTitle>
                                            <SheetDescription>Record a new fuel purchase for this vehicle.</SheetDescription>
                                        </SheetHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Date</Label>
                                                <Popover open={isFuelDatePickerOpen} onOpenChange={setIsFuelDatePickerOpen}>
                                                    <PopoverTrigger asChild><Button variant="outline" className={cn(!fuelDate && "text-muted-foreground")}><Calendar className="mr-2 h-4 w-4"/>{fuelDate ? format(fuelDate, "PPP") : "Select date"}</Button></PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fuelDate} onSelect={(date) => { setFuelDate(date); setIsFuelDatePickerOpen(false); }} /></PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="space-y-2"><Label htmlFor="liters">Liters</Label><Input id="liters" type="number" value={liters} onChange={e => setLiters(e.target.value)} /></div>
                                            <div className="space-y-2"><Label htmlFor="cost">Total Cost</Label><Input id="cost" type="number" value={cost} onChange={e => setCost(e.target.value)} /></div>
                                            <div className="space-y-2"><Label htmlFor="odometer">Odometer Reading (optional)</Label><Input id="odometer" type="number" value={odometer} onChange={e => setOdometer(e.target.value)} /></div>
                                        </div>
                                        <SheetFooter><Button type="submit">Save Entry</Button></SheetFooter>
                                    </form>
                                </SheetContent>
                            </Sheet>
                         </CardHeader>
                         <CardContent>
                             <Table>
                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Liters</TableHead><TableHead className="text-right">Cost</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {historyForVehicle.fuel.map(log => <TableRow key={log.id}><TableCell>{format(parseISO(log.date), 'PP')}</TableCell><TableCell>{log.liters} L</TableCell><TableCell className="text-right">₹{log.cost.toFixed(2)}</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                         </CardContent>
                       </Card>
                    </TabsContent>
                    <TabsContent value="maintenance" className="mt-4">
                         <Card>
                         <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2"><Wrench className="h-5 w-5"/>Maintenance History</CardTitle>
                            </div>
                             <Sheet open={isMaintSheetOpen} onOpenChange={setIsMaintSheetOpen}>
                                <SheetTrigger asChild><Button size="sm" className="gap-1"><PlusCircle className="h-4 w-4" />Log Service</Button></SheetTrigger>
                                <SheetContent>
                                    <form onSubmit={handleMaintSubmit}>
                                        <SheetHeader>
                                            <SheetTitle>Log Maintenance/Repair</SheetTitle>
                                            <SheetDescription>Record a new service entry for this vehicle.</SheetDescription>
                                        </SheetHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Date</Label>
                                                <Popover open={isMaintDatePickerOpen} onOpenChange={setIsMaintDatePickerOpen}>
                                                    <PopoverTrigger asChild><Button variant="outline" className={cn(!maintDate && "text-muted-foreground")}><Calendar className="mr-2 h-4 w-4"/>{maintDate ? format(maintDate, "PPP") : "Select date"}</Button></PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={maintDate} onSelect={(date) => { setMaintDate(date); setIsMaintDatePickerOpen(false); }} /></PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="space-y-2"><Label htmlFor="desc">Description</Label><Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} /></div>
                                            <div className="space-y-2"><Label htmlFor="maint-cost">Total Cost</Label><Input id="maint-cost" type="number" value={maintCost} onChange={e => setMaintCost(e.target.value)} /></div>
                                        </div>
                                        <SheetFooter><Button type="submit">Save Entry</Button></SheetFooter>
                                    </form>
                                </SheetContent>
                            </Sheet>
                         </CardHeader>
                         <CardContent>
                             <Table>
                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Cost</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {historyForVehicle.maintenance.map(log => <TableRow key={log.id}><TableCell>{format(parseISO(log.date), 'PP')}</TableCell><TableCell>{log.description}</TableCell><TableCell className="text-right">₹{log.cost.toFixed(2)}</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                         </CardContent>
                       </Card>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}
