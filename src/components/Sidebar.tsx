import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BarChart3, Settings, LogOut, 
  Play, FileText, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isSuperAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isSuperAdmin }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const superAdminLinks = [
    { to: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/super-admin/companies', label: 'Companies', icon: Users },
    { to: '/super-admin/reports', label: 'Reports', icon: FileText },
    { to: '/super-admin/settings', label: 'Settings', icon: Settings },
  ];

  const companyLinks = [
    { to: '/company/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/company/reports', label: 'Analytics', icon: BarChart3 },
    { to: '/company/settings', label: 'Settings', icon: Settings },
  ];

  const links = isSuperAdmin ? superAdminLinks : companyLinks;

  useEffect(() => {
    const openHandler = () => setIsMobileOpen(true);
    const closeHandler = () => setIsMobileOpen(false);
    const toggleHandler = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener('vp:open-sidebar', openHandler as EventListener);
    window.addEventListener('vp:close-sidebar', closeHandler as EventListener);
    window.addEventListener('vp:toggle-sidebar', toggleHandler as EventListener);
    return () => {
      window.removeEventListener('vp:open-sidebar', openHandler as EventListener);
      window.removeEventListener('vp:close-sidebar', closeHandler as EventListener);
      window.removeEventListener('vp:toggle-sidebar', toggleHandler as EventListener);
    };
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const sidebarBody = (
    <>
      <div className="px-6 py-6 sm:px-8 sm:py-8 border-b border-slate-200">
        <div className="flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF0033] to-[#FF3355] flex items-center justify-center">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-2xl tracking-[-1.2px] text-slate-900">ViewPulse</div>
              <div className="text-[10px] text-slate-400 -mt-1">YOUTUBE ANALYTICS</div>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="text-xs uppercase tracking-[1.5px] text-slate-400 px-4 mb-3 font-medium">MENU</div>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-[13px] rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-50 text-red-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF0033] to-[#FF6A45] flex items-center justify-center text-sm font-semibold text-white">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-slate-900 truncate">{user?.name}</div>
            <div className="text-[10px] text-slate-500 truncate">{user?.companyName}</div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 shadow-sm h-screen flex-col fixed left-0 top-0 z-50">
        {sidebarBody}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            className="absolute inset-0 bg-black/45"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close menu backdrop"
          />
          <aside className="absolute left-0 top-0 h-full w-[85vw] max-w-[320px] bg-white border-r border-slate-200 shadow-2xl flex flex-col">
            {sidebarBody}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
