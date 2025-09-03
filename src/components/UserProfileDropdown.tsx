import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UserProfileDropdown() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user || !profile) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 rounded-full hover:bg-gray-50 p-1 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || ''} />
            <AvatarFallback className="bg-purple-100 text-purple-700 text-sm">
              {getInitials(profile.full_name || profile.email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-white shadow-lg border border-gray-200"
      >
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-foreground">{profile.full_name || 'User'}</p>
          <p className="text-xs text-muted-foreground">{profile.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/pricing')} className="cursor-pointer">
          <CreditCard className="mr-2 h-4 w-4" />
          Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}