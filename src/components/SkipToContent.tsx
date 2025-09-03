import React from 'react';
import { Button } from '@/components/ui/button';

interface SkipToContentProps {
  targetId?: string;
  className?: string;
}

export const SkipToContent: React.FC<SkipToContentProps> = ({ 
  targetId = 'main-content',
  className 
}) => {
  const handleSkip = () => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Button
      onClick={handleSkip}
      className={`skip-link ${className}`}
      variant="default"
      size="sm"
    >
      Skip to main content
    </Button>
  );
};

interface MainContentProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export const MainContent: React.FC<MainContentProps> = ({ 
  children, 
  id = 'main-content',
  className 
}) => {
  return (
    <main 
      id={id}
      tabIndex={-1}
      className={`focus:outline-none ${className}`}
      role="main"
      aria-label="Main content"
    >
      {children}
    </main>
  );
};