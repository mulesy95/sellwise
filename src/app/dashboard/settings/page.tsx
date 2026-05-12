import { Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Settings — EtsyAI" };

const plans = [
  {
    name: "Free",
    price: "$0",
    limit: "3 optimisations / mo",
    current: true,
  },
  {
    name: "Starter",
    price: "$19",
    limit: "50 optimisations / mo",
    current: false,
  },
  {
    name: "Growth",
    price: "$39",
    limit: "Unlimited",
    current: false,
    popular: true,
  },
  {
    name: "Studio",
    price: "$79",
    limit: "Unlimited + multi-shop",
    current: false,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Settings className="size-5 text-primary" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and subscription.
        </p>
      </div>

      {/* Subscription */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Subscription</CardTitle>
          <CardDescription className="text-xs">
            Choose the plan that fits your Etsy shop.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg border p-4 ${
                  plan.current
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/50"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold">{plan.name}</span>
                  <div className="flex gap-1">
                    {plan.popular && (
                      <Badge
                        variant="outline"
                        className="h-4 px-1 text-[10px] text-primary border-primary/30"
                      >
                        Popular
                      </Badge>
                    )}
                    {plan.current && (
                      <Badge
                        variant="outline"
                        className="h-4 px-1 text-[10px]"
                      >
                        Current
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-xl font-bold">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /mo
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {plan.limit}
                </div>
                {!plan.current && (
                  <Button size="sm" variant="outline" className="mt-3 w-full">
                    Upgrade
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Account */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>user@example.com</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Plan</span>
            <span>Free</span>
          </div>
          <Separator />
          <Button variant="destructive" size="sm">
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
