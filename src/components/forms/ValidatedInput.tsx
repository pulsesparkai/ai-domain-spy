import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ValidatedInputProps extends React.ComponentProps<"input"> {
  error?: boolean;
  errorMessage?: string;
}

export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, error, errorMessage, ...props }, ref) => {
    return (
      <div className="w-full">
        <Input
          className={cn(
            "rounded-lg",
            error && "border-red-500 border-2",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && errorMessage && (
          <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";