import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { analytics } from "@/lib/analytics";
import { SkipToContent } from "@/components/SkipToContent";

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
    <>
      <SkipToContent />
      <nav 
        className="fixed top-0 left-0 right-0 z-sticky bg-white shadow-sm border-b border-gray-200"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 focus-visible-ring rounded-md"
            aria-label="PulseSpark.ai homepage"
          >
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg" aria-hidden="true">P</span>
            </div>
            <span className="text-foreground font-semibold text-xl">PulseSpark.ai</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8" role="menubar">
            <Link 
              to="/" 
              className="text-foreground hover:text-primary transition-base focus-visible-ring px-2 py-1 rounded-md"
              role="menuitem"
            >
              Home
            </Link>
            <a 
              href="#features" 
              className="text-foreground hover:text-primary transition-base focus-visible-ring px-2 py-1 rounded-md"
              role="menuitem"
            >
              Features
            </a>
            <Link 
              to="/pricing" 
              className="text-foreground hover:text-primary transition-base focus-visible-ring px-2 py-1 rounded-md"
              role="menuitem"
            >
              Pricing
            </Link>
            <a 
              href="#about" 
              className="text-foreground hover:text-primary transition-base focus-visible-ring px-2 py-1 rounded-md"
              role="menuitem"
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
                  <Button>
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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-foreground"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="z-sidebar w-64 bg-white"
                id="mobile-menu"
                aria-label="Mobile navigation menu"
              >
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
                          <Button className="w-full">
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
    </>
  );
};

export default Navigation;