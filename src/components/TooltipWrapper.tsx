import React from 'react';
import { EnhancedTooltip } from '@/components/ui/enhanced-tooltip';

interface TooltipWrapperProps {
  children: React.ReactNode;
  content: string;
  id?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  mobile?: 'hover' | 'click' | 'disabled';
}

export const TooltipWrapper = ({ 
  children, 
  content, 
  id,
  side = "top",
  mobile = 'click'
}: TooltipWrapperProps) => {
  return (
    <EnhancedTooltip 
      content={content} 
      side={side}
      mobile={mobile}
    >
      {children}
    </EnhancedTooltip>
  );
};