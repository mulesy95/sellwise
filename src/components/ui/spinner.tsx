import { cn } from "@/lib/utils";

export function Spinner({
  size = "md",
  variant,
  className,
}: {
  size?: "sm" | "md" | "lg";
  /** "primary" uses brand-coloured border. Defaults to foreground colours for sm/md and primary for lg. */
  variant?: "default" | "primary";
  className?: string;
}) {
  const usePrimary = variant === "primary" || (variant === undefined && size === "lg");

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block animate-spin rounded-full border-2",
        size === "sm" && "size-3.5",
        size === "md" && "size-4",
        size === "lg" && "size-8",
        usePrimary
          ? "border-primary/20 border-t-primary"
          : "border-foreground/20 border-t-foreground",
        className
      )}
    />
  );
}
