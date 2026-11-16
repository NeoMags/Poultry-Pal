

"use client"

import * as React from "react"
import { useFarm, Project, Task, RecurrenceRule } from "@/context/FarmContext"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ClipboardCheck, MoreHorizontal, PlusCircle, Bell, UserPlus, Calendar as CalendarIcon, Repeat } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"

const statusVariant = {
  "To Do": "secondary",
  "In Progress": "default",
  Done: "outline",
}

export default function TaskManagerPage() {
  const { 
    projects, 
    tasks, 
    staffData,
    addProject,
    addTask,
    updateTask,
    deleteTask,
  } = useFarm();
  const { toast } = useToast();

  const [isProjectSheetOpen, setIsProjectSheetOpen] = React.useState(false);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = React.useState(false);
  const [newProjectTitle, setNewProjectTitle] = React.useState("");
  const [currentProjectId, setCurrentProjectId] = React.useState<string | null>(null);

  // State for new task form
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskAssignee, setNewTaskAssignee] = React.useState("");

  // State for recurring reminder popover
  const [recurringPopoverOpen, setRecurringPopoverOpen] = React.useState(false);
  const [recurringTaskId, setRecurringTaskId] = React.useState<string | null>(null);
  const [recurrenceInterval, setRecurrenceInterval] = React.useState<string>("1");

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) {
      toast({ title: "Error", description: "Project title cannot be empty.", variant: "destructive" });
      return;
    }
    const result = addProject(newProjectTitle);
    if (result.success) {
      toast({ title: "Project Created", description: result.message });
      setNewProjectTitle("");
      setIsProjectSheetOpen(false);
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };
  
  const openTaskSheet = (projectId: string) => {
    setCurrentProjectId(projectId);
    setIsTaskSheetOpen(true);
  }
  
  const closeTaskSheet = () => {
    setCurrentProjectId(null);
    setNewTaskTitle("");
    setNewTaskAssignee("");
    setIsTaskSheetOpen(false);
  }
  
  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProjectId || !newTaskTitle.trim() || !newTaskAssignee) {
        toast({ title: "Error", description: "Please fill out all task details.", variant: "destructive"});
        return;
    }
    const result = addTask({
      projectId: currentProjectId,
      title: newTaskTitle,
      assignedTo: newTaskAssignee
    });
    if (result.success) {
      toast({ title: "Task Added", description: `Task has been added to the project.` });
      closeTaskSheet();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive"});
    }
  }
  
  const handleStatusChange = (taskId: string, status: Task['status']) => {
    const result = updateTask(taskId, { status });
    if(result.success) {
      toast({ title: "Status Updated", description: "Task status has been changed."});
    } else {
       toast({ title: "Error", description: result.message, variant: "destructive"});
    }
  }

  const handleAssigneeChange = (taskId: string, assignedTo: string) => {
    const result = updateTask(taskId, { assignedTo });
    if(result.success) {
      toast({ title: "Assignee Updated", description: "Task has been reassigned."});
    } else {
       toast({ title: "Error", description: result.message, variant: "destructive"});
    }
  }
  
  const handleReminderChange = (taskId: string, date: Date | undefined) => {
    const reminderDate = date ? date.toISOString() : undefined;
    const result = updateTask(taskId, { reminderDate, recurrence: undefined }); // Clear recurrence when setting a single date
     if(result.success) {
      toast({ title: "Reminder Set", description: `Reminder for task has been ${date ? 'set' : 'cleared'}.`});
    } else {
       toast({ title: "Error", description: result.message, variant: "destructive"});
    }
  }

  const handleSetRecurrence = (taskId: string) => {
    const interval = parseInt(recurrenceInterval, 10);
    if (isNaN(interval) || interval <= 0) {
      toast({ title: "Error", description: "Please enter a valid positive number for the interval.", variant: "destructive"});
      return;
    }
    
    const recurrence: RecurrenceRule = {
        type: 'daily',
        interval: interval
    };

    const task = tasks.find(t => t.id === taskId);
    
    const result = updateTask(taskId, { 
        recurrence, 
        // If no start date is set, use today as the start date
        reminderDate: task?.reminderDate || new Date().toISOString()
    });

    if(result.success) {
      toast({ title: "Reminder Set", description: `Task will now recur every ${interval} day(s).`});
    } else {
       toast({ title: "Error", description: result.message, variant: "destructive"});
    }
    setRecurringPopoverOpen(false);
  }

  const getRecurrenceText = (task: Task) => {
    if (!task.recurrence) return null;
    if (task.recurrence.type === 'daily') {
        if (task.recurrence.interval === 1) return "Recurs daily";
        return `Recurs every ${task.recurrence.interval} days`;
    }
    return null;
  }

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Task Manager</h1>
          <p className="text-muted-foreground">
            Organize, assign, and track tasks across projects.
          </p>
        </div>
        <Sheet open={isProjectSheetOpen} onOpenChange={setIsProjectSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              New Project
            </Button>
          </SheetTrigger>
          <SheetContent>
            <form onSubmit={handleProjectSubmit}>
              <SheetHeader>
                <SheetTitle className="font-headline">Create New Project</SheetTitle>
                <SheetDescription>
                  Enter a title for the new project. You can add tasks to it later.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="project-title" className="text-right">
                      Title
                    </Label>
                    <Input id="project-title" value={newProjectTitle} onChange={e => setNewProjectTitle(e.target.value)} className="col-span-3" placeholder="e.g., Q4 Maintenance" />
                  </div>
              </div>
              <SheetFooter>
                  <Button type="submit">Save Project</Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {projects.map((project) => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            return (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-headline">{project.title}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openTaskSheet(project.id)}>
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only">Add Task</span>
                    </Button>
                  </div>
                  <CardDescription>
                    {projectTasks.length} task(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {projectTasks.length > 0 ? (
                    projectTasks.map((task) => {
                        const assignee = staffData.find(s => s.id === task.assignedTo);
                        const recurrenceText = getRecurrenceText(task);
                        return (
                          <div key={task.id} className="flex items-start gap-4 p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{task.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={`https://placehold.co/32x32.png`} data-ai-hint="profile person" />
                                  <AvatarFallback>
                                    {assignee?.name.substring(0, 2) || 'N/A'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                  {assignee?.name || "Unassigned"}
                                </span>
                              </div>
                               {recurrenceText ? (
                                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                        <Repeat className="h-3 w-3 text-primary" />
                                        <span>{recurrenceText} (Starts {format(parseISO(task.reminderDate!), "PP")})</span>
                                    </div>
                               ) : task.reminderDate && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                    <Bell className="h-3 w-3 text-primary" />
                                    <span>{format(parseISO(task.reminderDate), "PP")}</span>
                                </div>
                               )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={statusVariant[task.status as keyof typeof statusVariant] as any}>
                                {task.status}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button aria-haspopup="true" size="icon" variant="ghost" className="h-7 w-7">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Toggle menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                      <UserPlus className="mr-2 h-4 w-4" />
                                      Assign to
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                      <DropdownMenuRadioGroup value={task.assignedTo} onValueChange={(value) => handleAssigneeChange(task.id, value)}>
                                        {staffData.map(staff => (
                                          <DropdownMenuRadioItem key={staff.id} value={staff.id}>{staff.name}</DropdownMenuRadioItem>
                                        ))}
                                      </DropdownMenuRadioGroup>
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                      <ClipboardCheck className="mr-2 h-4 w-4" />
                                      Change Status
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                      <DropdownMenuRadioGroup value={task.status} onValueChange={(value) => handleStatusChange(task.id, value as Task['status'])}>
                                          <DropdownMenuRadioItem value="To Do">To Do</DropdownMenuRadioItem>
                                          <DropdownMenuRadioItem value="In Progress">In Progress</DropdownMenuRadioItem>
                                          <DropdownMenuRadioItem value="Done">Done</DropdownMenuRadioItem>
                                      </DropdownMenuRadioGroup>
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                  <DropdownMenuSub>
                                     <DropdownMenuSubTrigger>
                                        <Bell className="mr-2 h-4 w-4" />
                                        Set Reminder
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="p-0">
                                        <DropdownMenuLabel>One-Time Reminder</DropdownMenuLabel>
                                        <Calendar
                                            mode="single"
                                            selected={task.reminderDate && !task.recurrence ? parseISO(task.reminderDate) : undefined}
                                            onSelect={(date) => handleReminderChange(task.id, date)}
                                        />
                                        <DropdownMenuSeparator/>
                                         <Popover open={recurringPopoverOpen && recurringTaskId === task.id} onOpenChange={(open) => { if(!open) setRecurringTaskId(null); setRecurringPopoverOpen(open);}}>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" className="w-full justify-start gap-2 px-2" onClick={() => { setRecurringTaskId(task.id); setRecurrenceInterval(task.recurrence?.interval.toString() || "1") }}>
                                                    <Repeat className="h-4 w-4" />
                                                    Recurring Reminder
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-60" side="right" align="start">
                                                 <div className="space-y-4">
                                                    <p className="font-medium">Set Daily Recurrence</p>
                                                    <div className="flex items-center gap-2">
                                                        <span>Every</span>
                                                        <Input type="number" value={recurrenceInterval} onChange={e => setRecurrenceInterval(e.target.value)} className="w-16 h-8"/>
                                                        <span>day(s)</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">The task will be due based on this interval from its start date.</p>
                                                    <Button size="sm" onClick={() => handleSetRecurrence(task.id)}>Save</Button>
                                                 </div>
                                            </PopoverContent>
                                         </Popover>
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => deleteTask(task.id)}>
                                    Delete Task
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        )
                    })
                  ) : (
                    <p className="text-sm text-center text-muted-foreground py-4">No tasks in this project yet.</p>
                  )}
                </CardContent>
              </Card>
            )
        })}
        <Card className="border-dashed">
            <CardHeader className="flex items-center justify-center text-center">
                 <Button variant="ghost" className="h-auto p-6 flex flex-col gap-2" onClick={() => setIsProjectSheetOpen(true)}>
                    <PlusCircle className="h-8 w-8 text-muted-foreground"/>
                    <span className="text-muted-foreground">Add New Project</span>
                </Button>
            </CardHeader>
        </Card>
      </div>
    </div>
    
    <Sheet open={isTaskSheetOpen} onOpenChange={closeTaskSheet}>
        <SheetContent>
            <form onSubmit={handleTaskSubmit}>
                <SheetHeader>
                    <SheetTitle>Add New Task</SheetTitle>
                    <SheetDescription>
                        Add a task to project: {projects.find(p => p.id === currentProjectId)?.title || ''}
                    </SheetDescription>
                </SheetHeader>
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-title" className="text-right">
                        Title
                        </Label>
                        <Input id="task-title" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="col-span-3" placeholder="e.g., Service delivery vehicles" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-assignee" className="text-right">
                        Assign To
                        </Label>
                        <Select onValueChange={setNewTaskAssignee} value={newTaskAssignee}>
                            <SelectTrigger id="task-assignee" className="col-span-3">
                                <SelectValue placeholder="Select staff member" />
                            </SelectTrigger>
                            <SelectContent>
                                {staffData.map(staff => (
                                <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <SheetFooter>
                    <Button type="submit">Add Task</Button>
                </SheetFooter>
            </form>
        </SheetContent>
    </Sheet>
    </>
  )
}
