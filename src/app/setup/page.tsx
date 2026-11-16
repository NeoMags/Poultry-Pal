
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ChickenIcon } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

const MASTER_KEY = "DMTAudi0slav3";

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [masterKey, setMasterKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (masterKey.trim() !== MASTER_KEY) {
      toast({
        title: "Setup Failed",
        description: "Invalid Master Key.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Mock admin creation and setup completion
    setTimeout(() => {
      console.log("Admin created:", { email, password });
      // In a real app, you would save this to a database.
      // We'll use localStorage to simulate setup completion.
      try {
        localStorage.setItem("isSetupComplete", "true");
        localStorage.setItem("adminEmail", email);
        localStorage.setItem("adminPassword", password); // Store for registration verification mock
      } catch (error) {
        console.warn("localStorage is not available. Setup state will not persist.");
      }
      
      toast({
        title: "Setup Complete",
        description: "Initial admin account has been created.",
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
            PoultryPal Setup
          </h1>
        </div>

        <Card className="w-full max-w-sm shadow-lg">
          <form onSubmit={handleSetup}>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Initial Setup</CardTitle>
              <CardDescription>
                Please provide the master key and initial admin credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="master-key">Master Key</Label>
                <Input
                  id="master-key"
                  type="password"
                  placeholder="Enter master key"
                  required
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  className="text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-base"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Configuring..." : "Complete Setup"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
