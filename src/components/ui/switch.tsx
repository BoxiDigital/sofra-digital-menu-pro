import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      // OFF: dark gray track
      "bg-zinc-700",
      // ON: gold track matching site identity (var(--primary) = #C8A24D)
      "data-[state=checked]:bg-[var(--primary)]",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Thumb is ALWAYS pure white — never colored gold
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform",
        // OFF: thumb rests at start edge (right in RTL, left in LTR)
        "data-[state=unchecked]:translate-x-0",
        // ON: thumb slides to opposite edge (fully contained within gold track)
        "data-[state=checked]:translate-x-5"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };