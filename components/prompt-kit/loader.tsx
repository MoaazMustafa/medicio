import { cn } from "@/lib/utils";

export type DotsLoaderProps = {
  className?: string;
};

function DotsLoader({ className }: DotsLoaderProps) {
  return (
    <div aria-label="Loading" className={cn("flex items-center gap-1", className)} role="status">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-secondary/60"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}

export { DotsLoader };
