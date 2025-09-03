import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-muted py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-foreground font-semibold text-xl">PulseSpark.ai</span>
            </div>
            <p className="text-muted-foreground max-w-md">
              The leading platform for tracking and optimizing your AI search presence across 
              Perplexity, ChatGPT, and other AI-powered search engines.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/features" className="text-muted-foreground hover:text-accent transition-base">Features</Link></li>
              <li><Link to="/pricing" className="text-muted-foreground hover:text-accent transition-base">Pricing</Link></li>
              <li><Link to="/dashboard" className="text-muted-foreground hover:text-accent transition-base">Dashboard</Link></li>
              <li><Link to="/api" className="text-muted-foreground hover:text-accent transition-base">API</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-muted-foreground hover:text-accent transition-base">About</Link></li>
              <li><Link to="/blog" className="text-muted-foreground hover:text-accent transition-base">Blog</Link></li>
              <li><Link to="/careers" className="text-muted-foreground hover:text-accent transition-base">Careers</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-accent transition-base">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 mt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-muted-foreground text-sm">
              © 2024 PulseSpark.ai. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-muted-foreground hover:text-accent text-sm transition-base">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-accent text-sm transition-base">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;