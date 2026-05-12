import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-20 border-b border-slate-200 bg-white/95 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sticky top-0 z-40">
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('vp:toggle-sidebar'))}
          className="lg:hidden p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 mt-0.5"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-[-0.8px] lg:tracking-[-1.5px] text-slate-900 truncate">{title}</h1>
          {subtitle && <p className="text-slate-500 text-xs sm:text-sm mt-0.5 line-clamp-1">{subtitle}</p>}
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 pl-2">
        <div className="hidden md:flex px-4 py-1.5 bg-slate-100 rounded-full text-xs uppercase tracking-[1px] text-slate-600 border border-slate-200 items-center gap-2 whitespace-nowrap">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {user?.role === 'Super Admin' ? 'SUPER ADMIN' : 'COMPANY ACCESS'}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 sm:pl-4 sm:border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="font-medium text-sm text-slate-900">{user?.name}</div>
            <div className="text-[10px] text-slate-500 -mt-px">{user?.email}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF0033] to-[#FF6A45] flex items-center justify-center text-sm font-bold text-white ring-2 ring-slate-200">
            {user?.name?.[0]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
