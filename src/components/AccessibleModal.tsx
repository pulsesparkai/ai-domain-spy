import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useFocusManagement, useScreenReader } from '@/hooks/useAccessibility';

interface AccessibleDialogProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  title: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  children,
  trigger,
  title,
  description,
  open,
  onOpenChange,
  size = 'md'
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { saveFocus, restoreFocus, trapFocus } = useFocusManagement();
  const { announce } = useScreenReader();

  useEffect(() => {
    if (open) {
      saveFocus();
      announce(`Dialog opened: ${title}`);
      
      // Trap focus within dialog
      if (contentRef.current) {
        const cleanup = trapFocus(contentRef.current);
        return cleanup;
      }
    } else {
      restoreFocus();
      announce('Dialog closed');
    }
  }, [open, title, saveFocus, restoreFocus, trapFocus, announce]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent 
        ref={contentRef}
        className={`${sizeClasses[size]} focus:outline-none`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle id="dialog-title" className="text-lg font-semibold">
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange?.(false)}
              aria-label="Close dialog"
              className="h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {description && (
            <DialogDescription id="dialog-description">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="mt-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface AccessibleDrawerProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  title: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const AccessibleDrawer: React.FC<AccessibleDrawerProps> = ({
  children,
  trigger,
  title,
  description,
  open,
  onOpenChange,
  side = 'bottom'
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { saveFocus, restoreFocus, trapFocus } = useFocusManagement();
  const { announce } = useScreenReader();

  useEffect(() => {
    if (open) {
      saveFocus();
      announce(`Drawer opened: ${title}`);
      
      // Trap focus within drawer
      if (contentRef.current) {
        const cleanup = trapFocus(contentRef.current);
        return cleanup;
      }
    } else {
      restoreFocus();
      announce('Drawer closed');
    }
  }, [open, title, saveFocus, restoreFocus, trapFocus, announce]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        {trigger}
      </DrawerTrigger>
      <DrawerContent 
        ref={contentRef}
        className="focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        aria-describedby={description ? "drawer-description" : undefined}
      >
        <DrawerHeader className="text-left">
          <div className="flex items-center justify-between">
            <DrawerTitle id="drawer-title">
              {title}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close drawer"
                className="h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
          {description && (
            <DrawerDescription id="drawer-description">
              {description}
            </DrawerDescription>
          )}
        </DrawerHeader>
        
        <div className="px-4 pb-4">
          {children}
        </div>
        
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};