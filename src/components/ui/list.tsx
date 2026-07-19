import * as React from "react";
import { cn } from "@/lib/utils";

const List = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("list-disc list-inside space-y-2", className)}
    {...props}
  />
));
List.displayName = "List";

const ListItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("list-item", className)}
    {...props}
  />
));
ListItem.displayName = "ListItem";

const ListItemText = ({ primary, secondary, className, ...props }: {
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex flex-col", className)} {...props}>
    {primary && <span className="font-medium">{primary}</span>}
    {secondary && <span className="text-sm text-gray-500">{secondary}</span>}
  </div>
);

export { List, ListItem, ListItemText };
