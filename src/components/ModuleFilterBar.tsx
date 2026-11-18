import React from 'react';
import { Trophy, Gamepad2, Ticket } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface ModuleFilterBarProps {
  activeModule: 'sports' | 'casino' | 'borlette';
  onNavigateModule?: (mod: 'sports' | 'casino' | 'borlette') => void;
}

export const ModuleFilterBar: React.FC<ModuleFilterBarProps> = ({
  activeModule,
  onNavigateModule
}) => {
  const items: Array<{
    id: 'sports' | 'casino' | 'borlette';
    label: string;
    icon: React.ReactNode;
    activeClass: string;
    inactiveClass: string;
  }> = [
    {
      id: 'sports',
      label: 'Paris Sportifs',
      icon: <Trophy className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />,
      activeClass: 'bg-cyan-500 text-slate-950 shadow-md',
      inactiveClass: 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    },
    {
      id: 'casino',
      label: 'Casino',
      icon: <Gamepad2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />,
      activeClass: 'bg-amber-500 text-slate-950 shadow-md',
      inactiveClass: 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    },
    {
      id: 'borlette',
      label: 'Borlette',
      icon: <Ticket className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />,
      activeClass: 'bg-emerald-500 text-slate-950 shadow-md',
      inactiveClass: 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    }
  ];

  return (
    <div
      className="flex items-center gap-1.5 bg-[#0e1627] p-1.5 rounded-2xl shadow-md overflow-x-auto no-scrollbar"
      role="tablist"
      aria-label="Filtres de catégories"
    >
      {items.map((item) => {
        const isActive = activeModule === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              playClickSound();
              onNavigateModule?.(item.id);
            }}
            className={`flex-1 min-w-fit px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              isActive ? item.activeClass : item.inactiveClass
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
