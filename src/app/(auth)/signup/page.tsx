import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata = {
  title: "Sign up — Sellwise",
};

export default function SignupPage() {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2 text-center">
        <div className="mb-2 text-2xl font-bold tracking-tight">
          Sell<span className="text-primary">wise</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Start with 3 free optimisations
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              name="name"
              placeholder="Jane Smith"
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full">
            Create free account
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
