import { Link } from 'react-router-dom';
import { UserProfileDropdown } from './UserProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center">
      {/* Left side - Logo */}
      <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
        <img 
          src="/pulse_logo_black_180x40.png" 
          alt="PulseSpark AI" 
          width={180}
          height={40}
          className="h-10 w-auto"
        />
      </Link>

      {/* Right side - User menu */}
      <div className="flex items-center">
        {user ? (
          <UserProfileDropdown />
        ) : (
          <Link to="/auth" className="text-gray-700 hover:text-gray-900 transition-colors">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}