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
        style={{
          backgroundColor: '#F0F0F0',
          color: '#1A1A1A',
          borderRadius: '12px',
          fontSize: '12px',
          padding: '8px 12px',
          maxWidth: '300px',
          zIndex: 1000,
        }}
      />
    </>
  );
};