

"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings as SettingsIcon, Wheat, Edit, PlusCircle } from "lucide-react"
import { useFarm, AlertConfig } from "@/context/FarmContext"
import { useToast } from "@/hooks/use-toast"
import React from "react"
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

// Mock data based on the app's structure
const roles = ["Admin", "Manager", "Staff", "Driver", "Accounts", "Shed Supervisor", "Delivery"]
const features = [
  "Dashboard",
  "Chick Management",
  "Shed Overview",
  "Feed Manager",
  "Egg Collection",
  "Dispatch",
  "Driver & Vehicle",
  "Return Manager",
  "Accounts",
  "Reports",
  "Task Manager",
  "Logs",
  "Settings",
]

// Mock access control data to represent current permissions
const accessControlData = features.reduce((acc, feature) => {
  acc[feature] = {
    Admin: true,
    Manager: true,
    Staff: ["Egg Collection", "Feed Manager", "Shed Overview"].includes(feature),
    Driver: ["Dispatch", "Return Manager", "Driver & Vehicle"].includes(feature),
    Accounts: ["Accounts", "Reports", "Dispatch"].includes(feature),
    "Shed Supervisor": ["Shed Overview", "Chick Management", "Feed Manager", "Egg Collection", "Logs"].includes(feature),
    Delivery: ["Dispatch", "Return Manager"].includes(feature),
  }
  return acc
}, {} as Record<string, Record<string, boolean>>)


const EditAlertDialog = ({ alert, isOpen, onOpenChange, onSave }: { alert: AlertConfig, isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (threshold?: number) => void }) => {
    const [threshold, setThreshold] = React.useState<string>(alert.threshold?.toString() || "");

    React.useEffect(() => {
        setThreshold(alert.threshold?.toString() || "");
    }, [alert]);

    const handleSave = () => {
        const value = threshold ? parseFloat(threshold) : undefined;
        if (threshold && (value === undefined || isNaN(value) || value < 0)) {
            // Simple validation, can be enhanced
            // `alert` here is the AlertConfig prop, so call the browser dialog explicitly
            window.alert("Please enter a valid, non-negative number.");
            return;
        }
        onSave(value);
        onOpenChange(false);
    };

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Edit Alert: {alert.name}</AlertDialogTitle>
                <AlertDialogDescription>{alert.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
                <Label htmlFor="alert-threshold">Threshold Value</Label>
                <Input
                    id="alert-threshold"
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="Enter value..."
                />
                 <p className="text-xs text-muted-foreground mt-1">Leave blank to disable threshold.</p>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSave}>Save</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    );
};


export default function SettingsPage() {
  const { feedSettings, updateFeedSettings, alertConfigs, updateAlertConfig } = useFarm();
  const { toast } = useToast();
  const [consumptionRate, setConsumptionRate] = React.useState('');
  const [isAlertDialogOpen, setIsAlertDialogOpen] = React.useState(false);
  const [selectedAlert, setSelectedAlert] = React.useState<AlertConfig | null>(null);

  React.useEffect(() => {
    if (feedSettings?.hoursPerKgPerChick) {
      setConsumptionRate(feedSettings.hoursPerKgPerChick.toString());
    }
  }, [feedSettings]);

  const handleSaveFeedSettings = () => {
    const consumption = parseFloat(consumptionRate);
    if (isNaN(consumption) || consumption <= 0) {
      toast({ title: "Error", description: "Please enter a valid, positive number for the consumption rate.", variant: "destructive" });
      return;
    }
    updateFeedSettings({ hoursPerKgPerChick: consumption });
    toast({ title: "Success", description: "Feed settings have been updated." });
  }

  const handleAlertToggle = (alertId: string, enabled: boolean) => {
    updateAlertConfig(alertId, { enabled });
  };
  
  const handleOpenAlertEdit = (alert: AlertConfig) => {
    if (alert.threshold === undefined) {
        toast({ title: "Info", description: "This alert does not have a configurable threshold."});
        return;
    }
    setSelectedAlert(alert);
    setIsAlertDialogOpen(true);
  };

  const handleSaveAlertThreshold = (threshold?: number) => {
    if (selectedAlert) {
      updateAlertConfig(selectedAlert.id, { threshold });
      toast({ title: "Success", description: `Threshold for "${selectedAlert.name}" updated.` });
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <SettingsIcon className="h-6 w-6" />
          System Settings
        </CardTitle>
        <CardDescription>
          Manage application-wide settings, access control, and security policies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="access-control">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="access-control">Access Control</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          <TabsContent value="access-control" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Permissions by Role</CardTitle>
                <CardDescription>
                  Enable or disable access to modules for different user roles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">Feature</TableHead>
                        {roles.map((role) => (
                          <TableHead key={role} className="text-center">{role}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {features.map((feature) => (
                        <TableRow key={feature}>
                          <TableCell className="font-medium">{feature.replace(/-/g, " ")}</TableCell>
                          {roles.map((role) => (
                            <TableCell key={role} className="text-center">
                              <Switch
                                id={`${feature}-${role}`}
                                checked={(accessControlData[feature] as any)[role]}
                                disabled={role === "Admin"}
                                aria-label={`Toggle ${feature} for ${role}`}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t pt-6">
                <Button>Save Permissions</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Alert Configuration</CardTitle>
                    <CardDescription>
                        Enable, disable, and configure system-wide alerts.
                    </CardDescription>
                </div>
                 <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    New Custom Alert
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {alertConfigs.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1 pr-4">
                            <h4 className="font-medium">{alert.name}</h4>
                            <p className="text-sm text-muted-foreground">{alert.description} {alert.threshold !== undefined && `(Current: ${alert.threshold}${alert.id.includes('Production') ? '%' : ''})`}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenAlertEdit(alert)} disabled={alert.threshold === undefined}>
                                <Edit className="h-4 w-4"/>
                                <span className="sr-only">Configure</span>
                            </Button>
                            <Switch 
                              checked={alert.enabled} 
                              onCheckedChange={(checked) => handleAlertToggle(alert.id, checked)}
                              aria-label={`Toggle ${alert.name}`} 
                            />
                        </div>
                    </div>
                ))}
              </CardContent>
               <CardFooter className="justify-end border-t pt-6">
                <Button>Save Alert Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Policies</CardTitle>
                <CardDescription>Manage password and session settings.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 max-w-md">
                <div className="grid gap-2">
                  <Label htmlFor="password-expiry">Password Expiry (days)</Label>
                  <Input id="password-expiry" type="number" placeholder="e.g., 90" defaultValue="90" />
                  <p className="text-sm text-muted-foreground">
                    Set to 0 to disable password expiration.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6 justify-end">
                <Button>Save Security Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="feed" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wheat className="h-5 w-5" />
                  Feed Consumption Settings
                </CardTitle>
                <CardDescription>
                  Define parameters for feed consumption calculation and alerts.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 max-w-md">
                 <div className="grid gap-2">
                  <Label htmlFor="consumption-rate">Time for 1 Chick to Consume 1kg of Feed (hours)</Label>
                  <Input
                    id="consumption-rate"
                    type="number"
                    placeholder="e.g., 96"
                    value={consumptionRate}
                    onChange={(e) => setConsumptionRate(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    This value is used to predict feed exhaustion time in real-time.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6 justify-end">
                <Button onClick={handleSaveFeedSettings}>Save Feed Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Set application-wide default values.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 max-w-md">
                <div className="grid gap-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="kn">Kannada</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    This will be the default language for new users and the login screen.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6 justify-end">
                <Button>Save General Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    {selectedAlert && (
        <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
            <EditAlertDialog
                alert={selectedAlert}
                isOpen={isAlertDialogOpen}
                onOpenChange={setIsAlertDialogOpen}
                onSave={handleSaveAlertThreshold}
            />
        </AlertDialog>
    )}
    </>
  )
}
