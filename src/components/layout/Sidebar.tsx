
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  TruckIcon, 
  MapPinIcon, 
  RecycleIcon, 
  AwardIcon, 
  BarChartIcon, 
  CalendarIcon, 
  UserIcon, 
  BellIcon, 
  SettingsIcon, 
  LogOutIcon,
  MenuIcon,
  XIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

type SidebarProps = {
  isOpen: boolean;
  toggleSidebar: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const citizenLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/request-pickup', label: 'Request Pickup', icon: TruckIcon },
    { path: '/recycling-centers', label: 'Recycling Centers', icon: MapPinIcon },
    { path: '/waste-guide', label: 'Waste Guide', icon: RecycleIcon },
    { path: '/rewards', label: 'Rewards', icon: AwardIcon },
    { path: '/profile', label: 'Profile', icon: UserIcon },
  ];

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/admin/requests', label: 'Pickup Requests', icon: TruckIcon },
    { path: '/admin/bin-status', label: 'Bin Status', icon: BellIcon },
    { path: '/admin/schedules', label: 'Schedules', icon: CalendarIcon },
    { path: '/admin/users', label: 'Users', icon: UserIcon },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChartIcon },
    { path: '/admin/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const links = isAdmin ? adminLinks : citizenLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      {/* Mobile toggle button */}
      <Button 
        variant="outline" 
        size="icon" 
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        {isOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
      </Button>
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-sidebar text-sidebar-foreground z-40 transition-transform duration-300 shadow-lg",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6">
            <div className="flex items-center gap-2">
              <RecycleIcon size={24} />
              <h1 className="text-xl font-bold">EcoWaste</h1>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-2 overflow-y-auto">
            <ul className="space-y-1">
              {links.map(link => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-lg transition-colors",
                      location.pathname === link.path
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-primary/50"
                    )}
                  >
                    <link.icon size={20} className="mr-3" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User section */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                <UserIcon size={20} />
              </div>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm opacity-70">{user?.role}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 border-sidebar-border hover:bg-sidebar-accent"
              onClick={logout}
            >
              <LogOutIcon size={16} />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
