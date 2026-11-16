

"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFarm, Shed, Task } from "@/context/FarmContext";
import { AlertTriangle, Percent, PlusCircle, Trash2, Calendar as CalendarIcon, Repeat, Edit, Pill } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Calendar } from "../ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";


const AddMedicationDialog = ({ shed, onSave }: { shed: Shed, onSave: (task: Omit<Task, 'id' | 'status'>) => void }) => {
    const { itemMaster, staffData } = useFarm();
    const [title, setTitle] = React.useState("");
    const [assignedTo, setAssignedTo] = React.useState("");
    const [reminderDate, setReminderDate] = React.useState<Date>();
    const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
    const [isRecurring, setIsRecurring] = React.useState(false);
    const [interval, setInterval] = React.useState("7");

    const healthItems = itemMaster.filter(item => item.category === 'Health');
    const shedSupervisors = staffData.filter(s => s.role === 'Shed Supervisor');

    const handleSave = () => {
        if (!title || !assignedTo || !reminderDate) {
            alert("Please fill out Medication, Assignee, and Start Date.");
            return;
        }

        const taskData: Omit<Task, 'id' | 'status'> = {
            projectId: "PROJ-SHED-MEDS",
            title: `Medication for ${shed.name}: ${title}`,
            assignedTo,
            shedId: shed.name,
            reminderDate: reminderDate.toISOString(),
            recurrence: isRecurring ? { type: 'daily', interval: parseInt(interval, 10) } : undefined
        };
        onSave(taskData);
    }
    
    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Schedule New Medication for {shed.name}</AlertDialogTitle>
                <AlertDialogDescription>
                    Create a new scheduled task for a medication.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
                 <div className="space-y-2">
                    <Label htmlFor="med-name">Medication Name</Label>
                    <Select onValueChange={setTitle} value={title}>
                        <SelectTrigger><SelectValue placeholder="Select a medication"/></SelectTrigger>
                        <SelectContent>
                            {healthItems.map(item => <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="med-assignee">Assign To</Label>
                    <Select onValueChange={setAssignedTo} value={assignedTo}>
                        <SelectTrigger><SelectValue placeholder="Select a staff member"/></SelectTrigger>
                        <SelectContent>
                            {shedSupervisors.map(staff => <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="med-date">Start Date</Label>
                     <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn(!reminderDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{reminderDate ? format(reminderDate, "PPP") : "Select date"}</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={reminderDate} onSelect={(d) => {setReminderDate(d); setIsDatePickerOpen(false);}}/></PopoverContent>
                     </Popover>
                 </div>
                 <div className="flex items-center space-x-2">
                    <input type="checkbox" id="recurring-check" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} />
                    <Label htmlFor="recurring-check">Recurring Task?</Label>
                 </div>
                 {isRecurring && (
                    <div className="flex items-center gap-2 pl-6">
                        <Repeat className="h-4 w-4"/>
                        <Label>Every</Label>
                        <Input type="number" value={interval} onChange={e => setInterval(e.target.value)} className="w-16 h-8"/>
                        <Label>day(s)</Label>
                    </div>
                 )}
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSave}>Schedule Task</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}

interface ShedAlertConfigSheetProps {
  shed: Shed | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShedAlertConfigSheet({ shed, isOpen, onOpenChange }: ShedAlertConfigSheetProps) {
  const { toast } = useToast();
  const { updateShed, tasks, addTask, deleteTask } = useFarm();

  const [productionThreshold, setProductionThreshold] = React.useState("");
  const [feedThreshold, setFeedThreshold] = React.useState("");
  const [isAddMedDialogOpen, setIsAddMedDialogOpen] = React.useState(false);
  
  const medicationTasks = React.useMemo(() => {
    if (!shed) return [];
    return tasks.filter(task => task.shedId === shed.name);
  }, [tasks, shed]);


  React.useEffect(() => {
    if (shed) {
      setProductionThreshold(shed.productionAlertThreshold?.toString() || "");
      setFeedThreshold(shed.feedAlertThreshold?.toString() || "");
    }
  }, [shed]);


  const handleThresholdSubmit = () => {
    if (!shed) return;

    const updates: Partial<Shed> = {
        productionAlertThreshold: productionThreshold ? parseFloat(productionThreshold) : undefined,
        feedAlertThreshold: feedThreshold ? parseFloat(feedThreshold) : undefined,
    };
    
    const result = updateShed(shed.name, updates);
    if (result.success) {
      toast({ title: "Success", description: `Alert settings for ${shed.name} have been updated.` });
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };
  
  const handleScheduleMedication = (taskData: Omit<Task, 'id' | 'status'>) => {
    const result = addTask(taskData);
     if (result.success) {
      toast({ title: "Success", description: `Medication scheduled for ${shed?.name}.` });
      setIsAddMedDialogOpen(false);
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  }

  if (!shed) return null;

  return (
    <>
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 font-headline">
                <AlertTriangle className="h-6 w-6 text-destructive"/>
                Configure Alerts for {shed.name}
            </SheetTitle>
            <SheetDescription>
              Set custom alert thresholds and medication schedules for this shed.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2 p-4 border rounded-lg">
                <Label htmlFor="prod-threshold">Low Production Threshold (%)</Label>
                <div className="flex items-center gap-2">
                    <Input
                        id="prod-threshold"
                        type="number"
                        placeholder="e.g., 85"
                        value={productionThreshold}
                        onChange={(e) => setProductionThreshold(e.target.value)}
                    />
                    <Percent className="h-4 w-4 text-muted-foreground"/>
                </div>
                <p className="text-xs text-muted-foreground">Alert when production % drops below this value.</p>
            </div>
             <div className="space-y-2 p-4 border rounded-lg">
                <Label htmlFor="feed-threshold">Low Feed Threshold (%)</Label>
                 <div className="flex items-center gap-2">
                    <Input
                        id="feed-threshold"
                        type="number"
                        placeholder="e.g., 20"
                        value={feedThreshold}
                        onChange={(e) => setFeedThreshold(e.target.value)}
                    />
                     <Percent className="h-4 w-4 text-muted-foreground"/>
                </div>
                <p className="text-xs text-muted-foreground">Alert when remaining feed % drops below this value.</p>
            </div>
            
            <div className="space-y-2 p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                    <Label>Medication Schedule</Label>
                    <AlertDialog open={isAddMedDialogOpen} onOpenChange={setIsAddMedDialogOpen}>
                        <AlertDialogTrigger asChild>
                           <Button size="sm" variant="outline" className="gap-1"><PlusCircle className="h-4 w-4"/>Schedule</Button>
                        </AlertDialogTrigger>
                        <AddMedicationDialog shed={shed} onSave={handleScheduleMedication}/>
                    </AlertDialog>
                </div>
                 <p className="text-xs text-muted-foreground">Schedule one-time or recurring medication reminders.</p>
                 <div className="space-y-2 pt-2">
                    {medicationTasks.length > 0 ? (
                        medicationTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                <div className="flex items-center gap-2">
                                  <Pill className="h-4 w-4 text-primary" />
                                  <div>
                                     <p className="font-medium">{task.title.replace(`Medication for ${shed.name}: `, '')}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Due: {format(parseISO(task.reminderDate!), "PP")}
                                        {task.recurrence && ` (every ${task.recurrence.interval} days)`}
                                      </p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTask(task.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-center text-muted-foreground py-2">No medications scheduled.</p>
                    )}
                 </div>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleThresholdSubmit}>Save Settings</Button>
          </SheetFooter>
      </SheetContent>
    </Sheet>
    </>
  );
}
