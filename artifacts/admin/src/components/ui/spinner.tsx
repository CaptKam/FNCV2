import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    // @ts-expect-error — harmless cross-package @types/react mismatch.
    // The monorepo pulls both @types/react@19.1.17 (via expo-router ←
    // radix ← mobile) and @types/react@19.2.14 (via admin direct).
    // lucide-react's SVG prop types use a different copy than the
    // spread's React.ComponentProps<"svg">. The types are structurally
    // identical — this is purely a pnpm deduplication quirk.
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
