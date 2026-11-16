"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChickenIcon } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock admin password verification
    let storedAdminPassword = "";
    try {
        storedAdminPassword = localStorage.getItem("adminPassword") || "";
    } catch(e) {
        console.warn("could not read from local storage");
    }
    
    if (adminPassword !== storedAdminPassword) {
        toast({
            title: "Registration Failed",
            description: "Invalid Admin Password for verification.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }

    setTimeout(() => {
      toast({
        title: "Registration Successful",
        description: "New user has been created. Please log in.",
      });
      router.push("/");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      
      <div className="container flex max-w-lg flex-col items-center">
        <div className="mb-8 flex items-center gap-2 text-2xl font-bold text-primary">
          <ChickenIcon className="h-8 w-8" />
          <h1 className="font-headline text-3xl font-bold text-foreground">
            PoultryPal
          </h1>
        </div>

        <Card className="w-full max-w-sm shadow-lg">
          <form onSubmit={handleRegister}>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Create Account</CardTitle>
              <CardDescription>
                Fill in the details to register a new user. Admin verification is required.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  required
                  className="text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required className="text-base" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select required>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="accounts">Accounts</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="shed-supervisor">Shed Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-password">Admin Verification Password</Label>
                <Input 
                    id="admin-password" 
                    type="password" 
                    required 
                    className="text-base"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Registering..." : "Register"}
              </Button>
               <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/" className="font-medium text-primary hover:underline">
                  Login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
