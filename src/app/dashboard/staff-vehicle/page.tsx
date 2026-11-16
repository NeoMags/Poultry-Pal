

"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { User, Route, CalendarOff, Truck, ShieldCheck, Wrench, PlusCircle, Upload, Calendar as CalendarIcon, MoreHorizontal, CheckCircle, XCircle, History } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { format, parseISO, differenceInDays } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import StaffDetailSheet from "@/components/dashboard/staff-detail-sheet"
import VehicleDetailSheet from "@/components/dashboard/vehicle-detail-sheet"
import { useFarm, Staff, Vehicle, AttendanceLog } from "@/context/FarmContext"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"


const statusVariant = {
  Active: "secondary",
  Available: "secondary",
  Expired: "destructive",
  "In Use": "default",
  Maintenance: "destructive",
  Inactive: "outline"
};

const attendanceStatusVariant = {
  Present: "secondary",
  Absent: "destructive",
  Leave: "default",
} as const;


const roles = ["Driver", "Shed Supervisor", "Accounts", "General Staff", "Manager", "Admin"];
const vehicleStatuses = ["Available", "In Use", "Maintenance"];

type AttendanceRecord = { staffId: string; status: 'Present' | 'Absent' | 'Leave' };

const AttendanceLogger = () => {
    const { staffData, logAttendance, attendanceData } = useFarm();
    const { toast } = useToast();
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const [attendance, setAttendance] = React.useState<Record<string, 'Present' | 'Absent' | 'Leave'>>({});
    
    // Pre-fill attendance from today's logs
    React.useEffect(() => {
        const todaysLogs = attendanceData.filter(log => log.date === todayStr);
        const initialAttendance: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
        todaysLogs.forEach(log => {
            initialAttendance[log.staffId] = log.status;
        });
        staffData.forEach(staff => {
            if (!initialAttendance[staff.id]) {
                initialAttendance[staff.id] = 'Present'; // Default to present
            }
        })
        setAttendance(initialAttendance);
    }, [staffData, attendanceData, todayStr]);


    const handleStatusChange = (staffId: string, status: 'Present' | 'Absent' | 'Leave') => {
        setAttendance(prev => ({ ...prev, [staffId]: status }));
    };

    const handleSave = () => {
        const recordsToSave: AttendanceRecord[] = Object.entries(attendance).map(([staffId, status]) => ({
            staffId,
            status,
        }));
        const result = logAttendance(recordsToSave);
        if (result.success) {
            toast({ title: "Attendance Saved", description: "Today's attendance has been logged successfully." });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };
    
    const activeStaff = staffData.filter(s => s.status === 'Active');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Log Today's Attendance</CardTitle>
                <CardDescription>
                    Mark the attendance for all active staff members for {format(new Date(), 'PP')}.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {activeStaff.map(staff => (
                    <div key={staff.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                            <p className="font-medium">{staff.name}</p>
                            <p className="text-sm text-muted-foreground">{staff.role}</p>
                        </div>
                        <RadioGroup 
                            value={attendance[staff.id] || 'Present'} 
                            onValueChange={(value) => handleStatusChange(staff.id, value as any)}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Present" id={`present-${staff.id}`} />
                                <Label htmlFor={`present-${staff.id}`}>Present</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Absent" id={`absent-${staff.id}`} />
                                <Label htmlFor={`absent-${staff.id}`}>Absent</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Leave" id={`leave-${staff.id}`} />
                                <Label htmlFor={`leave-${staff.id}`}>Leave</Label>
                            </div>
                        </RadioGroup>
                    </div>
                ))}
                 {activeStaff.length === 0 && (
                    <p className="text-muted-foreground text-center">No active staff found.</p>
                )}
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleSave}>Save Attendance</Button>
            </CardFooter>
        </Card>
    );
};


export default function StaffVehiclePage() {
  const { toast } = useToast();
  const { staffData, addStaff, updateStaff, deleteStaff, setStaffStatus, vehicleData, addVehicle, attendanceData } = useFarm();
  const [selectedStaff, setSelectedStaff] = React.useState<Staff | null>(null);
  const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null);

  const [isStaffSheetOpen, setIsStaffSheetOpen] = React.useState(false);
  const [isVehicleSheetOpen, setIsVehicleSheetOpen] = React.useState(false);

  // Staff form state
  const [staffName, setStaffName] = React.useState("");
  const [aadhar, setAadhar] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [role, setRole] = React.useState("");
  const [joiningDate, setJoiningDate] = React.useState<Date>();
  const [isJoiningDatePickerOpen, setIsJoiningDatePickerOpen] = React.useState(false);
  const [licence, setLicence] = React.useState("");
  
  // Vehicle form state
  const [make, setMake] = React.useState("");
  const [model, setModel] = React.useState("");
  const [chassisNumber, setChassisNumber] = React.useState("");
  const [engineNumber, setEngineNumber] = React.useState("");
  const [registrationNumber, setRegistrationNumber] = React.useState("");
  const [registrationDate, setRegistrationDate] = React.useState<Date>();
  const [isRegDatePickerOpen, setIsRegDatePickerOpen] = React.useState(false);
  const [insuranceDate, setInsuranceDate] = React.useState<Date>();
  const [isInsDatePickerOpen, setIsInsDatePickerOpen] = React.useState(false);
  const [insuranceAlertDays, setInsuranceAlertDays] = React.useState("");

  const resetStaffForm = () => {
    setStaffName("");
    setAadhar("");
    setPhone("");
    setAddress("");
    setRole("");
    setJoiningDate(undefined);
    setLicence("");
    setIsStaffSheetOpen(false);
  }
  
  const resetVehicleForm = () => {
    setMake("");
    setModel("");
    setChassisNumber("");
    setEngineNumber("");
    setRegistrationNumber("");
    setRegistrationDate(undefined);
    setInsuranceDate(undefined);
    setInsuranceAlertDays("");
    setIsVehicleSheetOpen(false);
  }

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !role || !joiningDate) {
        toast({ title: "Error", description: "Name, Role and Joining Date are required.", variant: "destructive" });
        return;
    }
    const result = addStaff({
        name: staffName,
        role: role,
        assignedRoutes: [],
        status: "Active",
        joiningDate: format(joiningDate, "yyyy-MM-dd"),
        aadhar, phone, address, licence
    });
    
    if (result.success) {
        toast({ title: "Staff Added", description: result.message });
        resetStaffForm();
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive"});
    }
  };

  const handleUpdateStaff = (updatedStaff: Staff) => {
    const result = updateStaff(updatedStaff);
    if (result.success) {
        toast({ title: "Success", description: `Details for ${updatedStaff.name} have been updated.`})
        return true;
    }
    toast({ title: "Error", description: result.message, variant: "destructive"});
    return false;
  };

  const handleSetStatus = (staffId: string, newStatus: "Active" | "Inactive") => {
    const result = setStaffStatus(staffId, newStatus);
    if(result.success) {
        toast({ title: "Status Updated", description: result.message });
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };
  
  const handleDeleteStaff = (staffId: string) => {
    const result = deleteStaff(staffId);
    if (result.success) {
        toast({ title: "Staff Deleted", description: result.message });
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  }

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationNumber.trim() || !make.trim() || !model.trim() || !registrationDate || !insuranceDate) {
        toast({ title: "Error", description: "Registration No, Make, Model, and all dates are required.", variant: "destructive" });
        return;
    }
    const result = addVehicle({
        make,
        model,
        chassisNumber,
        engineNumber,
        registrationNumber,
        registrationDate: format(registrationDate, 'yyyy-MM-dd'),
        insuranceDate: format(insuranceDate, 'yyyy-MM-dd'),
        insuranceAlertDays: insuranceAlertDays ? parseInt(insuranceAlertDays, 10) : undefined,
        status: 'Available'
    });
    
    if (result.success) {
        toast({ title: "Vehicle Added", description: `Successfully added vehicle ${registrationNumber}.` });
        resetVehicleForm();
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };
  
  const vehiclesWithStatus = React.useMemo(() => {
    return vehicleData.map(vehicle => {
      let statusText = 'N/A';
      let statusVariant: "secondary" | "destructive" | "default" | "outline" = "outline";

      if (vehicle.insuranceDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const insuranceDate = parseISO(vehicle.insuranceDate);
        const daysUntilRenewal = differenceInDays(insuranceDate, today);

        if (daysUntilRenewal < 0) {
          statusText = `Expired ${-daysUntilRenewal} days ago`;
          statusVariant = "destructive";
        } else if (daysUntilRenewal <= (vehicle.insuranceAlertDays || 10)) {
          statusText = `Due in ${daysUntilRenewal} days`;
          statusVariant = "default";
        } else {
          statusText = `Due on ${format(insuranceDate, 'PP')}`;
          statusVariant = "secondary";
        }
      }
      return { ...vehicle, insuranceStatusText: statusText, insuranceStatusVariant: statusVariant };
    });
  }, [vehicleData]);


  return (
    <>
    <Card>
      <CardHeader>
          <CardTitle className="font-headline">Staff &amp; Vehicle Management</CardTitle>
          <CardDescription>View, add, and manage all your staff and vehicles.</CardDescription>
      </CardHeader>
      <CardContent>
          <Tabs defaultValue="staff">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>
            <TabsContent value="staff" className="mt-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <CardTitle>Staff List</CardTitle>
                            <CardDescription>Click a row to view or edit staff details.</CardDescription>
                        </div>
                    <Sheet open={isStaffSheetOpen} onOpenChange={setIsStaffSheetOpen}>
                        <SheetTrigger asChild>
                            <Button size="sm" className="gap-1">
                                <PlusCircle className="h-4 w-4" />
                                Add Staff
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                            <form onSubmit={handleAddStaff}>
                                <SheetHeader>
                                    <SheetTitle className="font-headline">Add New Staff Member</SheetTitle>
                                    <SheetDescription>
                                        Fill in the details for the new staff member.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="staff-name" className="text-right">Name</Label>
                                        <Input id="staff-name" value={staffName} onChange={(e) => setStaffName(e.target.value)} className="col-span-3" placeholder="Full name" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="staff-aadhar" className="text-right">Aadhar</Label>
                                        <Input id="staff-aadhar" value={aadhar} onChange={(e) => setAadhar(e.target.value)} className="col-span-3" placeholder="XXXX XXXX XXXX" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="staff-phone" className="text-right">Phone No.</Label>
                                        <Input id="staff-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" placeholder="+91 XXXXXXXXXX" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="staff-address" className="text-right">Address</Label>
                                        <Textarea id="staff-address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-3" placeholder="Full address" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="staff-role" className="text-right">Role</Label>
                                        <Select onValueChange={setRole} value={role}>
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((r, index) => <SelectItem key={`${r}-${index}`} value={r}>{r}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="staff-joining-date" className="text-right">Joining Date</Label>
                                        <Popover open={isJoiningDatePickerOpen} onOpenChange={setIsJoiningDatePickerOpen}>
                                            <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                "col-span-3 justify-start text-left font-normal",
                                                !joiningDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {joiningDate ? format(joiningDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                mode="single"
                                                selected={joiningDate}
                                                onSelect={(date) => { setJoiningDate(date); setIsJoiningDatePickerOpen(false); }}
                                                initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    {role === 'Driver' && (
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="staff-licence" className="text-right">Licence No.</Label>
                                            <Input id="staff-licence" value={licence} onChange={(e) => setLicence(e.target.value)} className="col-span-3" placeholder="Driver's licence number" />
                                        </div>
                                    )}
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="staff-id-upload" className="text-right">ID Proof</Label>
                                        <div className="col-span-3 flex items-center gap-2">
                                            <Input id="staff-id-upload" type="file" className="flex-1"/>
                                            <Button type="button" variant="ghost" size="icon"><Upload className="h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                </div>
                                <SheetFooter>
                                    <Button type="submit">Save Staff</Button>
                                </SheetFooter>
                            </form>
                        </SheetContent>
                    </Sheet>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {staffData.map((staff) => (
                                    <TableRow key={staff.id} className="cursor-pointer" onClick={() => setSelectedStaff(staff)}>
                                        <TableCell className="font-medium">{staff.name}</TableCell>
                                        <TableCell>{staff.role}</TableCell>
                                        <TableCell>{staff.phone}</TableCell>
                                        <TableCell><Badge variant={statusVariant[staff.status]}>{staff.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4"/></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => setSelectedStaff(staff)}>View/Edit Details</DropdownMenuItem>
                                                    {staff.status === 'Active' ? (
                                                        <DropdownMenuItem onSelect={() => handleSetStatus(staff.id, 'Inactive')}>Set Inactive</DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onSelect={() => handleSetStatus(staff.id, 'Active')}>Set Active</DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete {staff.name}. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteStaff(staff.id)}>Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
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
            </TabsContent>
            <TabsContent value="vehicles" className="mt-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <CardTitle>Vehicle List</CardTitle>
                            <CardDescription>View and manage all vehicles in your fleet.</CardDescription>
                        </div>
                        <Sheet open={isVehicleSheetOpen} onOpenChange={setIsVehicleSheetOpen}>
                            <SheetTrigger asChild>
                                <Button size="sm" className="gap-1">
                                    <PlusCircle className="h-4 w-4" />
                                    Add Vehicle
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                                <form onSubmit={handleAddVehicle}>
                                    <SheetHeader>
                                        <SheetTitle className="font-headline">Add New Vehicle</SheetTitle>
                                        <SheetDescription>
                                            Add a new vehicle to your fleet with all the necessary details.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="vehicle-reg" className="text-right">Reg. Number</Label>
                                            <Input id="vehicle-reg" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} className="col-span-3" placeholder="e.g., KA-01-XY-1234" required />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="vehicle-make" className="text-right">Make</Label>
                                            <Input id="vehicle-make" value={make} onChange={(e) => setMake(e.target.value)} className="col-span-3" placeholder="e.g., Tata" required/>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="vehicle-model" className="text-right">Model</Label>
                                            <Input id="vehicle-model" value={model} onChange={(e) => setModel(e.target.value)} className="col-span-3" placeholder="e.g., Ace" required/>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="chassis-no" className="text-right">Chassis No.</Label>
                                            <Input id="chassis-no" value={chassisNumber} onChange={(e) => setChassisNumber(e.target.value)} className="col-span-3" placeholder="Chassis Number" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="engine-no" className="text-right">Engine No.</Label>
                                            <Input id="engine-no" value={engineNumber} onChange={(e) => setEngineNumber(e.target.value)} className="col-span-3" placeholder="Engine Number" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="reg-date" className="text-right">Reg. Date</Label>
                                            <Popover open={isRegDatePickerOpen} onOpenChange={setIsRegDatePickerOpen}>
                                                <PopoverTrigger asChild>
                                                <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal", !registrationDate && "text-muted-foreground")} >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {registrationDate ? format(registrationDate, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={registrationDate} onSelect={(date) => { setRegistrationDate(date); setIsRegDatePickerOpen(false); }} /></PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="ins-expiry-date" className="text-right">Insurance Date</Label>
                                            <Popover open={isInsDatePickerOpen} onOpenChange={setIsInsDatePickerOpen}>
                                                <PopoverTrigger asChild>
                                                <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal", !insuranceDate && "text-muted-foreground")} >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {insuranceDate ? format(insuranceDate, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={insuranceDate} onSelect={(date) => { setInsuranceDate(date); setIsInsDatePickerOpen(false); }} /></PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="insurance-alert" className="text-right">Alert (Days)</Label>
                                            <Input
                                                id="insurance-alert"
                                                type="number"
                                                className="col-span-3"
                                                placeholder="e.g., 10"
                                                value={insuranceAlertDays}
                                                onChange={(e) => setInsuranceAlertDays(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <SheetFooter>
                                        <Button type="submit">Save Vehicle</Button>
                                    </SheetFooter>
                                </form>
                            </SheetContent>
                        </Sheet>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reg. Number</TableHead>
                                    <TableHead>Make &amp; Model</TableHead>
                                    <TableHead>Insurance</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vehiclesWithStatus.map((vehicle) => (
                                    <TableRow key={vehicle.id} className="cursor-pointer" onClick={() => setSelectedVehicle(vehicle)}>
                                        <TableCell className="font-medium font-mono">{vehicle.registrationNumber}</TableCell>
                                        <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                                        <TableCell><Badge variant={vehicle.insuranceStatusVariant}>{vehicle.insuranceStatusText}</Badge></TableCell>
                                        <TableCell><Badge variant={statusVariant[vehicle.status] || 'default'}>{vehicle.status}</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="attendance" className="mt-6 space-y-6">
               <AttendanceLogger />

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5"/>
                        Attendance History
                    </CardTitle>
                    <CardDescription>A log of all past attendance records.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Staff Member</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20).map(log => {
                           const staff = staffData.find(s => s.id === log.staffId);
                           return (
                             <TableRow key={log.id}>
                               <TableCell>{format(parseISO(log.date), "PP")}</TableCell>
                               <TableCell>{staff?.name || 'Unknown Staff'}</TableCell>
                               <TableCell>
                                 <Badge variant={attendanceStatusVariant[log.status] || 'default'}>
                                   {log.status}
                                 </Badge>
                               </TableCell>
                             </TableRow>
                           );
                        })}
                         {attendanceData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">No attendance records found.</TableCell>
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
    <StaffDetailSheet 
        staff={selectedStaff}
        isOpen={!!selectedStaff}
        onOpenChange={(open) => { if (!open) setSelectedStaff(null); }}
        onUpdateStaff={handleUpdateStaff}
        roles={roles}
    />
     <VehicleDetailSheet
        vehicle={selectedVehicle}
        isOpen={!!selectedVehicle}
        onOpenChange={(open) => { if (!open) setSelectedVehicle(null); }}
      />
    </>
  )
}
