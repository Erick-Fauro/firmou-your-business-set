import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-2xl lowercase tracking-tight text-foreground",
        className,
      )}
    >
      firmou<span className="text-accent">.</span>
    </span>
  );
}
