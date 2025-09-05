import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger, LogLevel, LogEntry } from '@/lib/logger';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useAuth } from "@/contexts/AuthContext";
import { 
  Bug, 
  Activity, 
  Monitor, 
  Download, 
  Trash2, 
  Info, 
  AlertTriangle, 
  AlertCircle,
  Zap
} from 'lucide-react';

export const DevModeToggle = () => {
  const { user } = useAuth();
  const [isDebugMode, setIsDebugMode] = useState(() => {
    try {
      return localStorage.getItem('debug_mode') === 'true';
    } catch {
      return false;
    }
  });
  
  const [devMode, setDevMode] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  
  const { getCurrentMetrics } = usePerformanceMonitor('DevModeToggle');

  useEffect(() => {
    const stored = localStorage.getItem('dev-mode');
    setDevMode(stored === 'true');
  }, [user]);

  useEffect(() => {
    logger.setDebugMode(isDebugMode);
    try {
      localStorage.setItem('debug_mode', isDebugMode.toString());
    } catch {
      // Silent fail for localStorage issues
    }
  }, [isDebugMode]);

  useEffect(() => {
    if (isLogsDialogOpen) {
      const currentLogs = logger.getLogs();
      setLogs(currentLogs);
    }
  }, [isLogsDialogOpen]);

  const handleDevModeToggle = async (enabled: boolean) => {
    setDevMode(enabled);
    localStorage.setItem('dev-mode', enabled.toString());
  };

  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };

  const handleDownloadLogs = () => {
    const currentLogs = logger.getLogs();
    const blob = new Blob([JSON.stringify(currentLogs, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `app-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    logger.trackUserAction('Download Logs', { timestamp: new Date().toISOString() });
  };

  const getLogLevelBadge = (level: LogLevel) => {
    const configs = {
      [LogLevel.DEBUG]: { variant: 'secondary' as const, icon: Info, text: 'DEBUG' },
      [LogLevel.INFO]: { variant: 'default' as const, icon: Info, text: 'INFO' },
      [LogLevel.WARN]: { variant: 'outline' as const, icon: AlertTriangle, text: 'WARN' },
      [LogLevel.ERROR]: { variant: 'destructive' as const, icon: AlertCircle, text: 'ERROR' },
      [LogLevel.FATAL]: { variant: 'destructive' as const, icon: AlertCircle, text: 'FATAL' },
    };
    
    const config = configs[level];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getLogsByLevel = () => {
    const logsByLevel = logs.reduce((acc, log) => {
      const level = LogLevel[log.level];
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return logsByLevel;
  };

  const formatLogEntry = (log: LogEntry) => {
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    const context = log.context ? `[${log.context}]` : '';
    
    return {
      timestamp,
      context,
      message: log.message,
      metadata: log.metadata,
      stack: log.stack,
    };
  };

  const logsByLevel = getLogsByLevel();
  const performanceMetrics = getCurrentMetrics();

  return (
    <div className="flex items-center gap-4">
      {/* Original Dev Mode Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="dev-mode"
          checked={devMode}
          onCheckedChange={handleDevModeToggle}
        />
        <label htmlFor="dev-mode" className="text-sm text-muted-foreground">
          Development Mode (Mock Data)
        </label>
      </div>

      {/* Debug Panel */}
      <div className="flex items-center gap-2">
        {isDebugMode && (
          <Badge variant="secondary" className="gap-1">
            <Bug className="h-3 w-3" />
            Debug Mode
          </Badge>
        )}
        
        <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant={isDebugMode ? "default" : "outline"}
              className="gap-2"
              onClick={() => logger.trackUserAction('Open Debug Panel')}
            >
              <Monitor className="h-4 w-4" />
              Debug
              {logs.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {logs.length}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Debug Panel
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="logs">
                  Logs
                  {logs.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {logs.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Debug Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Debug Mode</label>
                        <p className="text-sm text-muted-foreground">
                          Enable verbose logging and development tools
                        </p>
                      </div>
                      <Switch
                        checked={isDebugMode}
                        onCheckedChange={setIsDebugMode}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadLogs}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Logs
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearLogs}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Clear Logs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="logs" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {Object.entries(logsByLevel).map(([level, count]) => (
                      <Badge key={level} variant="outline">
                        {level}: {count}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogs(logger.getLogs())}
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-96 w-full border rounded-md p-4">
                  <div className="space-y-2">
                    {logs.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No logs available
                      </p>
                    ) : (
                      logs.map((log, index) => {
                        const formatted = formatLogEntry(log);
                        
                        return (
                          <Card key={index} className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  {getLogLevelBadge(log.level)}
                                  <span className="text-xs text-muted-foreground">
                                    {formatted.timestamp}
                                  </span>
                                  {formatted.context && (
                                    <Badge variant="outline" className="text-xs">
                                      {formatted.context}
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-sm">{formatted.message}</p>
                                
                                {formatted.metadata && Object.keys(formatted.metadata).length > 0 && (
                                  <details className="text-xs">
                                    <summary className="cursor-pointer text-muted-foreground">
                                      Metadata
                                    </summary>
                                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                      {JSON.stringify(formatted.metadata, null, 2)}
                                    </pre>
                                  </details>
                                )}
                                
                                {formatted.stack && (
                                  <details className="text-xs">
                                    <summary className="cursor-pointer text-muted-foreground">
                                      Stack Trace
                                    </summary>
                                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                      {formatted.stack}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                      {JSON.stringify(performanceMetrics, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Log Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Logs:</span>
                          <Badge variant="outline">{logs.length}</Badge>
                        </div>
                        {Object.entries(logsByLevel).map(([level, count]) => (
                          <div key={level} className="flex justify-between">
                            <span className="text-sm">{level}:</span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Session Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Debug Mode:</span>
                          <Badge variant={isDebugMode ? "default" : "outline"}>
                            {isDebugMode ? "ON" : "OFF"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Page:</span>
                          <span className="text-xs text-muted-foreground">
                            {typeof window !== 'undefined' ? window.location.pathname : '/'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DevModeToggle;