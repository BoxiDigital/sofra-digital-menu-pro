import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
 HTMLTextAreaElement,
 React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
 <textarea
 ref={ref}
 className={cn(
 "flex min-h-[3.5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:block file:size-0 file:pointer-events-none file:opacity-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
 className,
 )}
 {...props}
 />
));
Textarea.displayName = "textarea";

export { Textarea };