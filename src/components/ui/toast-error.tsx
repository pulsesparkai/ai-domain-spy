import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const toastErrorVariants = cva(
  "fixed top-4 right-4 z-notification flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg animate-in slide-in-from-top-2 fade-in-0 duration-300",
  {
    variants: {
      variant: {
        error: "bg-[#FF4D4F]",
      },
    },
    defaultVariants: {
      variant: "error",
    },
  }
);

export interface ToastErrorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastErrorVariants> {
  onClose?: () => void;
}

const ToastError = React.forwardRef<HTMLDivElement, ToastErrorProps>(
  ({ className, variant, onClose, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(toastErrorVariants({ variant, className }))}
        {...props}
      >
        <span className="flex-1">{children}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 rounded-full p-1 hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
ToastError.displayName = "ToastError";

export { ToastError, toastErrorVariants };