import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card shadow-nav">
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
            <Link 
              to="/features" 
              className="text-foreground hover:text-primary transition-base"
            >
              Features
            </Link>
            <Link 
              to="/pricing" 
              className="text-foreground hover:text-primary transition-base"
            >
              Pricing
            </Link>
            <Link 
              to="/about" 
              className="text-foreground hover:text-primary transition-base"
            >
              About
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="text-foreground hover:text-primary">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="primary-gradient text-white hover:opacity-90 transition-base">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;