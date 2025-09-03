import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Shield, Smartphone, Clock, Eye, AlertTriangle, Monitor, History } from 'lucide-react';
import { LazyImage } from '@/components/LazyImage';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { useDeviceVerification } from '@/hooks/useAuthSecurity';
import { showToast } from '@/lib/toast';

export const SecuritySettings = () => {
  const { 
    user, 
    securitySettings, 
    updateSecuritySettings,
    enable2FA,
    getActiveSessions,
    revokeSession
  } = useEnhancedAuth();
  
  const { getTrustedDevices, markDeviceAsTrusted } = useDeviceVerification();
  
  const [loading, setLoading] = useState(false);
  const [twoFactorQR, setTwoFactorQR] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<any[]>([]);

  const handleSecuritySettingChange = async (setting: string, value: boolean | number) => {
    if (!securitySettings) return;

    try {
      setLoading(true);
      const success = await updateSecuritySettings({
        ...securitySettings,
        [setting]: value
      });

      if (success) {
        showToast.success('Security settings updated successfully');
      } else {
        showToast.error('Failed to update security settings');
      }
    } catch (error) {
      showToast.error('Error updating security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      setLoading(true);
      const data = await enable2FA();
      
      if (data?.totp?.qr_code) {
        setTwoFactorQR(data.totp.qr_code);
        showToast.success('Scan the QR code with your authenticator app');
      }
    } catch (error) {
      showToast.error('Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const sessions = await getActiveSessions();
      setActiveSessions(sessions);
    } catch (error) {
      showToast.error('Failed to load active sessions');
    }
  };

  const loadTrustedDevices = async () => {
    if (!user) return;
    
    try {
      const devices = await getTrustedDevices(user.id);
      setTrustedDevices(devices);
    } catch (error) {
      showToast.error('Failed to load trusted devices');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const success = await revokeSession(sessionId);
      if (success) {
        showToast.success('Session revoked successfully');
        loadActiveSessions();
      } else {
        showToast.error('Failed to revoke session');
      }
    } catch (error) {
      showToast.error('Error revoking session');
    }
  };

  React.useEffect(() => {
    if (user) {
      loadActiveSessions();
      loadTrustedDevices();
    }
  }, [user]);

  if (!user || !securitySettings) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Please log in to access security settings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="authentication" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="authentication" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enable 2FA</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorEnabled}
                    onCheckedChange={(checked) => {
                      if (checked && !securitySettings.twoFactorEnabled) {
                        handleEnable2FA();
                      } else {
                        handleSecuritySettingChange('twoFactorEnabled', checked);
                      }
                    }}
                    disabled={loading}
                  />
                </div>

                {twoFactorQR && (
                  <Alert>
                    <Smartphone className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-3">
                        <p>Scan this QR code with your authenticator app:</p>
                        <LazyImage 
                          src={twoFactorQR} 
                          alt="Two-factor authentication QR code for setup" 
                          className="w-48 h-48 mx-auto rounded-lg border border-border"
                          width={192}
                          height={192}
                        />
                        <div className="space-y-2">
                          <Label htmlFor="verification-code">Enter verification code</Label>
                          <div className="flex gap-2">
                            <Input
                              id="verification-code"
                              placeholder="000000"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              maxLength={6}
                            />
                            <Button 
                              onClick={() => {/* TODO: Implement verification */}}
                              disabled={verificationCode.length !== 6}
                            >
                              Verify
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Session Management</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Session Timeout</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically log out after inactivity
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="5"
                        max="480"
                        value={securitySettings.sessionTimeoutMinutes}
                        onChange={(e) => 
                          handleSecuritySettingChange('sessionTimeoutMinutes', parseInt(e.target.value))
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">minutes</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Device Verification</Label>
                      <p className="text-sm text-muted-foreground">
                        Require verification for new devices
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.requireDeviceVerification}
                      onCheckedChange={(checked) =>
                        handleSecuritySettingChange('requireDeviceVerification', checked)
                      }
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Suspicious Login Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified of unusual login activity
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.suspiciousLoginNotifications}
                      onCheckedChange={(checked) =>
                        handleSecuritySettingChange('suspiciousLoginNotifications', checked)
                      }
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sessions" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Active Sessions</h3>
                <Button variant="outline" onClick={loadActiveSessions}>
                  <Monitor className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {session.user_agent ? 
                              session.user_agent.split(' ')[0] : 
                              'Unknown Device'
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            IP: {session.ip_address || 'Unknown'} • 
                            Last active: {new Date(session.last_activity).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expires: {new Date(session.expires_at).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevokeSession(session.id)}
                        >
                          Revoke
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {activeSessions.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No active sessions found.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="devices" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Trusted Devices</h3>
                <Button variant="outline" onClick={loadTrustedDevices}>
                  <Monitor className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="space-y-3">
                {trustedDevices.map((device) => (
                  <Card key={device.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {device.device_info?.platform || 'Unknown Platform'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {device.device_info?.userAgent || 'Unknown Browser'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            First seen: {new Date(device.first_seen).toLocaleString()} • 
                            Last seen: {new Date(device.last_seen).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {device.is_trusted && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Trusted
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {trustedDevices.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No trusted devices found.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <h3 className="text-lg font-medium">Recent Activity</h3>
              <Alert>
                <History className="h-4 w-4" />
                <AlertDescription>
                  Activity logging is enabled. All login attempts and security events are recorded.
                </AlertDescription>
              </Alert>
              
              <Card>
                <CardContent className="p-4">
                  <p className="text-muted-foreground text-center">
                    Detailed activity logs will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};