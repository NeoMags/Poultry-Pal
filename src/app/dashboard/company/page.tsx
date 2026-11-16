
"use client"

import * as React from "react"
import { useFarm, Company } from "@/context/FarmContext"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Briefcase,
  PlusCircle,
  Download,
  Upload,
  CheckCircle,
  Edit,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export default function CompanyPage() {
  const { 
    companies, 
    activeCompany, 
    addCompany,
    updateCompany,
    switchCompany,
    getBackupData,
    restoreBackupData
  } = useFarm()
  const { toast } = useToast()
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false)
  const [editingCompany, setEditingCompany] = React.useState<Company | null>(null);

  // Add form state
  const [newCompanyName, setNewCompanyName] = React.useState("")
  const [newCompanyLogo, setNewCompanyLogo] = React.useState<string | null>(null);
  
  // Edit form state
  const [editedCompanyName, setEditedCompanyName] = React.useState("")
  const [editedCompanyLogo, setEditedCompanyLogo] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>, setLogo: (logo: string | null) => void) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast({ title: "Invalid File", description: "Please select a JPG or PNG file.", variant: "destructive" });
    }
  };


  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCompanyName.trim()) {
      toast({ title: "Error", description: "Company name cannot be empty.", variant: "destructive" })
      return
    }
    const result = addCompany(newCompanyName, newCompanyLogo || undefined);
    if (result.success) {
      toast({ title: "Success", description: result.message })
      setNewCompanyName("")
      setNewCompanyLogo(null)
      setIsAddSheetOpen(false)
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" })
    }
  }

  const handleEditCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany || !editedCompanyName.trim()) {
      toast({ title: "Error", description: "Company name cannot be empty.", variant: "destructive" });
      return;
    }
    const result = updateCompany(editingCompany.id, {
        name: editedCompanyName.trim(),
        logoUrl: editedCompanyLogo || undefined
    });
     if (result.success) {
      toast({ title: "Success", description: result.message })
      setEditingCompany(null);
      setEditedCompanyName("");
      setEditedCompanyLogo(null);
      setIsEditSheetOpen(false);
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" })
    }
  }
  
  const openEditSheet = (company: Company) => {
    setEditingCompany(company);
    setEditedCompanyName(company.name);
    setEditedCompanyLogo(company.logoUrl || null);
    setIsEditSheetOpen(true);
  }

  const handleBackup = () => {
    try {
        if (!activeCompany) {
            toast({ title: "Error", description: "No active company selected for backup.", variant: "destructive"});
            return;
        }
        const backupJson = getBackupData();
        const blob = new Blob([backupJson], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const dateStamp = new Date().toISOString().split('T')[0];
        a.download = `PoultryPal_Backup_${activeCompany.name.replace(/\s+/g, '_')}_${dateStamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Backup Created", description: "Your company data backup file has been downloaded." });
    } catch (error) {
        toast({ title: "Backup Failed", description: "Could not generate backup file.", variant: "destructive" });
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const newCompanyName = `Restored ${file.name.split('.')[0].replace(/_/g, ' ')}`.slice(0, 50);
          const result = restoreBackupData(content, newCompanyName);
          if (result.success) {
            toast({ title: "Restore Successful", description: result.message });
          } else {
            toast({ title: "Restore Failed", description: result.message, variant: "destructive" });
          }
        } catch (error) {
          toast({ title: "Restore Failed", description: "Could not read the backup file.", variant: "destructive" });
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    event.target.value = '';
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Briefcase className="h-6 w-6" />
            Company Management
          </CardTitle>
          <CardDescription>
            Manage multiple farm entities, switch between them, and handle backups.
          </CardDescription>
        </div>
        <div className="flex gap-2">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileChange}
            />
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                        <Upload className="h-4 w-4" />
                        Restore Backup
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Restore Company from Backup?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This will create a new company profile from the selected backup file. It will not overwrite any existing data. Please select your backup `.json` file.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRestoreClick}>Choose File</AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-4 w-4" />
                  New Company
                </Button>
              </SheetTrigger>
              <SheetContent>
                <form onSubmit={handleAddCompany}>
                  <SheetHeader>
                    <SheetTitle className="font-headline">Add New Company</SheetTitle>
                    <SheetDescription>
                      Enter a unique name for the new farm or business entity.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="companyName" className="text-right">
                        Company Name
                      </Label>
                      <Input
                        id="companyName"
                        className="col-span-3"
                        placeholder="e.g., Sunrise Farms"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                      />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="company-logo" className="text-right">
                        Company Logo
                      </Label>
                      <div className="col-span-3">
                        <Input id="company-logo" type="file" accept="image/jpeg, image/png" onChange={(e) => handleLogoChange(e, setNewCompanyLogo)}/>
                        <p className="text-xs text-muted-foreground mt-1">Accepts JPG or PNG, 500x500 recommended.</p>
                      </div>
                    </div>
                  </div>
                  <SheetFooter>
                    <Button type="submit">Create Company</Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length > 0 ? companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  {company.logoUrl && (
                    <img src={company.logoUrl} alt={company.name} className="h-8 w-8 rounded-full object-cover"/>
                  )}
                  <span>{company.name}</span>
                  </TableCell>
                <TableCell>
                  {company.id === activeCompany?.id && (
                    <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                      <CheckCircle className="h-4 w-4"/>
                      Active
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditSheet(company)}>
                        <Edit className="mr-1.5 h-4 w-4" />
                        Edit
                    </Button>
                    {company.id === activeCompany?.id && (
                        <Button variant="outline" size="sm" onClick={handleBackup}>
                            <Download className="mr-1.5 h-4 w-4" />
                            Backup
                        </Button>
                    )}
                    <Button 
                        size="sm" 
                        onClick={() => switchCompany(company.id)}
                        disabled={company.id === activeCompany?.id}
                    >
                        Switch To
                    </Button>
                </TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
                        No companies found. Create one to get started.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent>
            <form onSubmit={handleEditCompany}>
                <SheetHeader>
                <SheetTitle className="font-headline">Edit Company</SheetTitle>
                <SheetDescription>
                    Update the details for "{editingCompany?.name}".
                </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-companyName" className="text-right">
                    Company Name
                    </Label>
                    <Input
                    id="edit-companyName"
                    className="col-span-3"
                    value={editedCompanyName}
                    onChange={(e) => setEditedCompanyName(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-company-logo" className="text-right">
                    Company Logo
                    </Label>
                    <div className="col-span-3">
                    <Input id="edit-company-logo" type="file" accept="image/jpeg, image/png" onChange={(e) => handleLogoChange(e, setEditedCompanyLogo)} />
                    <p className="text-xs text-muted-foreground mt-1">Accepts JPG or PNG. Leave blank to keep existing logo.</p>
                    {editedCompanyLogo && (
                        <img src={editedCompanyLogo} alt="Logo Preview" className="mt-2 h-16 w-16 rounded-full object-cover"/>
                    )}
                    </div>
                </div>
                </div>
                <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditSheetOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
                </SheetFooter>
            </form>
        </SheetContent>
    </Sheet>
    </>
  )
}
