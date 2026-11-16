

"use client";

import Link from "next/link";
import {
  Bell,
  LayoutDashboard,
  Truck,
  FileText,
  User,
  LogOut,
  ChevronDown,
  Bird,
  Warehouse,
  Wheat,
  Undo2,
  UsersRound,
  CreditCard,
  ClipboardCheck,
  History,
  Settings,
  LineChart,
  Users,
  Building,
  Briefcase,
  Package,
  Receipt,
  Car,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChickenIcon, EggIcon } from "@/components/icons";
import { usePathname } from "next/navigation";
import { FarmProvider } from "@/context/FarmContext";
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useFarm } from "@/context/FarmContext";

function UserProfile() {
  const { activeCompany } = useFarm();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="justify-start gap-2 w-full p-2 h-auto">
          <Avatar className="h-9 w-9">
            {activeCompany?.logoUrl ? (
                <AvatarImage src={activeCompany.logoUrl} alt={activeCompany.name} />
            ) : (
                <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="profile person" />
            )}
            <AvatarFallback>{activeCompany?.name.substring(0, 1) || 'M'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="font-medium">{activeCompany?.name}</span>
            <span className="text-xs text-muted-foreground">manager@poultrypal.com</span>
          </div>
          <ChevronDown className="ml-auto h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          <Link href="/">Logout</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DateTimeDisplay() {
    const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

    useEffect(() => {
        // This effect runs only on the client, after hydration
        setCurrentDateTime(new Date());
        const timer = setInterval(() => {
          setCurrentDateTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Render nothing on the server and during initial client render
    if (!currentDateTime) {
        return null;
    }

    return (
        <div className="text-sm font-medium text-muted-foreground hidden md:block">
            {format(currentDateTime, 'eeee, MMMM do, yyyy | hh:mm:ss a')}
        </div>
    );
}

function SidebarHeaderContent() {
    const { activeCompany } = useFarm();
    return (
        <div className="flex items-center gap-3">
            {activeCompany?.logoUrl ? (
                 <Avatar className="h-12 w-12">
                    <AvatarImage src={activeCompany.logoUrl} alt={activeCompany.name} />
                    <AvatarFallback>{activeCompany.name.substring(0, 1)}</AvatarFallback>
                </Avatar>
            ) : (
                 <ChickenIcon className="h-12 w-12 text-primary" />
            )}
           
            <div className="flex flex-col">
                <h2 className="text-2xl font-headline font-semibold">{activeCompany?.name}</h2>
            </div>
        </div>
    );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  return (
    <FarmProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="p-4">
            <SidebarHeaderContent />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  tooltip="Dashboard"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/company")}
                  tooltip="Company"
                >
                  <Link href="/dashboard/company">
                    <Briefcase />
                    <span>Company</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/suppliers")}
                  tooltip="Suppliers"
                >
                  <Link href="/dashboard/suppliers">
                    <Building />
                    <span>Suppliers</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/purchase-orders")}
                  tooltip="Purchase Orders"
                >
                  <Link href="/dashboard/purchase-orders">
                    <Receipt />
                    <span>Purchase Orders</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/items-inventory")}
                  tooltip="Items & Inventory"
                >
                  <Link href="/dashboard/items-inventory">
                    <Package />
                    <span>Items & Inventory</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/chick-management")}
                  tooltip="Chick Management"
                >
                  <Link href="/dashboard/chick-management">
                    <Bird />
                    <span>Chick Management</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/shed-overview")}
                  tooltip="Shed Overview"
                >
                  <Link href="/dashboard/shed-overview">
                    <Warehouse />
                    <span>Shed Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/feed-manager")}
                  tooltip="Feed Manager"
                >
                  <Link href="/dashboard/feed-manager">
                    <Wheat />
                    <span>Feed Manager</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/egg-collection")}
                  tooltip="Egg Collection"
                >
                  <Link href="/dashboard/egg-collection">
                    <EggIcon />
                    <span>Egg Collection</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/customers")}
                  tooltip="Customers"
                >
                  <Link href="/dashboard/customers">
                    <Users />
                    <span>Customers</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/staff-vehicle")}
                  tooltip="Staff & Vehicle"
                >
                  <Link href="/dashboard/staff-vehicle">
                    <Car />
                    <span>Staff & Vehicle</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/dispatch")}
                  tooltip="Dispatch"
                >
                  <Link href="/dashboard/dispatch">
                    <Truck />
                    <span>Dispatch</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/accounts")}
                  tooltip="Accounts"
                >
                  <Link href="/dashboard/accounts">
                    <CreditCard />
                    <span>Accounts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/reports")}
                  tooltip="Reports"
                >
                  <Link href="/dashboard/reports">
                    <FileText />
                    <span>Reports</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/task-manager")}
                  tooltip="Task Manager"
                >
                  <Link href="/dashboard/task-manager">
                    <ClipboardCheck />
                    <span>Task Manager</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/analytics")}
                  tooltip="Analytics"
                >
                  <Link href="/dashboard/analytics">
                    <LineChart />
                    <span>Analytics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/settings")}
                  tooltip="Settings"
                >
                  <Link href="/dashboard/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/logs")}
                  tooltip="Logs"
                >
                  <Link href="/dashboard/logs">
                    <History />
                    <span>Logs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
             <UserProfile />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col min-h-screen">
            <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
              <SidebarTrigger className="md:hidden" />
              <div className="flex-1">
                <h1 className="text-lg font-semibold md:text-xl font-headline capitalize">
                  {pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard"}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <DateTimeDisplay />
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </div>
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
            <footer className="p-4 text-center text-sm text-muted-foreground">
              A Software By Nesar Magavi
            </footer>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </FarmProvider>
  );
}
