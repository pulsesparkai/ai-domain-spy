import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="max-w-4xl mx-auto p-6 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">Cookie Preferences</h3>
            <p className="text-muted-foreground text-sm">
              We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
              Choose your preferences below.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              Customize
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              Reject
            </Button>
            <Button 
              size="sm"
              className="primary-gradient text-white"
              onClick={() => setIsVisible(false)}
            >
              Accept All
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;