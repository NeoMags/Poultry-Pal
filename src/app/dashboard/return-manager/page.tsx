

"use client"

import * as React from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useFarm, Dispatch, Customer } from "@/context/FarmContext"
import { Undo2, Package, AlertTriangle, Box, User, IndianRupee, Egg } from "lucide-react"
import { format } from "date-fns"
import { Separator } from "@/components/ui/separator"

export default function ReturnManagementPage() {
  const { toast } = useToast()
  const { dispatchData, customerData, processReturn } = useFarm()
  
  const [selectedDispatchId, setSelectedDispatchId] = React.useState("")
  const [undeliveredEggs, setUndeliveredEggs] = React.useState("")
  const [damagedEggs, setDamagedEggs] = React.useState("")
  const [emptyTrays, setEmptyTrays] = React.useState("")
  const [remarks, setRemarks] = React.useState("")

  const selectedDispatch = React.useMemo(() => {
    return dispatchData.find(d => d.invoiceId === selectedDispatchId)
  }, [selectedDispatchId, dispatchData])

  const selectedCustomer = React.useMemo(() => {
    if (!selectedDispatch) return null
    return customerData.find(c => c.id === selectedDispatch.customerId)
  }, [selectedDispatch, customerData])


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
     if (!selectedDispatchId) {
      toast({
        title: "Error",
        description: "Please select a dispatch ID to process a return.",
        variant: "destructive",
      })
      return
    }
    
    const result = processReturn({
        dispatchId: selectedDispatchId,
        undeliveredEggs: parseInt(undeliveredEggs) || 0,
        damagedEggs: parseInt(damagedEggs) || 0,
        collectedTrays: parseInt(emptyTrays) || 0,
        remarks: remarks,
    });
    
    if (result.success) {
        toast({
            title: "Return Logged",
            description: result.message,
        });
        // Reset form
        setSelectedDispatchId("");
        setUndeliveredEggs("");
        setDamagedEggs("");
        setEmptyTrays("");
        setRemarks("");
    } else {
        toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
        })
    }
  }
  
  const availableDispatchesForReturn = React.useMemo(() => {
    return dispatchData;
  }, [dispatchData]);

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Undo2 className="h-6 w-6" />
              Return Management
            </CardTitle>
            <CardDescription>
              Process returns by linking to a dispatch ID and logging undelivered/damaged items and collected trays.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="dispatch-id">Dispatch ID</Label>
              <div className="flex gap-2">
                <Select value={selectedDispatchId} onValueChange={setSelectedDispatchId}>
                  <SelectTrigger id="dispatch-id">
                    <SelectValue placeholder="Select a dispatch to process a return" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDispatchesForReturn.map((d) => (
                      <SelectItem key={d.invoiceId} value={d.invoiceId}>
                        {d.invoiceId} - {d.customerName} ({format(new Date(d.date), "PP")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {selectedDispatch && (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                   <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Customer</p>
                        <p className="font-medium">{selectedDispatch.customerName}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <Egg className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Eggs Sent</p>
                        <p className="font-medium">{selectedDispatch.eggs || 0}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Price/Egg</p>
                        <p className="font-medium">{selectedDispatch.pricePerEgg?.toFixed(2) || '0.00'}</p>
                      </div>
                   </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            <div className="grid md:grid-cols-2 gap-6">
                 <div className="grid gap-2">
                    <Label htmlFor="undelivered-eggs" className="flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-muted-foreground"/>
                        Undelivered Eggs
                    </Label>
                    <Input
                        id="undelivered-eggs"
                        type="number"
                        placeholder="e.g., 25"
                        value={undeliveredEggs}
                        onChange={(e) => setUndeliveredEggs(e.target.value)}
                    />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="damaged-eggs" className="flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground"/>
                        Damaged Eggs
                    </Label>
                    <Input
                        id="damaged-eggs"
                        type="number"
                        placeholder="e.g., 12"
                        value={damagedEggs}
                        onChange={(e) => setDamagedEggs(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="empty-trays" className="flex items-center gap-1.5">
                    <Box className="h-4 w-4 text-muted-foreground"/>
                    Empty Trays Collected
                </Label>
                <Input
                    id="empty-trays"
                    type="number"
                    placeholder="e.g., 50"
                    value={emptyTrays}
                    onChange={(e) => setEmptyTrays(e.target.value)}
                />
                 {selectedCustomer && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Customer currently holds: <span className="font-medium">{selectedCustomer.emptyTraysHeld || 0} trays</span>
                  </p>
                )}
            </div>
           
            <div className="grid gap-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Add any notes about the return..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">Process Return</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
