import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  Search, 
  Menu, 
  X, 
  Home, 
  BarChart3, 
  Settings, 
  Users,
  FileText,
  HelpCircle
} from 'lucide-react';
import { useKeyboardNavigation, useScreenReader, AccessibleButton } from '@/hooks/useAccessibility';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  children?: NavigationItem[];
}

interface AccessibleNavigationProps {
  items: NavigationItem[];
  currentPath?: string;
  onNavigate?: (href: string) => void;
  variant?: 'horizontal' | 'vertical' | 'mobile';
  showSearch?: boolean;
  logo?: React.ReactNode;
}

export const AccessibleNavigation: React.FC<AccessibleNavigationProps> = ({
  items,
  currentPath = '',
  onNavigate,
  variant = 'horizontal',
  showSearch = false,
  logo
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NavigationItem[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  
  const navRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  const { announce } = useScreenReader();

  // Flatten items for search and keyboard navigation
  const flattenItems = (items: NavigationItem[]): NavigationItem[] => {
    return items.reduce((acc: NavigationItem[], item) => {
      acc.push(item);
      if (item.children) {
        acc.push(...flattenItems(item.children));
      }
      return acc;
    }, []);
  };

  const allItems = flattenItems(items);
  const { handleKeyDown } = useKeyboardNavigation(
    allItems.map(item => ({ id: item.id, element: undefined })),
    (id) => {
      const item = allItems.find(i => i.id === id);
      if (item) {
        onNavigate?.(item.href);
        announce(`Navigated to ${item.label}`);
      }
    }
  );

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = allItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setActiveSearchIndex(-1);
    } else {
      setSearchResults([]);
      setActiveSearchIndex(-1);
    }
  }, [searchQuery, allItems]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSearchIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSearchIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSearchIndex >= 0) {
          const selectedItem = searchResults[activeSearchIndex];
          onNavigate?.(selectedItem.href);
          setSearchQuery('');
          announce(`Navigated to ${selectedItem.label} from search`);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSearchQuery('');
        setSearchResults([]);
        break;
    }
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
      announce('Menu collapsed');
    } else {
      newExpanded.add(itemId);
      announce('Menu expanded');
    }
    setExpandedItems(newExpanded);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    announce(mobileMenuOpen ? 'Menu closed' : 'Menu opened');
  };

  const isActive = (href: string) => currentPath === href;

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    return (
      <li key={item.id} role="none">
        <div className="flex items-center">
          <AccessibleButton
            onClick={() => onNavigate?.(item.href)}
            ariaLabel={`Navigate to ${item.label}${item.badge ? `, ${item.badge} items` : ''}`}
            ariaCurrent={active ? 'page' : undefined}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left
              ${active 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
              ${level > 0 ? 'ml-6' : ''}
            `}
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <Badge variant={active ? 'secondary' : 'outline'} className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </AccessibleButton>
          
          {hasChildren && (
            <AccessibleButton
              onClick={() => toggleExpanded(item.id)}
              ariaLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${item.label} submenu`}
              ariaExpanded={isExpanded}
              ariaControls={`submenu-${item.id}`}
              className="p-2 hover:bg-muted rounded-lg ml-2"
            >
              <ChevronDown 
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                aria-hidden="true" 
              />
            </AccessibleButton>
          )}
        </div>
        
        {hasChildren && (
          <ul
            id={`submenu-${item.id}`}
            className={`mt-2 space-y-1 ${isExpanded ? 'block' : 'hidden'}`}
            role="group"
            aria-labelledby={`nav-${item.id}`}
          >
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  // Mobile navigation
  if (variant === 'mobile') {
    return (
      <>
        {/* Mobile menu button */}
        <AccessibleButton
          onClick={toggleMobileMenu}
          ariaLabel="Toggle navigation menu"
          ariaExpanded={mobileMenuOpen}
          ariaControls="mobile-menu"
          className="p-2 hover:bg-muted rounded-lg md:hidden"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </AccessibleButton>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-50 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
          >
            <div className="fixed inset-0 bg-black/50" onClick={toggleMobileMenu} />
            <div 
              ref={mobileMenuRef}
              className="fixed left-0 top-0 h-full w-80 bg-background p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 id="mobile-menu-title" className="text-lg font-semibold">
                  Navigation
                </h2>
                <AccessibleButton
                  onClick={toggleMobileMenu}
                  ariaLabel="Close navigation menu"
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </AccessibleButton>
              </div>
              
              {/* Mobile search */}
              {showSearch && (
                <div className="mb-6 relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      ref={searchRef}
                      type="search"
                      placeholder="Search navigation..."
                      value={searchQuery}
                      onChange={handleSearch}
                      onKeyDown={handleSearchKeyDown}
                      className="pl-10"
                      aria-label="Search navigation items"
                      aria-describedby="search-help"
                    />
                  </div>
                  <div id="search-help" className="sr-only">
                    Use arrow keys to navigate search results, Enter to select
                  </div>
                  
                  {/* Search results */}
                  {searchResults.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 mt-2 z-10">
                      <CardContent className="p-2">
                        <ul role="listbox" aria-label="Search results">
                          {searchResults.map((result, index) => (
                            <li key={result.id} role="option" aria-selected={index === activeSearchIndex}>
                              <AccessibleButton
                                onClick={() => {
                                  onNavigate?.(result.href);
                                  setSearchQuery('');
                                  toggleMobileMenu();
                                }}
                                className={`w-full text-left px-3 py-2 rounded hover:bg-muted ${
                                  index === activeSearchIndex ? 'bg-muted' : ''
                                }`}
                              >
                                <result.icon className="h-4 w-4 mr-2 inline" aria-hidden="true" />
                                {result.label}
                              </AccessibleButton>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              
              {/* Mobile navigation items */}
              <nav aria-label="Main navigation">
                <ul role="menubar" className="space-y-2">
                  {items.map(item => renderNavigationItem(item))}
                </ul>
              </nav>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop navigation
  return (
    <nav 
      ref={navRef}
      aria-label="Main navigation"
      className={`
        ${variant === 'vertical' ? 'w-64 h-full' : 'w-full'}
      `}
      onKeyDown={handleKeyDown}
    >
      {/* Header with logo and search */}
      {(logo || showSearch) && (
        <div className={`
          flex items-center gap-4 p-4 border-b
          ${variant === 'vertical' ? 'flex-col' : 'justify-between'}
        `}>
          {logo && <div className="flex-shrink-0">{logo}</div>}
          
          {showSearch && (
            <div className="relative flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  ref={searchRef}
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearch}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-10"
                  aria-label="Search navigation items"
                />
              </div>
              
              {/* Search results dropdown */}
              {searchResults.length > 0 && (
                <Card className="absolute top-full left-0 right-0 mt-2 z-50">
                  <CardContent className="p-2">
                    <ul role="listbox" aria-label="Search results">
                      {searchResults.map((result, index) => (
                        <li key={result.id} role="option" aria-selected={index === activeSearchIndex}>
                          <AccessibleButton
                            onClick={() => {
                              onNavigate?.(result.href);
                              setSearchQuery('');
                            }}
                            className={`w-full text-left px-3 py-2 rounded hover:bg-muted ${
                              index === activeSearchIndex ? 'bg-muted' : ''
                            }`}
                          >
                            <result.icon className="h-4 w-4 mr-2 inline" aria-hidden="true" />
                            {result.label}
                          </AccessibleButton>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Navigation items */}
      <div className="p-4">
        <ul 
          role="menubar" 
          className={`
            space-y-2
            ${variant === 'horizontal' ? 'flex flex-row space-y-0 space-x-2' : ''}
          `}
        >
          {items.map(item => renderNavigationItem(item))}
        </ul>
      </div>
    </nav>
  );
};

// Example usage with default navigation items
export const defaultNavigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: Home
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    badge: 'Pro'
  },
  {
    id: 'scan',
    label: 'Scan',
    href: '/scan',
    icon: Search
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/reports',
    icon: FileText,
    children: [
      {
        id: 'visibility-reports',
        label: 'Visibility Reports',
        href: '/reports/visibility',
        icon: BarChart3
      },
      {
        id: 'competitor-reports',
        label: 'Competitor Analysis',
        href: '/reports/competitors',
        icon: Users
      }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings
  },
  {
    id: 'help',
    label: 'Help',
    href: '/help',
    icon: HelpCircle
  }
];