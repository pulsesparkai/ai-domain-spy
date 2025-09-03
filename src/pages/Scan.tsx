import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import ScanInterface from "@/components/ScanInterface";
import { analytics } from "@/lib/analytics";

const Scan = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      analytics.page('Scan', { userId: user.id });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Visibility Scan</h1>
          <p className="text-muted-foreground">
            Analyze your brand's visibility across AI platforms and track sentiment.
          </p>
        </div>
        <ScanInterface />
      </main>
    </div>
  );
};

export default Scan;