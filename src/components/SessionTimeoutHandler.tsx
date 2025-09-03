import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, Clock, RefreshCw } from 'lucide-react';
import { useEnhancedAuthContext } from '@/contexts/EnhancedAuthContext';

export const SessionTimeoutHandler = () => {
  const { isTimedOut, extendSession, signOut } = useEnhancedAuthContext();
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes warning
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (isTimedOut) {
      setShowWarning(true);
    }
  }, [isTimedOut]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (showWarning && !isTimedOut) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setShowWarning(false);
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showWarning, isTimedOut]);

  const handleExtendSession = () => {
    extendSession();
    setShowWarning(false);
    setTimeLeft(300);
  };

  const handleLogout = () => {
    signOut('Session expired - user logged out');
  };

  if (isTimedOut) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Session Expired
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your session has expired due to inactivity. Please log in again to continue.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleExtendSession}
                className="flex-1"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Continue Session
              </Button>
              <Button 
                onClick={handleLogout}
                className="flex-1"
                variant="default"
              >
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showWarning) {
    return (
      <div className="fixed top-4 right-4 z-notification">
        <Alert className="w-80 bg-yellow-50 border-yellow-200">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Session expiring soon</p>
              <p className="text-sm">
                Your session will expire in {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, '0')}
              </p>
              <Button 
                size="sm" 
                onClick={handleExtendSession}
                className="w-full"
              >
                Extend Session
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
};

export const SecurityStatusIndicator = () => {
  const { securitySettings, user } = useEnhancedAuthContext();
  const [securityScore, setSecurityScore] = useState(0);

  useEffect(() => {
    if (!securitySettings) return;

    let score = 0;
    if (securitySettings.twoFactorEnabled) score += 40;
    if (securitySettings.requireDeviceVerification) score += 20;
    if (securitySettings.suspiciousLoginNotifications) score += 20;
    if (securitySettings.sessionTimeoutMinutes <= 30) score += 20;

    setSecurityScore(score);
  }, [securitySettings]);

  if (!user || !securitySettings) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="fixed bottom-4 right-4 z-notification">
      <Card className="w-64">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Security Score:</span>
            <span className={`text-sm font-bold ${getScoreColor(securityScore)}`}>
              {securityScore}/100 ({getScoreText(securityScore)})
            </span>
          </div>
          
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            {!securitySettings.twoFactorEnabled && (
              <p>• Enable 2FA for +40 points</p>
            )}
            {!securitySettings.requireDeviceVerification && (
              <p>• Enable device verification for +20 points</p>
            )}
            {securitySettings.sessionTimeoutMinutes > 30 && (
              <p>• Reduce session timeout to ≤30min for +20 points</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};