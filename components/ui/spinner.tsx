import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2
      data-slot="spinner"
      className={cn("h-6 w-6 animate-spin text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Spinner }
