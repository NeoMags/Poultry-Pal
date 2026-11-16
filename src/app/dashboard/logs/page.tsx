
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
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, History, Search, ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { useFarm, LogEntry } from "@/context/FarmContext"

const modules = [
    "Authentication",
    "Chick Management",
    "Feed Manager",
    "Dispatch",
    "Reports",
    "Return Manager",
    "Task Manager",
    "Driver & Vehicle",
    "Egg Collection",
    "Accounts",
    "Shed Management"
]

type SortKey = keyof LogEntry;
type SortDirection = "asc" | "desc";

export default function LogsPage() {
    const { logs } = useFarm();
    const [date, setDate] = React.useState<Date>()
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedModule, setSelectedModule] = React.useState("all");
    const [sortKey, setSortKey] = React.useState<SortKey>("timestamp");
    const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");
    const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);


    const handleSort = (key: SortKey) => {
      if (sortKey === key) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
        setSortKey(key);
        setSortDirection('asc');
      }
    };

    const filteredLogs = React.useMemo(() => {
        return logs
            .filter(log => {
                const searchMatch = searchTerm.length === 0 ||
                    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
                
                const moduleMatch = selectedModule === "all" || log.module === selectedModule;

                const dateMatch = !date || format(new Date(log.timestamp), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');

                return searchMatch && moduleMatch && dateMatch;
            })
            .sort((a, b) => {
              const valA = a[sortKey];
              const valB = b[sortKey];

              if (valA === undefined || valA === null) return 1;
              if (valB === undefined || valB === null) return -1;
              
              let comparison = 0;
              if (sortKey === 'timestamp') {
                comparison = new Date(valA).getTime() - new Date(valB).getTime();
              } else if (typeof valA === 'string' && typeof valB === 'string') {
                comparison = valA.localeCompare(valB);
              }

              return sortDirection === 'asc' ? comparison : -comparison;
            });
    }, [logs, searchTerm, selectedModule, date, sortKey, sortDirection]);

  const SortableHeader = ({ sortKey: key, children }: { sortKey: SortKey, children: React.ReactNode }) => (
     <TableHead onClick={() => handleSort(key)} className="cursor-pointer hover:bg-muted">
        <div className="flex items-center gap-2">
            {children}
            {sortKey === key && <ArrowUpDown className="h-4 w-4" />}
        </div>
    </TableHead>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
            <History className="h-6 w-6"/>
            Activity Logs
        </CardTitle>
        <CardDescription>
          Review all actions performed within the system. Use the filters to narrow down your search.
        </CardDescription>
        <div className="pt-4 flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    type="search" 
                    placeholder="Search by action, user, or details..." 
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                 <Select value={selectedModule} onValueChange={setSelectedModule}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by module" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Modules</SelectItem>
                        {modules.map(module => <SelectItem key={module} value={module}>{module}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full md:w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Filter by date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(selectedDate) => {
                            setDate(selectedDate);
                            setIsDatePickerOpen(false);
                        }}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader sortKey="action">Action</SortableHeader>
              <TableHead>Details</TableHead>
              <SortableHeader sortKey="module">Module</SortableHeader>
              <SortableHeader sortKey="user">User</SortableHeader>
              <SortableHeader sortKey="timestamp">Timestamp</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.action}</TableCell>
                <TableCell>{log.details}</TableCell>
                <TableCell>{log.module}</TableCell>
                <TableCell>{log.user}</TableCell>
                <TableCell>{format(new Date(log.timestamp), "PPpp")}</TableCell>
              </TableRow>
            ))}
             {filteredLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No logs found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
