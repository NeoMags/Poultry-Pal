

"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { User, Edit, X, Calendar as CalendarIcon, CalendarOff, PlusCircle, ClipboardCheck, CheckCircle } from "lucide-react"
import { useFarm, type Staff, type Task } from "@/context/FarmContext"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../ui/card"
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
import { Badge } from "../ui/badge"

interface StaffDetailSheetProps {
  staff: Staff | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStaff: (updatedStaff: Staff) => boolean;
  roles: string[];
}

const LeaveRequestDialog = ({ staff, onOpenChange }: { staff: Staff, onOpenChange: (open: boolean) => void }) => {
    const { toast } = useToast();
    const { requestLeave } = useFarm();
    const [leaveDate, setLeaveDate] = React.useState<Date>();
    const [reason, setReason] = React.useState("");
    const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);


    const handleSubmit = () => {
        if (!leaveDate || !reason) {
            toast({ title: "Error", description: "Please provide a date and a reason for the leave request.", variant: "destructive" });
            return;
        }
        const result = requestLeave(staff.id, format(leaveDate, "yyyy-MM-dd"), reason);
        if (result.success) {
            toast({ title: "Leave Requested", description: result.message });
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Request Leave for {staff.name}</AlertDialogTitle>
                <AlertDialogDescription>
                    Select a date and provide a reason. This will be sent for approval.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="leave-date" className="text-right">Leave Date</Label>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "col-span-3 justify-start text-left font-normal",
                            !leaveDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {leaveDate ? format(leaveDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={leaveDate} onSelect={(date) => { setLeaveDate(date); setIsDatePickerOpen(false); }} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="leave-reason" className="text-right">Reason</Label>
                    <Input id="leave-reason" value={reason} onChange={e => setReason(e.target.value)} className="col-span-3" placeholder="e.g., Personal reason" />
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit}>Submit Request</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}

const CompleteTaskDialog = ({ task, onOpenChange }: { task: Task, onOpenChange: (open: boolean) => void }) => {
    const { toast } = useToast();
    const { updateTask } = useFarm();
    const [completionNotes, setCompletionNotes] = React.useState("");

    const handleSubmit = () => {
        const result = updateTask(task.id, { status: 'Done', completionNotes });
        if (result.success) {
            toast({ title: "Task Completed", description: `Task "${task.title}" marked as done.` });
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Complete Task: "{task.title}"</AlertDialogTitle>
                <AlertDialogDescription>
                    Add any notes related to the completion of this task.
                </AlertDialogDescription>
            </AlertDialogHeader>
             <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="completion-notes">Completion Notes (Optional)</Label>
                    <Textarea
                        id="completion-notes"
                        placeholder="e.g., All shed fans cleaned and tested."
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                    />
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit}>Mark as Done</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}

export default function StaffDetailSheet({ staff, isOpen, onOpenChange, onUpdateStaff, roles }: StaffDetailSheetProps) {
  const { toast } = useToast();
  const { tasks, projects } = useFarm();
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [editedStaff, setEditedStaff] = React.useState<Staff | null>(staff);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = React.useState(false);
  const [isCompleteTaskDialogOpen, setIsCompleteTaskDialogOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  const assignedTasks = React.useMemo(() => {
    if (!staff) return [];
    return tasks.filter(t => t.assignedTo === staff.id);
  }, [staff, tasks]);

  React.useEffect(() => {
    setEditedStaff(staff);
    setIsEditMode(false); // Reset edit mode when staff changes
  }, [staff]);

  const handleInputChange = (field: keyof Staff, value: string) => {
    if (editedStaff) {
      setEditedStaff({ ...editedStaff, [field]: value });
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (editedStaff && date) {
      setEditedStaff({ ...editedStaff, joiningDate: format(date, "yyyy-MM-dd") });
    }
    setIsDatePickerOpen(false);
  };
  
  const handleSaveChanges = () => {
    if (editedStaff) {
      const success = onUpdateStaff(editedStaff);
      if (success) {
        setIsEditMode(false);
      }
    }
  };
  
  const handleCompleteTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsCompleteTaskDialogOpen(true);
  }

  if (!staff) return null;

  return (
    <>
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-headline text-2xl">
            <User className="h-7 w-7" />
            Staff Details
          </SheetTitle>
          <SheetDescription>
            {isEditMode ? "Edit the staff member's details below." : "View details for this staff member."}
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 grid gap-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Name</Label>
                    <Input value={editedStaff?.name || ''} disabled={!isEditMode} onChange={(e) => handleInputChange('name', e.target.value)} />
                </div>
                 <div className="space-y-1">
                    <Label>Role</Label>
                    <Select value={editedStaff?.role} disabled={!isEditMode} onValueChange={(value) => handleInputChange('role', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Aadhar Number</Label>
                    <Input value={editedStaff?.aadhar || ''} disabled={!isEditMode} onChange={(e) => handleInputChange('aadhar', e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label>Phone Number</Label>
                    <Input value={editedStaff?.phone || ''} disabled={!isEditMode} onChange={(e) => handleInputChange('phone', e.target.value)} />
                </div>
            </div>
             <div className="space-y-1">
                <Label>Address</Label>
                <Textarea value={editedStaff?.address || ''} disabled={!isEditMode} onChange={(e) => handleInputChange('address', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Joining Date</Label>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            disabled={!isEditMode}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !editedStaff?.joiningDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editedStaff?.joiningDate ? format(parseISO(editedStaff.joiningDate), "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={editedStaff?.joiningDate ? parseISO(editedStaff.joiningDate) : undefined}
                                onSelect={handleDateChange}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                 <div className="space-y-1">
                    <Label>Status</Label>
                    <Input value={editedStaff?.status || ''} disabled />
                </div>
            </div>
             {editedStaff?.role === 'Driver' && (
                <div className="space-y-1">
                    <Label>Driver's Licence</Label>
                    <Input value={editedStaff?.licence || ''} disabled={!isEditMode} onChange={(e) => handleInputChange('licence', e.target.value)} />
                </div>
             )}
            
            <Separator />

             <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-5 w-5"/>Assigned Tasks</CardTitle>
                    <CardDescription>Tasks currently assigned to this staff member.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {assignedTasks.length > 0 ? (
                        assignedTasks.map(task => {
                            const project = projects.find(p => p.id === task.projectId);
                            return (
                                <div key={task.id} className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium">{task.title}</p>
                                            <Badge variant="outline" className="mt-1">Project: {project?.title || 'N/A'}</Badge>
                                        </div>
                                        <Badge variant={task.status === 'Done' ? 'secondary' : 'default'}>{task.status}</Badge>
                                    </div>
                                    {task.status !== 'Done' ? (
                                        <div className="flex justify-end mt-2">
                                             <Button size="sm" variant="secondary" onClick={() => handleCompleteTaskClick(task)}>Complete Task</Button>
                                        </div>
                                    ) : (
                                        task.completionNotes && (
                                            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                                <strong>Notes:</strong> {task.completionNotes}
                                            </p>
                                        )
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-sm text-muted-foreground text-center">No tasks assigned.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><CalendarOff className="h-5 w-5"/>Leave Management</CardTitle>
                    <CardDescription>Request a leave of absence for this staff member.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-end">
                    <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" disabled={staff.status === 'Inactive'}>
                                Request Leave
                            </Button>
                        </AlertDialogTrigger>
                        <LeaveRequestDialog staff={staff} onOpenChange={setIsLeaveDialogOpen} />
                    </AlertDialog>
                </CardContent>
            </Card>

        </div>
        
        <SheetFooter>
            {isEditMode ? (
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setIsEditMode(false); setEditedStaff(staff); }}>
                        <X className="mr-2 h-4 w-4"/>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveChanges}>Save Changes</Button>
                </div>
            ) : (
                <Button variant="outline" onClick={() => setIsEditMode(true)}>
                    <Edit className="mr-2 h-4 w-4"/>
                    Edit Details
                </Button>
            )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
    {selectedTask && (
        <AlertDialog open={isCompleteTaskDialogOpen} onOpenChange={setIsCompleteTaskDialogOpen}>
            <CompleteTaskDialog task={selectedTask} onOpenChange={setIsCompleteTaskDialogOpen} />
        </AlertDialog>
    )}
    </>
  )
}
