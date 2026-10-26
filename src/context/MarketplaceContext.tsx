import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Store,
  Product,
  ReportedContent,
  AnalyticsEvent,
  AppwriteConfig,
  StoreCategory,
} from '../types';
import { INITIAL_STORES, INITIAL_PRODUCTS, INITIAL_REPORTS } from '../data/initialData';
import {
  getStoredAppwriteConfig,
  saveStoredAppwriteConfig,
  testAppwriteConnection,
  triggerAppwriteOAuth,
  fetchStoresFromAppwrite,
  fetchProductsFromAppwrite,
  fetchReportsFromAppwrite,
  createStoreInAppwrite,
  updateStoreInAppwrite,
  deleteStoreInAppwrite,
  createProductInAppwrite,
  updateProductInAppwrite,
  deleteProductInAppwrite,
  createReportInAppwrite,
  updateReportInAppwrite,
  createAnalyticsEventInAppwrite,
  subscribeToMarketplaceRealtime,
} from '../lib/appwrite';

interface MarketplaceContextType {
  // Auth
  currentUser: User | null;
  isAdmin: boolean;
  loginAsAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  loginCustomer: (email: string, name: string) => void;
  loginBusiness: (email: string, name: string, storeId?: string) => void;
  loginBusinessWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string; store?: Store }>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  logout: () => void;

  // Stores
  stores: Store[];
  currentStore: Store | null;
  registerStore: (storeData: Omit<Store, 'id' | 'ownerId' | 'whatsappClicks' | 'profileViews' | 'isVerified' | 'verificationStatus' | 'isFrozen' | 'isFeatured' | 'hasPremiumLimit' | 'createdAt' | 'rating' | 'reviewCount'>) => Promise<Store>;
  updateStoreProfile: (storeId: string, updates: Partial<Store>) => void;
  requestStoreVerification: (storeId: string) => void;
  verifyStore: (storeId: string) => void;
  rejectStore: (storeId: string) => void;
  unverifyStore: (storeId: string) => void;
  freezeStore: (storeId: string, reason?: string) => void;
  unfreezeStore: (storeId: string) => void;
  deleteStore: (storeId: string) => void;
  requestFeaturedPromotion: (storeId: string) => void;
  requestPremiumTier: (storeId: string) => void;
  approveFeaturedPromotion: (storeId: string) => void;
  rejectFeaturedPromotion: (storeId: string) => void;
  revokeFeaturedPromotion: (storeId: string) => void;
  approvePremiumTier: (storeId: string) => void;
  rejectPremiumTier: (storeId: string) => void;
  revokePremiumTier: (storeId: string) => void;
  upgradeToFeatured: (storeId: string) => void;
  upgradeToPremiumPhotos: (storeId: string) => void;

  // Products
  products: Product[];
  addProduct: (productData: Omit<Product, 'id' | 'views' | 'whatsappInquiries' | 'createdAt'>) => Promise<{ success: boolean; savedLocally?: boolean; error?: string; product?: Product; appwriteWarning?: string }>;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  syncProductToCloud: (productId: string) => Promise<{ success: boolean; error?: string }>;
  syncAllLocalProductsToCloud: () => Promise<{ syncedCount: number; failedCount: number }>;

  // Interaction & WhatsApp Analytics
  trackWhatsAppClick: (storeId: string, productId?: string, customNote?: string) => string;
  trackStoreView: (storeId: string) => void;
  trackProductView: (productId: string) => void;

  // Filtering & Discovery
  selectedUniversity: string;
  setSelectedUniversity: (uni: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: StoreCategory | 'all';
  setSelectedCategory: (cat: StoreCategory | 'all') => void;
  filterVerifiedOnly: boolean;
  setFilterVerifiedOnly: (val: boolean) => void;
  filterDeliversOnly: boolean;
  setFilterDeliversOnly: (val: boolean) => void;
  filterTradesOnly: boolean;
  setFilterTradesOnly: (val: boolean) => void;
  filterFeaturedOnly: boolean;
  setFilterFeaturedOnly: (val: boolean) => void;

  // Reports
  reports: ReportedContent[];
  submitReport: (report: Omit<ReportedContent, 'id' | 'createdAt' | 'status'>) => void;
  updateReportStatus: (reportId: string, status: 'resolved' | 'dismissed') => void;

  // Analytics
  analyticsEvents: AnalyticsEvent[];
  totalWhatsAppClicks: number;
  totalRevenue: number;

  // Terms & Conditions Modal
  isTermsOpen: boolean;
  setIsTermsOpen: (open: boolean) => void;
  openTerms: () => void;
  closeTerms: () => void;

  // Appwrite Config & Live status
  appwriteConfig: AppwriteConfig;
  updateAppwriteConfig: (config: AppwriteConfig) => void;
  testAppwrite: (endpoint: string, projectId: string) => Promise<{ success: boolean; message: string }>;
  syncWithAppwrite: (forceRefresh?: boolean) => Promise<void>;
  isAppwriteLive: boolean;
}

// Purge all demo data from browser storage for clean production launch
try {
  ['hustlehub_stores_v1', 'hustlehub_products_v1', 'hustlehub_reports_v1', 'hustlehub_events_v1'].forEach((k) => {
    localStorage.removeItem(k);
  });
  // Clean out any demo items from live storage keys if present from previous builds
  const liveStores = localStorage.getItem('hustlehub_stores_live');
  if (liveStores) {
    const parsed = JSON.parse(liveStores);
    if (Array.isArray(parsed)) {
      const realOnly = parsed.filter((s: any) => s && s.id && !s.id.startsWith('store-demo'));
      localStorage.setItem('hustlehub_stores_live', JSON.stringify(realOnly));
    }
  }
  const liveProducts = localStorage.getItem('hustlehub_products_live');
  if (liveProducts) {
    const parsed = JSON.parse(liveProducts);
    if (Array.isArray(parsed)) {
      const realOnly = parsed.filter((p: any) => p && p.id && !p.id.startsWith('prod-demo'));
      localStorage.setItem('hustlehub_products_live', JSON.stringify(realOnly));
    }
  }
} catch (e) {
  // Ignore in SSR/restricted environments
}

const STORAGE_KEYS = {
  STORES: 'hustlehub_stores_live',
  PRODUCTS: 'hustlehub_products_live',
  REPORTS: 'hustlehub_reports_live',
  EVENTS: 'hustlehub_events_live',
  USER: 'hustlehub_user_live',
  ADMIN: 'hustlehub_admin_live',
};

// Live Cross-Window & Installed PWA BroadcastChannel for zero-refresh updates
const liveBroadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('hustlehub_live_sync')
  : null;

const notifyInstances = (type: string, data?: any) => {
  if (liveBroadcast) {
    try {
      liveBroadcast.postMessage({ type, data, timestamp: Date.now() });
    } catch {
      // Ignore broadcast errors in restricted environments
    }
  }
};

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Terms & Conditions modal state
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);
  const openTerms = useCallback(() => setIsTermsOpen(true), []);
  const closeTerms = useCallback(() => setIsTermsOpen(false), []);

  // Load persistent real student stores (with zero demo data)
  const [stores, setStores] = useState<Store[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STORES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(s => s && s.id && !s.id.startsWith('store-demo'));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STORES;
  });

  // Load persistent real student products (with zero demo data)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(p => p && p.id && !p.id.startsWith('prod-demo'));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRODUCTS;
  });

  const [reports, setReports] = useState<ReportedContent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_REPORTS;
  });

  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN) === 'true';
  });

  const [appwriteConfig, setAppwriteConfig] = useState<AppwriteConfig>(getStoredAppwriteConfig);
  const [isAppwriteLive, setIsAppwriteLive] = useState<boolean>(false);

  // Search & Filter State
  const [selectedUniversity, setSelectedUniversity] = useState<string>('NUST');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory | 'all'>('all');
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState<boolean>(false);
  const [filterDeliversOnly, setFilterDeliversOnly] = useState<boolean>(false);
  const [filterTradesOnly, setFilterTradesOnly] = useState<boolean>(false);
  const [filterFeaturedOnly, setFilterFeaturedOnly] = useState<boolean>(false);

  // Appwrite Cloud Fetch & Real-Time Sync (with 60s cache and 25-item pagination)
  const syncWithAppwrite = useCallback(async (forceRefresh = false) => {
    if (!appwriteConfig.projectId || !appwriteConfig.databaseId) {
      setIsAppwriteLive(false);
      return;
    }

    try {
      const [remoteStores, remoteProducts, remoteReports] = await Promise.all([
        fetchStoresFromAppwrite({ limit: 25, offset: 0, forceRefresh }),
        fetchProductsFromAppwrite({ limit: 25, offset: 0, forceRefresh }),
        fetchReportsFromAppwrite({ limit: 25, offset: 0, forceRefresh }),
      ]);

      if (remoteStores && remoteStores.length > 0) {
        const nonDemoRemote = remoteStores.filter(s => s && s.id && !s.id.startsWith('store-demo'));
        setStores(prev => {
          const localMap = new Map<string, Store>(prev.map(s => [s.id, s]));
          const merged = nonDemoRemote.map(remoteStore => {
            const localStore = localMap.get(remoteStore.id);
            if (!localStore) return remoteStore;

            // If the store was marked unverified, preserve the unverified state
            let isVerified = false;
            if (localStore.verificationStatus === 'unverified' && !localStore.isVerified) {
              isVerified = false;
            } else if (remoteStore.isVerified !== undefined) {
              isVerified = Boolean(remoteStore.isVerified);
            } else {
              isVerified = Boolean(localStore.isVerified);
            }

            const isFrozen = Boolean(remoteStore.isFrozen !== undefined ? remoteStore.isFrozen : localStore.isFrozen);
            const isFeatured = Boolean(remoteStore.isFeatured || localStore.isFeatured);
            const hasPremiumLimit = Boolean(remoteStore.hasPremiumLimit || localStore.hasPremiumLimit);

            return {
              ...localStore,
              ...remoteStore,
              isVerified,
              isFrozen,
              isFeatured,
              hasPremiumLimit,
              featuredRequested: !isFeatured && Boolean(remoteStore.featuredRequested || localStore.featuredRequested),
              featuredRequestDate: remoteStore.featuredRequestDate || localStore.featuredRequestDate,
              premiumRequested: !hasPremiumLimit && Boolean(remoteStore.premiumRequested || localStore.premiumRequested),
              premiumRequestDate: remoteStore.premiumRequestDate || localStore.premiumRequestDate,
              verificationRequested: !isVerified && Boolean(remoteStore.verificationRequested || localStore.verificationRequested),
              verificationRequestDate: remoteStore.verificationRequestDate || localStore.verificationRequestDate,
              verificationStatus: isVerified
                ? ('verified' as const)
                : (localStore.verificationStatus === 'unverified'
                    ? ('unverified' as const)
                    : (remoteStore.verificationStatus || localStore.verificationStatus || ((remoteStore.verificationRequested || localStore.verificationRequested) ? 'pending' : 'unverified'))),
            };
          });

          for (const s of prev) {
            if (s && s.id && !s.id.startsWith('store-demo') && !merged.some(m => m.id === s.id)) {
              merged.push(s);
            }
          }
          return merged;
        });
      }

      if (remoteReports && remoteReports.length > 0) {
        setReports(prev => {
          const map = new Map<string, ReportedContent>();
          prev.forEach(r => map.set(r.id, r));
          remoteReports.forEach(r => map.set(r.id, r));
          return Array.from(map.values());
        });
      }

      const nonDemoRemoteProducts = (remoteProducts || []).filter(p => p && p.id && !p.id.startsWith('prod-demo'));
      
      setProducts(prev => {
        // Build store lookup to strictly resolve storeIsVerified
        let currentStores = stores;
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.STORES);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) currentStores = parsed;
          }
        } catch {}
        const storeMap = new Map(currentStores.map(s => [s.id, s]));

        // Start with remote products from Appwrite, enforcing store's true verification state
        const merged = nonDemoRemoteProducts.map(rp => {
          const parent = storeMap.get(rp.storeId);
          return {
            ...rp,
            storeIsVerified: parent ? Boolean(parent.isVerified) : Boolean(rp.storeIsVerified),
          };
        });

        // Retain local products that aren't in Appwrite yet so user doesn't lose data
        for (const localP of prev) {
          if (localP && localP.id && !localP.id.startsWith('prod-demo')) {
            const alreadyInRemote = merged.some(
              rp => rp.id === localP.id || (rp.title === localP.title && rp.storeId === localP.storeId)
            );
            if (!alreadyInRemote) {
              const parent = storeMap.get(localP.storeId);
              merged.push({
                ...localP,
                storeIsVerified: parent ? Boolean(parent.isVerified) : Boolean(localP.storeIsVerified),
                isSyncedToCloud: false,
              });
            }
          }
        }
        return merged;
      });

      setIsAppwriteLive(true);

      // Auto-push any local products that are not yet in Appwrite
      try {
        const savedRaw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        if (savedRaw) {
          const currentLocal = JSON.parse(savedRaw) as Product[];
          const unsyncedList = currentLocal.filter(
            p => p && p.id && !p.id.startsWith('prod-demo') && !nonDemoRemoteProducts.some(rp => rp.id === p.id || (rp.title === p.title && rp.storeId === p.storeId))
          );

          if (unsyncedList.length > 0) {
            console.log(`Auto-pushing ${unsyncedList.length} local product(s) to Appwrite Cloud...`);
            for (const localProd of unsyncedList) {
              const syncRes = await createProductInAppwrite(localProd);
              if (syncRes.success) {
                setProducts(curr =>
                  curr.map(p =>
                    p.id === localProd.id
                      ? { ...p, isSyncedToCloud: true, appwriteDocId: syncRes.docId, cloudSyncError: undefined }
                      : p
                  )
                );
                console.log(`Successfully auto-pushed "${localProd.title}" to Appwrite!`);
              } else {
                setProducts(curr =>
                  curr.map(p =>
                    p.id === localProd.id
                      ? { ...p, isSyncedToCloud: false, cloudSyncError: syncRes.error }
                      : p
                  )
                );
              }
            }
          }
        }
      } catch (autoErr) {
        console.warn('Auto-sync product check error:', autoErr);
      }
    } catch (err) {
      console.warn('Appwrite sync failed, continuing with cached/local data:', err);
      setIsAppwriteLive(false);
    }
  }, [appwriteConfig]);

  // Initial load and Realtime Database Subscription
  useEffect(() => {
    if (!appwriteConfig.projectId) {
      setIsAppwriteLive(false);
      return;
    }

    let isSubscribed = true;
    syncWithAppwrite(false);

    // Subscribe to Appwrite Realtime events: Apply payload directly with 0 extra reads!
    const unsubscribe = subscribeToMarketplaceRealtime({
      onStoreChange: (payload, events = []) => {
        if (!isSubscribed || !payload) return;
        const freshId = payload.id || payload.$id;
        if (!freshId) return;

        const isDelete = events.some((e: string) => e.includes('.delete'));
        if (isDelete) {
          setStores(prev => prev.filter(s => s.id !== freshId && (s as any).$id !== freshId));
          return;
        }

        setStores(prev => {
          const idx = prev.findIndex(s => s.id === freshId || (s as any).$id === freshId);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ...payload, id: freshId };
            return copy;
          } else {
            return [{ ...payload, id: freshId } as Store, ...prev];
          }
        });
      },
      onProductChange: (payload, events = []) => {
        if (!isSubscribed || !payload) return;
        const freshId = payload.id || payload.$id;
        if (!freshId) return;

        const isDelete = events.some((e: string) => e.includes('.delete'));
        if (isDelete) {
          setProducts(prev => prev.filter(p => p.id !== freshId && (p as any).$id !== freshId));
          return;
        }

        setProducts(prev => {
          const idx = prev.findIndex(p => p.id === freshId || (p as any).$id === freshId);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ...payload, id: freshId };
            return copy;
          } else {
            return [{ ...payload, id: freshId } as Product, ...prev];
          }
        });
      },
      onReportChange: (payload, events = []) => {
        if (!isSubscribed || !payload) return;
        const freshId = payload.id || payload.$id;
        if (!freshId) return;

        const isDelete = events.some((e: string) => e.includes('.delete'));
        if (isDelete) {
          setReports(prev => prev.filter(r => r.id !== freshId && (r as any).$id !== freshId));
          return;
        }

        setReports(prev => {
          const idx = prev.findIndex(r => r.id === freshId || (r as any).$id === freshId);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ...payload, id: freshId };
            return copy;
          } else {
            return [{ ...payload, id: freshId } as ReportedContent, ...prev];
          }
        });
      },
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [appwriteConfig.projectId, appwriteConfig.databaseId, syncWithAppwrite]);

  // Real-time synchronization across installed PWA instances, windows, and tabs
  useEffect(() => {
    // 1. Listen for cross-window / PWA BroadcastChannel notifications
    if (liveBroadcast) {
      const handleBroadcast = (event: MessageEvent) => {
        const { type, data } = event.data || {};
        if (type === 'STORES_UPDATE' && Array.isArray(data)) {
          setStores(data);
        } else if (type === 'PRODUCTS_UPDATE' && Array.isArray(data)) {
          setProducts(data);
        } else if (type === 'SYNC_ALL') {
          syncWithAppwrite().catch(() => {});
        }
      };
      liveBroadcast.addEventListener('message', handleBroadcast);
      return () => {
        liveBroadcast.removeEventListener('message', handleBroadcast);
      };
    }
  }, [syncWithAppwrite]);

  // 2. Cross-tab & installed PWA storage event listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.STORES && e.newValue) {
        try {
          const fresh = JSON.parse(e.newValue);
          if (Array.isArray(fresh)) {
            setStores(fresh);
          }
        } catch {}
      }
      if (e.key === STORAGE_KEYS.PRODUCTS && e.newValue) {
        try {
          const fresh = JSON.parse(e.newValue);
          if (Array.isArray(fresh)) {
            setProducts(fresh);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 3. Tab Visibility & Focus Sync (Throttled to 60s, NO manual setInterval polling)
  // Appwrite Realtime WebSocket handles instantaneous live updates; this safely handles tab wake-up.
  useEffect(() => {
    let lastSyncTime = Date.now();

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Only re-sync if at least 60 seconds have elapsed since last sync
        if (now - lastSyncTime > 60000 && appwriteConfig.projectId && appwriteConfig.databaseId) {
          lastSyncTime = now;
          syncWithAppwrite(false).catch(() => {});
        }
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [appwriteConfig.projectId, appwriteConfig.databaseId, syncWithAppwrite]);

  // Save changes to localStorage as reliable cache
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(analyticsEvents));
  }, [analyticsEvents]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN, isAdmin ? 'true' : 'false');
  }, [isAdmin]);

  // Admin Authentication - Strict verification against user's password requirement
  const loginAsAdmin = (password: string): boolean => {
    if (password === 'muna@2005') {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
  };

  const loginCustomer = (email: string, name: string) => {
    const newUser: User = {
      id: 'cust-' + Date.now(),
      name: name || email.split('@')[0],
      email,
      role: 'customer',
      university: selectedUniversity,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(newUser);
  };

  const loginBusiness = (email: string, name: string, storeId?: string) => {
    const existingStore = stores.find(s => s.ownerEmail.toLowerCase() === email.toLowerCase());
    const newUser: User = {
      id: 'biz-' + Date.now(),
      name: name || email.split('@')[0],
      email,
      role: 'business',
      university: selectedUniversity,
      createdAt: new Date().toISOString(),
      storeId: storeId || existingStore?.id,
    };
    setCurrentUser(newUser);
  };

  const loginBusinessWithPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string; store?: Store }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const findMatchingStore = (storeList: Store[]) => {
      return storeList.find(s => {
        const ownerEmail = (s.ownerEmail || '').trim().toLowerCase();
        const storeName = (s.name || '').trim().toLowerCase();
        const cleanPhone = (s.whatsappNumber || '').replace(/\D/g, '');
        const cleanInput = trimmedEmail.replace(/\D/g, '');

        if (ownerEmail && ownerEmail === trimmedEmail) return true;
        if (storeName && storeName === trimmedEmail) return true;
        if (cleanPhone && cleanInput.length >= 7 && cleanPhone.endsWith(cleanInput)) return true;
        return false;
      });
    };

    let store = findMatchingStore(stores);

    // If not found in local cache (e.g. freshly opened on another device before sync completed),
    // query Appwrite directly in real-time
    if (!store) {
      try {
        const liveStores = await fetchStoresFromAppwrite({ limit: 25, forceRefresh: false });
        if (liveStores && liveStores.length > 0) {
          setStores(prev => {
            const map = new Map<string, Store>();
            prev.forEach(s => map.set(s.id, s));
            liveStores.forEach(s => map.set(s.id, s));
            return Array.from(map.values());
          });
          store = findMatchingStore(liveStores);
        }
      } catch (lookupErr) {
        console.warn('Realtime Appwrite store lookup on sign-in error:', lookupErr);
      }
    }

    if (!store) {
      return {
        success: false,
        error: `No registered business found for "${email}". If you registered on another phone or computer, please double-check your email or register your store below.`,
      };
    }

    // Password verification with trimmed values
    const savedPassword = (store.password || '').trim();
    if (savedPassword && savedPassword !== cleanPassword) {
      return {
        success: false,
        error: 'Incorrect password for this business account. Please double-check your password.',
      };
    }

    // If store didn't have a password saved yet in Appwrite (e.g. registered before password field was added),
    // save this password so future logins on all devices succeed!
    if (!savedPassword && cleanPassword) {
      updateStoreProfile(store.id, { password: cleanPassword });
      updateStoreInAppwrite(store.id, { password: cleanPassword });
    }

    // Set currentUser with business role and storeId
    const newUser: User = {
      id: store.ownerId || 'biz-' + Date.now(),
      name: store.ownerName || store.name,
      email: store.ownerEmail || email,
      role: 'business',
      university: store.university || selectedUniversity,
      createdAt: store.createdAt || new Date().toISOString(),
      storeId: store.id,
    };
    setCurrentUser(newUser);

    // Refresh cloud products for this store in background
    syncWithAppwrite().catch(() => {});

    return { success: true, store };
  };

  const loginWithOAuth = async (provider: 'google' | 'github') => {
    try {
      await triggerAppwriteOAuth(provider);
    } catch {
      // Fallback demo auth
      const simulatedEmail = `student.${provider}@nust.ac.zw`;
      loginCustomer(simulatedEmail, `${provider.toUpperCase()} Student`);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Find current user's store
  const currentStore = currentUser?.storeId
    ? stores.find(s => s.id === currentUser.storeId) || null
    : stores.find(s => s.ownerEmail.toLowerCase() === currentUser?.email.toLowerCase()) || null;

  // Store Registration Flow - New stores register and automatically submit verification request for admin review!
  const registerStore = async (storeData: Omit<Store, 'id' | 'ownerId' | 'whatsappClicks' | 'profileViews' | 'isVerified' | 'verificationStatus' | 'isFrozen' | 'isFeatured' | 'hasPremiumLimit' | 'createdAt' | 'rating' | 'reviewCount'>): Promise<Store> => {
    const ownerId = currentUser?.id || 'biz-' + Date.now();
    const newStore: Store = {
      ...storeData,
      id: 'store-' + Date.now(),
      ownerId,
      whatsappClicks: 0,
      profileViews: 1,
      isVerified: false,
      verificationStatus: 'pending', // Automatic pending verification request
      verificationRequested: true,
      verificationRequestDate: new Date().toISOString(),
      isFrozen: false,
      isFeatured: false,
      hasPremiumLimit: false,
      createdAt: new Date().toISOString(),
      rating: 5.0,
      reviewCount: 0,
    };

    setStores(prev => {
      const updated = [newStore, ...prev];
      notifyInstances('STORES_UPDATE', updated);
      return updated;
    });

    // Push to Appwrite Database
    createStoreInAppwrite(newStore);

    // Update user session with business role and storeId
    const newUser: User = {
      id: ownerId,
      name: newStore.ownerName,
      email: newStore.ownerEmail,
      role: 'business',
      university: newStore.university,
      createdAt: newStore.createdAt,
      storeId: newStore.id,
    };
    setCurrentUser(newUser);

    return newStore;
  };

  const updateStoreProfile = (storeId: string, updates: Partial<Store>) => {
    setStores(prev => {
      const updated = prev.map(s => (s.id === storeId ? { ...s, ...updates } : s));
      notifyInstances('STORES_UPDATE', updated);
      return updated;
    });
    // Sync to Appwrite
    updateStoreInAppwrite(storeId, updates);

    // Also update denormalized store fields on products
    if (updates.name || updates.whatsappNumber || updates.location) {
      setProducts(prev => {
        const updated = prev.map(p =>
          p.storeId === storeId
            ? {
                ...p,
                storeName: updates.name || p.storeName,
                storeWhatsApp: updates.whatsappNumber || p.storeWhatsApp,
                storeLocation: updates.location || p.storeLocation,
              }
            : p
        );
        notifyInstances('PRODUCTS_UPDATE', updated);
        return updated;
      });
    }
  };

  const requestStoreVerification = (storeId: string) => {
    const updates = {
      verificationRequested: true,
      verificationRequestDate: new Date().toISOString(),
      verificationStatus: 'pending' as const,
    };
    setStores(prev => {
      const updated = prev.map(s => (s.id === storeId ? { ...s, ...updates } : s));
      notifyInstances('STORES_UPDATE', updated);
      return updated;
    });
    updateStoreInAppwrite(storeId, updates);
  };

  const verifyStore = (storeId: string) => {
    const updates = {
      isVerified: true,
      verificationStatus: 'verified' as const,
      verificationRequested: false,
    };
    setStores(prev => {
      const updated = prev.map(s =>
        s.id === storeId ? { ...s, ...updates } : s
      );
      try {
        localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(updated));
      } catch {}
      notifyInstances('STORES_UPDATE', updated);
      return updated;
    });
    setProducts(prev => {
      const updated = prev.map(p => (p.storeId === storeId ? { ...p, storeIsVerified: true } : p));
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      } catch {}
      notifyInstances('PRODUCTS_UPDATE', updated);
      return updated;
    });
    // Sync to Appwrite
    updateStoreInAppwrite(storeId, updates);
  };

  const rejectStore = (storeId: string) => {
    const updates = {
      isVerified: false,
      verificationStatus: 'unverified' as const,
      verificationRequested: false,
    };
    setStores(prev => {
      const updated = prev.map(s =>
        s.id === storeId ? { ...s, ...updates } : s
      );
      try {
        localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(updated));
      } catch {}
      notifyInstances('STORES_UPDATE', updated);
      return updated;
    });
    setProducts(prev => {
      const updated = prev.map(p => (p.storeId === storeId ? { ...p, storeIsVerified: false } : p));
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      } catch {}
      notifyInstances('PRODUCTS_UPDATE', updated);
      return updated;
    });
    // Sync to Appwrite
    updateStoreInAppwrite(storeId, updates);
  };

  const freezeStore = (storeId: string, reason = 'Administrative review') => {
    setStores(prev => {
      const updated = prev.map(s => (s.id === storeId ? { ...s, isFrozen: true, freezeReason: reason } : s));
      notifyInstances('STORES_UPDATE', updated);
      return updated;
    });
    // Sync to Appwrite
    updateStoreInAppwrite(storeId, { isFrozen: true, freezeReason: reason });
  };

  const unfreezeStore = (storeId: string) => {
    setStores(prev => {
      const updated = prev.map(s => (s.id === storeId ? { ...s, isFrozen: false, freezeReason: '' } : s));
      notifyInstances('STORES_UPDATE', updated);
      return updated;
    });
    // Sync to Appwrite
    updateStoreInAppwrite(storeId, { isFrozen: false, freezeReason: '' });
  };

  const deleteStore = (storeId: string) => {
    setStores(prev => {
      const updated = prev.filter(s => s.id !== storeId);
      notifyInstances('STORES_UPDATE', updated);
      return updated;
    });
    setProducts(prev => {
      const updated = prev.filter(p => p.storeId !== storeId);
      notifyInstances('PRODUCTS_UPDATE', updated);
      return updated;
    });
    // Sync to Appwrite
    deleteStoreInAppwrite(storeId);
  };

  const requestFeaturedPromotion = (storeId: string) => {
    const updates = {
      featuredRequested: true,
      featuredRequestDate: new Date().toISOString(),
    };
    setStores(prev =>
      prev.map(s => (s.id === storeId ? { ...s, ...updates } : s))
    );
    updateStoreInAppwrite(storeId, updates);
  };

  const requestPremiumTier = (storeId: string) => {
    const updates = {
      premiumRequested: true,
      premiumRequestDate: new Date().toISOString(),
    };
    setStores(prev =>
      prev.map(s => (s.id === storeId ? { ...s, ...updates } : s))
    );
    updateStoreInAppwrite(storeId, updates);
  };

  const approveFeaturedPromotion = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    const featuredUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const updates = {
      isFeatured: true,
      featuredRequested: false,
      featuredUntil,
    };

    setStores(prev =>
      prev.map(s => (s.id === storeId ? { ...s, ...updates } : s))
    );
    updateStoreInAppwrite(storeId, updates);

    const newEvent: AnalyticsEvent = {
      id: 'ev-' + Date.now(),
      type: 'feature_purchase',
      storeId,
      storeName: store.name,
      amount: 2, // $2/mo featured promotion
      timestamp: new Date().toISOString(),
    };
    setAnalyticsEvents(prev => [newEvent, ...prev]);
    createAnalyticsEventInAppwrite(newEvent);
  };

  const rejectFeaturedPromotion = (storeId: string) => {
    setStores(prev =>
      prev.map(s => (s.id === storeId ? { ...s, featuredRequested: false } : s))
    );
    updateStoreInAppwrite(storeId, { featuredRequested: false });
  };

  const revokeFeaturedPromotion = (storeId: string) => {
    setStores(prev =>
      prev.map(s => (s.id === storeId ? { ...s, isFeatured: false, featuredRequested: false } : s))
    );
    updateStoreInAppwrite(storeId, { isFeatured: false, featuredRequested: false });
  };

  const approvePremiumTier = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    const updates = {
      hasPremiumLimit: true,
      premiumRequested: false,
    };

    setStores(prev =>
      prev.map(s => (s.id === storeId ? { ...s, ...updates } : s))
    );
    updateStoreInAppwrite(storeId, updates);

    const newEvent: AnalyticsEvent = {
      id: 'ev-' + Date.now(),
      type: 'premium_purchase',
      storeId,
      storeName: store.name,
      amount: 1, // $1/mo premium store tier
      timestamp: new Date().toISOString(),
    };
    setAnalyticsEvents(prev => [newEvent, ...prev]);
    createAnalyticsEventInAppwrite(newEvent);
  };

  const rejectPremiumTier = (storeId: string) => {
    setStores(prev =>
      prev.map(s => (s.id === storeId ? { ...s, premiumRequested: false } : s))
    );
    updateStoreInAppwrite(storeId, { premiumRequested: false });
  };

  const revokePremiumTier = (storeId: string) => {
    setStores(prev =>
      prev.map(s => (s.id === storeId ? { ...s, hasPremiumLimit: false, premiumRequested: false } : s))
    );
    updateStoreInAppwrite(storeId, { hasPremiumLimit: false, premiumRequested: false });
  };

  const upgradeToFeatured = (storeId: string) => {
    approveFeaturedPromotion(storeId);
  };

  const upgradeToPremiumPhotos = (storeId: string) => {
    approvePremiumTier(storeId);
  };

  // Product Management (with Free Tier limit of 3 products & 1 photo unless store.hasPremiumLimit)
  const addProduct = async (productData: Omit<Product, 'id' | 'views' | 'whatsappInquiries' | 'createdAt'>): Promise<{ success: boolean; savedLocally?: boolean; error?: string; product?: Product; appwriteWarning?: string }> => {
    const store = stores.find(s => s.id === productData.storeId);
    if (!store) {
      return { success: false, error: 'Store not found' };
    }

    const currentCount = products.filter(p => p.storeId === productData.storeId).length;
    if (!store.hasPremiumLimit && currentCount >= 3) {
      return {
        success: false,
        error: 'Free tier limit reached (3 product listings max). Upgrade to Premium Store ($1/mo) to add more products!',
      };
    }

    // Limit to 1 image for free tier
    const safeImages = !store.hasPremiumLimit && productData.images.length > 1
      ? [productData.images[0]]
      : productData.images;

    const newProduct: Product = {
      ...productData,
      images: safeImages,
      id: 'prod-' + Date.now(),
      views: 1,
      whatsappInquiries: 0,
      createdAt: new Date().toISOString(),
      storeIsVerified: store.isVerified !== false,
      isSyncedToCloud: false,
    };

    // Push to Appwrite Database with auto-adaptive resilience
    let appwriteError: string | undefined;
    let isSynced = false;

    if (appwriteConfig.projectId && appwriteConfig.databaseId) {
      try {
        const syncRes = await createProductInAppwrite(newProduct);
        if (syncRes.success) {
          isSynced = true;
          newProduct.isSyncedToCloud = true;
          newProduct.appwriteDocId = syncRes.docId;
          newProduct.cloudSyncError = undefined;
        } else {
          appwriteError = syncRes.error;
          newProduct.isSyncedToCloud = false;
          newProduct.cloudSyncError = syncRes.error;
          console.warn('Appwrite product creation warning:', syncRes.error);
        }
      } catch (e: any) {
        appwriteError = e?.message || 'Appwrite error';
        newProduct.isSyncedToCloud = false;
        newProduct.cloudSyncError = appwriteError;
      }
    } else {
      newProduct.isSyncedToCloud = false;
      newProduct.cloudSyncError = 'Appwrite not configured with project/database ID';
    }

    // Instant local state update for zero-latency UI
    setProducts(prev => {
      const updated = [newProduct, ...prev];
      notifyInstances('PRODUCTS_UPDATE', updated);
      return updated;
    });

    return {
      success: isSynced,
      savedLocally: true,
      product: newProduct,
      error: appwriteError,
      appwriteWarning: appwriteError,
    };
  };

  const syncProductToCloud = async (productId: string): Promise<{ success: boolean; error?: string }> => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return { success: false, error: 'Product not found' };

    const syncRes = await createProductInAppwrite(prod);
    if (syncRes.success) {
      setProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? { ...p, isSyncedToCloud: true, appwriteDocId: syncRes.docId, cloudSyncError: undefined }
            : p
        )
      );
      return { success: true };
    } else {
      setProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? { ...p, isSyncedToCloud: false, cloudSyncError: syncRes.error }
            : p
        )
      );
      return { success: false, error: syncRes.error };
    }
  };

  const syncAllLocalProductsToCloud = async (): Promise<{ syncedCount: number; failedCount: number }> => {
    const unsynced = products.filter(p => !p.isSyncedToCloud);
    let synced = 0;
    let failed = 0;
    for (const p of unsynced) {
      const syncRes = await createProductInAppwrite(p);
      if (syncRes.success) {
        synced++;
        setProducts(prev =>
          prev.map(item =>
            item.id === p.id
              ? { ...item, isSyncedToCloud: true, appwriteDocId: syncRes.docId, cloudSyncError: undefined }
              : item
          )
        );
      } else {
        failed++;
        setProducts(prev =>
          prev.map(item =>
            item.id === p.id
              ? { ...item, isSyncedToCloud: false, cloudSyncError: syncRes.error }
              : item
          )
        );
      }
    }
    return { syncedCount: synced, failedCount: failed };
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts(prev => {
      const updated = prev.map(p => (p.id === productId ? { ...p, ...updates } : p));
      notifyInstances('PRODUCTS_UPDATE', updated);
      return updated;
    });
    updateProductInAppwrite(productId, updates);
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== productId);
      notifyInstances('PRODUCTS_UPDATE', updated);
      return updated;
    });
    deleteProductInAppwrite(productId);
  };

  // WhatsApp Click Tracking & URL Generator
  const trackWhatsAppClick = (storeId: string, productId?: string, customNote?: string): string => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return '#';

    const newClicks = (store.whatsappClicks || 0) + 1;
    // Increment store WhatsApp click counter
    setStores(prev =>
      prev.map(s => (s.id === storeId ? { ...s, whatsappClicks: newClicks } : s))
    );
    updateStoreInAppwrite(storeId, { whatsappClicks: newClicks });

    // If on a specific product, increment product inquiries
    let productTitle = '';
    if (productId) {
      const prod = products.find(p => p.id === productId);
      productTitle = prod?.title || '';
      const newInquiries = (prod?.whatsappInquiries || 0) + 1;
      setProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? { ...p, whatsappInquiries: newInquiries }
            : p
        )
      );
      updateProductInAppwrite(productId, { whatsappInquiries: newInquiries });
    }

    // Log analytics event
    const event: AnalyticsEvent = {
      id: 'ev-' + Date.now(),
      type: 'whatsapp_click',
      storeId,
      storeName: store.name,
      productId,
      productTitle,
      timestamp: new Date().toISOString(),
    };
    setAnalyticsEvents(prev => [event, ...prev]);
    createAnalyticsEventInAppwrite(event);

    // Format WhatsApp phone number (clean spaces, dashes, parentheses)
    const cleanNumber = store.whatsappNumber.replace(/[^0-9]/g, '');

    // Construct polite, student-tailored default message
    let message = `Hi ${store.name}! I saw your store on HustleHub (${store.university}).`;
    if (productTitle) {
      message = `Hi ${store.name}! I saw your listing for "${productTitle}" on HustleHub (${store.university}). Is it still available?`;
    }
    if (customNote) {
      message += ` ${customNote}`;
    }

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanNumber}?text=${encoded}`;

    // Open WhatsApp in a clean tab or app
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    return waUrl;
  };

  const trackStoreView = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    const newViews = (store?.profileViews || 0) + 1;
    setStores(prev =>
      prev.map(s => (s.id === storeId ? { ...s, profileViews: newViews } : s))
    );
    updateStoreInAppwrite(storeId, { profileViews: newViews });
  };

  const trackProductView = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    const newViews = (prod?.views || 0) + 1;
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, views: newViews } : p))
    );
    updateProductInAppwrite(productId, { views: newViews });
  };

  // Reporting
  const submitReport = (reportData: Omit<ReportedContent, 'id' | 'createdAt' | 'status'>) => {
    const newReport: ReportedContent = {
      ...reportData,
      id: 'rep-' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    setReports(prev => [newReport, ...prev]);
    createReportInAppwrite(newReport);
  };

  const updateReportStatus = (reportId: string, status: 'resolved' | 'dismissed') => {
    setReports(prev => prev.map(r => (r.id === reportId ? { ...r, status } : r)));
    updateReportInAppwrite(reportId, status);
  };

  // Appwrite Config
  const updateAppwriteConfig = (config: AppwriteConfig) => {
    saveStoredAppwriteConfig(config);
    setAppwriteConfig(config);
  };

  const testAppwrite = async (endpoint: string, projectId: string) => {
    return testAppwriteConnection(endpoint, projectId);
  };

  // Totals for Dashboard
  const totalWhatsAppClicks = stores.reduce((acc, s) => acc + (s.whatsappClicks || 0), 0);
  const totalRevenue = analyticsEvents
    .filter(e => e.amount)
    .reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <MarketplaceContext.Provider
      value={{
        currentUser,
        isAdmin,
        loginAsAdmin,
        logoutAdmin,
        loginCustomer,
        loginBusiness,
        loginBusinessWithPassword,
        loginWithOAuth,
        logout,
        stores,
        currentStore,
        registerStore,
        updateStoreProfile,
        requestStoreVerification,
        verifyStore,
        rejectStore,
        unverifyStore: rejectStore,
        freezeStore,
        unfreezeStore,
        deleteStore,
        requestFeaturedPromotion,
        requestPremiumTier,
        approveFeaturedPromotion,
        rejectFeaturedPromotion,
        revokeFeaturedPromotion,
        approvePremiumTier,
        rejectPremiumTier,
        revokePremiumTier,
        upgradeToFeatured,
        upgradeToPremiumPhotos,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        syncProductToCloud,
        syncAllLocalProductsToCloud,
        trackWhatsAppClick,
        trackStoreView,
        trackProductView,
        selectedUniversity,
        setSelectedUniversity,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        filterVerifiedOnly,
        setFilterVerifiedOnly,
        filterDeliversOnly,
        setFilterDeliversOnly,
        filterTradesOnly,
        setFilterTradesOnly,
        filterFeaturedOnly,
        setFilterFeaturedOnly,
        reports,
        submitReport,
        updateReportStatus,
        analyticsEvents,
        totalWhatsAppClicks,
        totalRevenue,
        isTermsOpen,
        setIsTermsOpen,
        openTerms,
        closeTerms,
        appwriteConfig,
        updateAppwriteConfig,
        testAppwrite,
        syncWithAppwrite,
        isAppwriteLive,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};
