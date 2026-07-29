import LucideLoaderCircle from "~icons/lucide/loader-circle";

import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LucideLoaderCircle
      data-slot="spinner"
      role="status"
      aria-label="載入中"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
