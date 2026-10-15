import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("surface p-4", className)} {...props} />;
}

function CardLabel({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-muted text-xs", className)} {...props} />;
}

export { Card, CardLabel };
