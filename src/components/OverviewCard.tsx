import React from 'react';
import { LucideIcon } from 'lucide-react';

interface OverviewCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  accentColor?: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({ title, value, change, icon: Icon, accentColor = '#FF0033' }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-all group shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500 tracking-[0.5px]">{title}</div>
          <div className="text-3xl font-semibold text-slate-900 tracking-[-1px] mt-3 mb-1 tabular-nums break-words">{value}</div>
          {change && (
            <div className="text-emerald-600 text-sm font-medium flex items-center gap-1">
              {change}
            </div>
          )}
        </div>
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform" 
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon className="w-6 h-6" style={{ color: accentColor }} />
        </div>
      </div>
    </div>
  );
};

export default OverviewCard;
