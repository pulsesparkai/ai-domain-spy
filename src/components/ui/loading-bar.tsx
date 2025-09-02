import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingBarProps extends React.HTMLAttributes<HTMLDivElement> {
  progress?: number;
  indeterminate?: boolean;
}

const LoadingBar = React.forwardRef<HTMLDivElement, LoadingBarProps>(
  ({ className, progress = 0, indeterminate = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-1 w-full overflow-hidden rounded-full bg-gray-200",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full rounded-full bg-[#4A90E2] transition-all duration-300 ease-out",
            indeterminate && "animate-pulse"
          )}
          style={{
            width: indeterminate ? "100%" : `${Math.min(100, Math.max(0, progress))}%`,
            background: indeterminate 
              ? "linear-gradient(90deg, #4A90E2 0%, #6B9EFF 50%, #4A90E2 100%)"
              : "#4A90E2"
          }}
        />
      </div>
    );
  }
);
LoadingBar.displayName = "LoadingBar";

export { LoadingBar };