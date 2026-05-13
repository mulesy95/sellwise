import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

interface FeatureGateProps {
  title: string;
  description: string;
  bullets: string[];
}

export function FeatureGate({ title, description, bullets }: FeatureGateProps) {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
            <Lock className="size-6 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-lg font-semibold">{title}</h2>
          <p className="mb-5 text-sm text-muted-foreground">{description}</p>
          <ul className="mb-6 w-full max-w-xs space-y-2 text-left">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {b}
              </li>
            ))}
          </ul>
          <p className="mb-5 text-xs text-muted-foreground">
            Available on Starter, Growth, and Studio plans
          </p>
          <Link href="/pricing" className={buttonVariants()}>
            Upgrade to unlock
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
