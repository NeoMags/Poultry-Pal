

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClipboardCheck, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useFarm } from "@/context/FarmContext";
import { useMemo } from "react";
import { Bell, AlertTriangle, Wrench, Check, X, UserCheck, Percent } from "lucide-react";
import { differenceInDays, parseISO, addDays, format, isToday, isPast } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const formatDuration = (hours: number): string => {
    if (isNaN(hours) || hours <= 0) return "N/A";
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    if (days > 0) return `${days}d ${remainingHours}h`;
    return `${remainingHours}h`;
};


export default function AlertsCard() {
  const { 
    getShedsWithDetails,
    inventoryData,
    vehicleData, 
    leaveRequests,
    staffData,
    approveLeave,
    denyLeave,
    itemMaster,
    feedStockData,
    tasks,
  } = useFarm();
  const { toast } = useToast();

  const handleApprove = (e: React.MouseEvent, requestId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const result = approveLeave(requestId);
     if (result.success) {
      toast({ title: "Leave Approved", description: result.message });
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const handleDeny = (e: React.MouseEvent, requestId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const result = denyLeave(requestId);
      if (result.success) {
      toast({ title: "Leave Denied", description: result.message });
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const lowStockAlerts = itemMaster.map(masterItem => {
    if (!masterItem.lowStockAlert) return null;

    let totalStock = 0;
    if (masterItem.id === 'SYS_EGGS') {
        totalStock = inventoryData.readyStock;
    } else if (masterItem.id === 'SYS_TRAYS') {
        totalStock = inventoryData.emptyTrays;
    } else {
        totalStock = feedStockData
            .filter(fs => fs.name.toLowerCase() === masterItem.name.toLowerCase())
            .reduce((sum, item) => sum + item.stock, 0);
    }
    

    if (totalStock < masterItem.lowStockAlert) {
         return {
            type: 'alert' as const,
            id: `lowstock-${masterItem.id}`,
            href: '/dashboard/items-inventory',
            icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
            text: `Stock for ${masterItem.name} is low: ${totalStock.toLocaleString()} ${masterItem.unit} remaining.`,
            time: "Just now"
        };
    }
    return null;
  }).filter(Boolean);
    
  const insuranceRenewalAlerts = vehicleData.map(vehicle => {
    if (!vehicle.insuranceDate) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const insuranceDate = parseISO(vehicle.insuranceDate);
    
    const daysUntilRenewal = differenceInDays(insuranceDate, today);
    const alertDays = vehicle.insuranceAlertDays || 10;

    if (daysUntilRenewal >= 0 && daysUntilRenewal <= alertDays) {
        return {
            type: 'alert' as const,
            id: `ins-${vehicle.id}`,
            href: '/dashboard/staff-vehicle',
            icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
            text: `Insurance for ${vehicle.registrationNumber} is due for renewal in ${daysUntilRenewal} days.`,
            time: "Upcoming"
        };
    }
    return null;
  }).filter(Boolean);

  const maintenanceAlerts = vehicleData.map(vehicle => {
    if (!vehicle.lastMaintenanceDate || !vehicle.maintenanceIntervalDays) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastMaintenance = parseISO(vehicle.lastMaintenanceDate);
    const nextMaintenance = addDays(lastMaintenance, vehicle.maintenanceIntervalDays);
    const daysUntilMaintenance = differenceInDays(nextMaintenance, today);
    const alertDays = 7; // Alert within 7 days

    if (daysUntilMaintenance >= 0 && daysUntilMaintenance <= alertDays) {
      return {
        type: 'alert' as const,
        id: `maint-${vehicle.id}`,
        href: '/dashboard/staff-vehicle',
        icon: <Wrench className="h-5 w-5 text-blue-500" />,
        text: `Maintenance for ${vehicle.registrationNumber} is due in ${daysUntilMaintenance} days.`,
        time: "Upcoming"
      };
    }
     if (daysUntilMaintenance < 0) {
      return {
        type: 'alert' as const,
        id: `maint-overdue-${vehicle.id}`,
        href: '/dashboard/staff-vehicle',
        icon: <Wrench className="h-5 w-5 text-destructive" />,
        text: `Maintenance for ${vehicle.registrationNumber} is ${-daysUntilMaintenance} days overdue.`,
        time: "Overdue"
      };
    }
    return null;
  }).filter(Boolean);

  const pendingLeaveRequests = leaveRequests
    .filter(req => req.status === 'Pending')
    .map(req => {
        const staff = staffData.find(s => s.id === req.staffId);
        return {
            type: 'leave' as const,
            id: `leave-${req.id}`,
            href: '/dashboard/staff-vehicle',
            icon: <UserCheck className="h-5 w-5 text-blue-500" />,
            text: `${staff?.name || 'Unknown'} requested leave for ${format(parseISO(req.leaveDate), 'PP')}.`,
            time: `Reason: ${req.reason}`,
            requestId: req.id,
        }
    });
    
    const taskReminders = useMemo(() => {
        return tasks.map(task => {
            if (!task.reminderDate) return null;
            
            const assignee = staffData.find(s => s.id === task.assignedTo);
            const reminderDate = parseISO(task.reminderDate);
            let isDue = false;

            if (task.recurrence?.type === 'daily') {
                const daysSinceStart = differenceInDays(new Date(), reminderDate);
                if (daysSinceStart >= 0 && daysSinceStart % task.recurrence.interval === 0) {
                    isDue = true;
                }
            } else {
                if (isToday(reminderDate) || isPast(reminderDate)) {
                    isDue = true;
                }
            }
            
            if (!isDue) return null;

            const timeText = isToday(reminderDate) ? "Today" : `${format(reminderDate, 'PP')}`;
            return {
                type: 'alert' as const,
                id: `task-${task.id}`,
                href: '/dashboard/task-manager',
                icon: <ClipboardCheck className="h-5 w-5 text-orange-500" />,
                text: `Task Reminder: "${task.title}" for ${assignee?.name || 'Unassigned'}.`,
                time: `Due: ${timeText}`
            }
        }).filter(Boolean);
    }, [tasks, staffData]);
    
    const shedAlerts = useMemo(() => {
      const allShedAlerts: any[] = [];
      const sheds = getShedsWithDetails();

      sheds.forEach(shed => {
          // Low Production Alert
          if (shed.productionAlertThreshold !== undefined && shed.productionPercentage < shed.productionAlertThreshold) {
              allShedAlerts.push({
                  type: 'alert' as const,
                  id: `shed-prod-${shed.name}`,
                  href: '/dashboard/shed-overview',
                  icon: <Percent className="h-5 w-5 text-orange-500"/>,
                  text: `Production in ${shed.name} is low: ${shed.productionPercentage.toFixed(1)}%.`,
                  time: `Threshold: ${shed.productionAlertThreshold}%`
              });
          }

          // Low Feed Alert
          if (shed.feedAlertThreshold !== undefined && shed.lastRefillDate && shed.feedAtLastRefill > 0) {
              const remainingPercentage = (shed.feedAtLastRefill > 0) ? (shed.remainingKg / shed.feedAtLastRefill) * 100 : 0;
              if (remainingPercentage < shed.feedAlertThreshold) {
                  allShedAlerts.push({
                      type: 'alert' as const,
                      id: `shed-feed-${shed.name}`,
                      href: '/dashboard/shed-overview',
                      icon: <AlertTriangle className="h-5 w-5 text-destructive"/>,
                      text: `Feed in ${shed.name} is low: ${remainingPercentage.toFixed(1)}% remaining.`,
                      time: `Est. ${formatDuration(shed.remainingHours)} left`
                  });
              }
          }

          // Meds Due Alert
          if (shed.medsDue > 0) {
             allShedAlerts.push({
                  type: 'alert' as const,
                  id: `shed-meds-${shed.name}`,
                  href: '/dashboard/shed-overview',
                  icon: <Wrench className="h-5 w-5 text-blue-500"/>,
                  text: `${shed.medsDue} medication(s) are due for ${shed.name}.`,
                  time: "Action required"
              });
          }
      });
      return allShedAlerts;

    }, [getShedsWithDetails]);



  const allAlerts = [...pendingLeaveRequests, ...taskReminders, ...shedAlerts, ...lowStockAlerts, ...insuranceRenewalAlerts, ...maintenanceAlerts];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline">Alerts & Notifications</CardTitle>
        </div>
        <CardDescription>
            Urgent updates, reminders, and approval requests for your farm.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-1">
        {allAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No alerts right now.</p>
        ) : (
            allAlerts.slice(0, 4).map((alert) => (
            <Link key={alert.id} href={alert.href} className="block p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                  <div className="mt-1">{alert.icon}</div>
                  <div className="flex-1">
                      <p className="text-sm font-medium">{alert.text}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                  {alert.type === 'leave' && (
                    <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:bg-green-100 hover:text-green-700" onClick={(e) => handleApprove(e, alert.requestId)}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-red-100 hover:text-destructive" onClick={(e) => handleDeny(e, alert.requestId)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                  )}
              </div>
            </Link>
            ))
        )}
      </CardContent>
       <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
            View All Alerts
        </Button>
      </CardFooter>
    </Card>
  );
}
