import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from 'lucide-react';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-hero z-notification">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-foreground">
              We use cookies to enhance your experience and analyze our traffic. 
              <a href="/privacy" className="text-primary hover:underline ml-1">
                Learn more in our Privacy Policy
              </a>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={declineCookies}
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={acceptCookies}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Accept All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={declineCookies}
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;