import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

const DevModeToggle = () => {
  const { user, updateUserMetadata } = useAuth();
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('dev-mode');
    const userDevMode = user?.user_metadata?.api_keys?.dev_mode;
    setDevMode(stored === 'true' || userDevMode === true);
  }, [user]);

  const handleToggle = async (enabled: boolean) => {
    setDevMode(enabled);
    localStorage.setItem('dev-mode', enabled.toString());
    
    if (user) {
      try {
        await updateUserMetadata({
          api_keys: {
            ...user.user_metadata?.api_keys,
            dev_mode: enabled
          }
        });
      } catch (error) {
        console.error('Failed to update dev mode setting:', error);
      }
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="dev-mode"
        checked={devMode}
        onCheckedChange={handleToggle}
      />
      <Label htmlFor="dev-mode" className="text-sm text-muted-foreground">
        Development Mode (Mock Data)
      </Label>
    </div>
  );
};

export default DevModeToggle;