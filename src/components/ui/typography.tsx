import * as React from "react";
import { cn } from "@/lib/utils";

type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "body"
  | "subtitle"
  | "heading-sm"
  | "caption";

interface TypographyProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TypographyVariant;
}

const Typography = React.forwardRef<HTMLSpanElement, TypographyProps>(
  ({ variant = "body", className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        {
          h1: "text-3xl font-bold",
          h2: "text-2xl font-semibold",
          h3: "text-1.5xl font-medium",
          h4: "text-1.25xl font-medium",
          h5: "text-1.125xl font-medium",
          body: "text-sm",
          subtitle: "text-sm font-medium",
          "heading-sm": "text-base font-semibold",
          caption: "text-xs text-gray-600",
        }[variant],
        className,
      )}
      {...props}
    />
  ),
);

Typography.displayName = "Typography";

export { Typography };
