
"use client";

import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/components/ui/alert-dialog";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);


  useEffect(() => {
    // This check runs only on the client-side
    try {
      const setupComplete = localStorage.getItem("isSetupComplete") === "true";
      if (!setupComplete) {
        router.replace("/setup");
      } else {
        setIsCheckingSetup(false);
      }
    } catch (error) {
      console.warn("localStorage is not available, cannot check setup status. Assuming setup is complete.");
      // If localStorage is not available (e.g., SSR), proceed as if setup is complete.
      setIsCheckingSetup(false);
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock authentication
    setTimeout(() => {
      toast({
        title: "Login Successful",
        description: "Welcome back to PoultryPal!",
      });
      router.push("/dashboard");
      setIsLoading(false);
    }, 1000);
  };

  const handleForgotPassword = () => {
    try {
      localStorage.removeItem("isSetupComplete");
      localStorage.removeItem("adminEmail");
      localStorage.removeItem("adminPassword");
      toast({
        title: "Setup Reset",
        description: "Your application setup has been reset. Please create a new admin account.",
      });
      router.push("/setup");
    } catch (error) {
       toast({
        title: "Error",
        description: "Could not reset setup. Please clear your browser's local storage manually.",
        variant: "destructive",
      });
    }
  };

  if (isCheckingSetup) {
      return (
         <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
             <div className="container flex max-w-lg flex-col items-center">
                 <Skeleton className="h-[450px] w-full max-w-sm" />
             </div>
        </div>
      );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute left-0 top-0 -z-10 h-1/4 w-1/4 bg-primary/10 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 -z-10 h-1/4 w-1/4 bg-accent/10 blur-3xl"></div>

      <div className="container flex max-w-lg flex-col items-center">
        <div className="mb-8 flex items-center gap-2 text-2xl font-bold text-primary">
          <ChickenIcon className="h-8 w-8" />
          <h1 className="font-headline text-3xl font-bold text-foreground">
            PoultryPal
          </h1>
        </div>

        <Card className="w-full max-w-sm shadow-lg">
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
              <CardDescription>
                Enter your credentials to access your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="manager@example.com"
                  required
                  className="text-base"
                />
              </div>
              <div className="grid gap-2">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="link" type="button" className="p-0 h-auto text-xs">Forgot Password?</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will reset your application's setup and require you to create a new admin account. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleForgotPassword}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
                <Input id="password" type="password" required className="text-base" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="language">Language</Label>
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
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Register
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
