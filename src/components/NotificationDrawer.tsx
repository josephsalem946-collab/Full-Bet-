import React from 'react';
import { X, Bell, CheckCircle2, Ticket, Trophy, ArrowDownCircle, Check, Trash2 } from 'lucide-react';
import { AppNotification } from '../types';
import { playClickSound } from '../utils/audio';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onDeleteNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onDeleteNotification,
  onClearAllNotifications
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-sm h-full bg-[#0a0f1d] text-slate-100 flex flex-col z-50 shadow-2xl border-l border-slate-800">
        
        {/* Header */}
        <div className="p-4 bg-[#0d1424] flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">Notifications Full Bet</h3>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && onClearAllNotifications && (
              <button
                onClick={() => {
                  playClickSound();
                  if (window.confirm("Voulez-vous effacer toutes les notifications ?")) {
                    onClearAllNotifications();
                  }
                }}
                className="text-[11px] text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition-colors px-1.5 py-1 rounded hover:bg-red-500/10 cursor-pointer"
                title="Effacer toutes les notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Effacer tout</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={() => {
                  playClickSound();
                  onMarkAllRead();
                }}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors px-1.5 py-1 rounded hover:bg-cyan-500/10 cursor-pointer"
                title="Tout marquer comme lu"
              >
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lu</span>
              </button>
            )}

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <Bell className="w-8 h-8 text-slate-700 stroke-[1.5]" />
              <p>Aucune notification reçue pour l'instant.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`group p-3 rounded-2xl transition-all relative ${
                  notif.read ? 'bg-[#0e1627] text-slate-300' : 'bg-[#121c32] text-white border border-cyan-500/20'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-[#17233f] shrink-0 mt-0.5">
                    {notif.type === 'deposit' ? (
                      <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                    ) : notif.type === 'borlette_draw' ? (
                      <Ticket className="w-4 h-4 text-amber-400" />
                    ) : notif.type === 'sports_win' ? (
                      <Trophy className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="font-bold text-xs text-white truncate">{notif.title}</h4>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">{notif.time}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {/* Suppression individuelle de notification */}
                  {onDeleteNotification && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playClickSound();
                        onDeleteNotification(notif.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/15 transition-all shrink-0 cursor-pointer opacity-70 group-hover:opacity-100"
                      title="Supprimer cette notification"
                      aria-label="Supprimer cette notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
