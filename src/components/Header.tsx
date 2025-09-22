import { Link } from 'react-router-dom';
import { UserProfileDropdown } from './UserProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
      {/* Left side - Logo */}
      <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
        <img 
          src="/logo.svg" 
          alt="PulseSpark AI" 
          className="h-8 w-auto object-contain"
        />
      </Link>

      {/* Center nav - Hidden if logged in */}
      {!user && (
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/pricing" className="text-gray-600 hover:text-purple-600 transition-colors">
            Pricing
          </Link>
        </nav>
      )}

      {/* Right side - User menu */}
      <div className="flex items-center">
        {user ? (
          <UserProfileDropdown />
        ) : (
          <Link to="/auth" className="text-purple-600 hover:text-purple-700 transition-colors">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}