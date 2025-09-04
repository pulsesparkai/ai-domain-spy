import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings, Monitor } from 'lucide-react';
import { getEnvironmentConfig, envLogger } from '@/lib/environment';

/**
 * Preview Mode Indicator Component
 * 
 * Shows environment information and debug tools when not in production
 */
export const PreviewModeIndicator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const config = getEnvironmentConfig();

  // Only show in non-production environments
  if (config.isProduction) {
    return null;
  }

  const handleDebugInfo = () => {
    envLogger.debug('Environment Configuration', config);
    envLogger.debug('Window Location', {
      hostname: window.location.hostname,
      href: window.location.href,
      origin: window.location.origin,
    });
    envLogger.debug('Environment Variables', {
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
    });
  };

  const getEnvironmentColor = () => {
    switch (config.environment) {
      case 'preview':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20';
      case 'development':
        return 'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20 hover:bg-gray-500/20';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Badge 
            variant="outline" 
            className={`cursor-pointer ${getEnvironmentColor()} transition-colors`}
          >
            <Monitor className="h-3 w-3 mr-1" />
            {config.environment.toUpperCase()}
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <h4 className="font-semibold">Environment Info</h4>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environment:</span>
                <Badge variant="outline" className={getEnvironmentColor()}>
                  {config.environment}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hostname:</span>
                <span className="font-mono text-xs">{window.location.hostname}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Analytics:</span>
                <Badge variant={config.enableAnalytics ? "default" : "secondary"}>
                  {config.enableAnalytics ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sentry:</span>
                <Badge variant={config.enableSentry ? "default" : "secondary"}>
                  {config.enableSentry ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Debug Mode:</span>
                <Badge variant={config.enableDebugMode ? "default" : "secondary"}>
                  {config.enableDebugMode ? "On" : "Off"}
                </Badge>
              </div>
            </div>
            
            {config.isPreview && (
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Preview Mode:</strong> Non-critical services are disabled for optimal preview experience.
                </p>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDebugInfo}
              className="w-full"
            >
              Log Debug Info to Console
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};