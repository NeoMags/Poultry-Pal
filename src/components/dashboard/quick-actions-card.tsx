import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EggIcon } from "@/components/icons";
import { Wheat, Truck, IndianRupee, Bolt } from "lucide-react";

export default function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Bolt className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline">Quick Actions</CardTitle>
        </div>
        <CardDescription>
          Your most frequent tasks, just a click away.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <Link href="/dashboard/egg-collection">
            <EggIcon className="h-6 w-6 text-primary" />
            <span>Record Eggs</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <Link href="/dashboard/feed-manager">
            <Wheat className="h-6 w-6 text-primary" />
            <span>Add Feed</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <Link href="/dashboard/dispatch">
            <Truck className="h-6 w-6 text-primary" />
            <span>New Delivery</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <Link href="/dashboard/accounts">
            <IndianRupee className="h-6 w-6 text-primary" />
            <span>Add Payment</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
