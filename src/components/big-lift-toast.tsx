import { toast } from "sonner";
import { TrendingUp } from "lucide-react";

export function showBigLiftToast(delta: number) {
  toast.custom(
    () => (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 shadow-lg">
        <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Big lift — +{delta} points
          </p>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
            That&apos;s a significant improvement.
          </p>
        </div>
      </div>
    ),
    { duration: 5000 }
  );
}
