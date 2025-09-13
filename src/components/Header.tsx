import { Link } from 'react-router-dom';
import { UserProfileDropdown } from './UserProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between p-4">
        {/* Left side - Logo */}
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
          <img 
            src="/logo.png" 
            alt="PulseSpark AI" 
            width={150}
            className="h-auto"
          />
        </Link>

        {/* Right side - User menu */}
        <div className="flex items-center">
          {user && <UserProfileDropdown />}
        </div>
      </div>
    </header>
  );
}