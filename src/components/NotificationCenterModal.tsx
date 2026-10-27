import React from 'react';
import {
  X,
  Bell,
  BellRing,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  CheckCheck,
  Smartphone,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { AppwriteNotification, Product, Store } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
  onSelectStore?: (store: Store) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onSelectStore,
}) => {
  useBodyScrollLock(isOpen);
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    notificationPermission,
    requestNotificationPermission,
    isPushRegistered,
    products,
    stores,
  } = useMarketplace();

  if (!isOpen) return null;

  const handleNotificationClick = (notif: AppwriteNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.productId && onSelectProduct) {
      const prod = products.find((p) => p.id === notif.productId);
      if (prod) {
        onClose();
        onSelectProduct(prod);
        return;
      }
    }
    if (notif.storeId && onSelectStore) {
      const st = stores.find((s) => s.id === notif.storeId);
      if (st) {
        onClose();
        onSelectStore(st);
        return;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Notifications</h2>
                {unreadNotificationsCount > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500 text-white font-bold">
                    {unreadNotificationsCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Live alerts & campus updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadNotificationsCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Push Notification Banner */}
        {notificationPermission !== 'granted' && (
          <div className="p-3.5 bg-gradient-to-r from-orange-500/15 to-amber-500/15 border-b border-orange-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <Smartphone className="w-4 h-4 text-orange-400 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-white truncate">Enable Push Notifications</div>
                <div className="text-slate-300 text-[11px] truncate">
                  Get instant alerts when your store is approved or new items drop.
                </div>
              </div>
            </div>
            <button
              onClick={() => requestNotificationPermission()}
              className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shrink-0 transition-colors cursor-pointer shadow-sm"
            >
              Enable
            </button>
          </div>
        )}

        {notificationPermission === 'granted' && isPushRegistered && (
          <div className="px-4 py-2 bg-emerald-950/40 border-b border-emerald-800/40 flex items-center justify-between text-[11px] text-emerald-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Campus Push Notifications Active</span>
            </span>
            <span className="text-[10px] text-slate-400">Live Campus Feed</span>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Bell className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No notifications yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                You will be notified live when student sellers post new items or your store tier is upgraded!
              </p>
            </div>
          ) : (
            notifications.map((item: AppwriteNotification) => {
              const isNewProduct = item.type === 'new_product';
              const isPremium = item.type === 'premium_approved' || item.type === 'featured_approved';

              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    !item.isRead
                      ? 'bg-slate-800/90 border-orange-500/40 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isPremium
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : isNewProduct
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {isPremium ? (
                        <Sparkles className="w-4 h-4" />
                      ) : isNewProduct ? (
                        <ShoppingBag className="w-4 h-4" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-white truncate">
                          {item.title}
                        </h4>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60 text-[10px] text-slate-500">
                        <span>
                          {new Date(item.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {(item.productId || item.storeId) && (
                          <span className="text-orange-400 font-semibold flex items-center gap-1 hover:underline">
                            <span>View item</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-500 flex items-center justify-between px-4">
          <span>Live Campus Updates</span>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
