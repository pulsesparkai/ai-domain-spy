import React from 'react';
import { Tooltip } from 'react-tooltip';

interface TooltipWrapperProps {
  children: React.ReactNode;
  content: string;
  id: string;
}

export const TooltipWrapper = ({ children, content, id }: TooltipWrapperProps) => {
  return (
    <>
      <div data-tooltip-id={id} data-tooltip-content={content}>
        {children}
      </div>
      <Tooltip
        id={id}
        className="bg-muted text-foreground rounded-xl text-xs py-2 px-3 max-w-xs z-dropdown"
      />
    </>
  );
};