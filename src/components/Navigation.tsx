import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { analytics } from "@/lib/analytics";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      analytics.track('user_logout', { user_id: user?.id });
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-sticky bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 primary-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-foreground font-semibold text-xl">PulseSpark.ai</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-foreground hover:text-primary transition-base"
            >
              Home
            </Link>
            <a 
              href="#features" 
              className="text-foreground hover:text-primary transition-base"
            >
              Features
            </a>
            <Link 
              to="/pricing" 
              className="text-foreground hover:text-primary transition-base"
            >
              Pricing
            </Link>
            <a 
              href="#about" 
              className="text-foreground hover:text-primary transition-base"
            >
              About
            </a>
          </div>

          {/* Desktop Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard">
                  <Button variant="ghost" className="text-foreground hover:text-primary">
                    Dashboard
                  </Button>
                </Link>
                <Link to="/settings" className="settings-link">
                  <Button variant="ghost">Settings</Button>
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="text-foreground hover:text-primary">
                    Log in
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="primary-gradient text-white hover:opacity-90 transition-base">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="z-sidebar w-64 bg-white">
                <div className="flex flex-col h-full">
                  {/* Header with close button */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <span className="text-foreground font-semibold text-lg">Menu</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-foreground"
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close menu</span>
                    </Button>
                  </div>

                  {/* Navigation Links */}
                  <div className="flex flex-col space-y-4 p-4">
                    <Link 
                      to="/" 
                      className="text-foreground hover:text-primary transition-base py-2 border-b border-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Home
                    </Link>
                    <a 
                      href="#features" 
                      className="text-foreground hover:text-primary transition-base py-2 border-b border-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Features
                    </a>
                    <Link 
                      to="/pricing" 
                      className="text-foreground hover:text-primary transition-base py-2 border-b border-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Pricing
                    </Link>
                    <a 
                      href="#about" 
                      className="text-foreground hover:text-primary transition-base py-2 border-b border-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      About
                    </a>
                  </div>

                  {/* Mobile Auth Section */}
                  <div className="mt-auto p-4 border-t">
                    {user ? (
                      <div className="flex flex-col space-y-3">
                        <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start text-foreground hover:text-primary">
                            Dashboard
                          </Button>
                        </Link>
                        <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start">
                            Settings
                          </Button>
                        </Link>
                        <Button
                          onClick={() => {
                            handleSignOut();
                            setIsMobileMenuOpen(false);
                          }}
                          variant="outline"
                          className="w-full justify-start flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-3">
                        <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full text-foreground hover:text-primary">
                            Log in
                          </Button>
                        </Link>
                        <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="w-full primary-gradient text-white hover:opacity-90 transition-base">
                            Sign up
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;