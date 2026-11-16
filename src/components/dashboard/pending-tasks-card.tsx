
"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClipboardCheck, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useFarm } from "@/context/FarmContext";
import { useMemo } from "react";

export default function PendingTasksCard() {
  const { tasks, staffData } = useFarm();
  
  const pendingTasks = useMemo(() => {
    return tasks
      .filter(task => task.status === 'To Do' || task.status === 'In Progress')
      .slice(0, 3); // Display up to 3 pending tasks
  }, [tasks]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-primary" />
          <CardTitle className="font-headline">Pending Tasks</CardTitle>
        </div>
        <CardDescription>
          A quick look at tasks that are currently active or to-do.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {pendingTasks.length > 0 ? (
          pendingTasks.map((task) => {
            const assignee = staffData.find(s => s.id === task.assignedTo);
            return (
              <div key={task.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={`https://placehold.co/32x32.png`} data-ai-hint="profile person" />
                  <AvatarFallback>{assignee?.name.substring(0,2) || 'N/A'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-tight">{task.title}</p>
                  <p className="text-xs text-muted-foreground">Assigned to {assignee?.name || "Unassigned"}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-center text-muted-foreground py-8">No pending tasks.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full gap-1">
          <Link href="/dashboard/task-manager">
            Go to Task Manager
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
