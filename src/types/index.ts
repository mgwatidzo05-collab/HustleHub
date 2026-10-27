export type UserRole = 'customer' | 'business' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  university: string;
  avatar?: string;
  phone?: string;
  createdAt: string;
  storeId?: string;
}

export type StoreCategory = 
  | 'textbooks'
  | 'electronics'
  | 'dorm'
  | 'barber'
  | 'nail_tech'
  | 'laundry'
  | 'printing'
  | 'tutoring'
  | 'clothing'
  | 'food_snacks'
  | 'repairs'
  | 'other_service';

export interface Store {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  password?: string; // Store owner password for sign in
  name: string;
  tagline: string;
  description: string;
  category: StoreCategory;
  university: string;
  location: string; // e.g. "Hall 1, Room 22", "NUST Library Quad", "Faculty of Applied Science"
  delivers: boolean;
  deliveryNotes?: string;
  whatsappNumber: string; // e.g. "+263771234567"
  whatsappClicks: number;
  profileViews: number;
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'unverified';
  verificationRequested?: boolean; // Store requested verification tick badge
  verificationRequestDate?: string;
  isFrozen: boolean;
  freezeReason?: string;
  isFeatured: boolean; // Paid for home page featured spotlight
  featuredUntil?: string;
  featuredRequested?: boolean; // Store requested feature upgrade (admin must approve)
  featuredRequestDate?: string;
  hasPremiumLimit: boolean; // Paid for extra product and multi-photo uploads
  premiumRequested?: boolean; // Store requested premium photos/unlimited tier (admin must approve)
  premiumRequestDate?: string;
  logoUrl: string;
  bannerUrl?: string;
  createdAt: string;
  rating: number;
  reviewCount: number;
}

export type ProductCondition = 'brand_new' | 'like_new' | 'good' | 'fair' | 'service';

export interface Product {
  id: string;
  storeId: string;
  storeName: string;
  storeWhatsApp: string;
  storeLocation: string;
  storeIsVerified: boolean;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: StoreCategory;
  isService: boolean;
  condition: ProductCondition;
  isTradeable: boolean; // open to trade / swap
  tradePreference?: string;
  images: string[];
  inStock: boolean;
  views: number;
  whatsappInquiries: number;
  createdAt: string;
  appwriteDocId?: string;
  isSyncedToCloud?: boolean;
  cloudSyncError?: string;
}

export interface ReportedContent {
  id: string;
  targetType: 'store' | 'product';
  targetId: string;
  targetTitle: string;
  storeName?: string;
  reason: 'scam' | 'inappropriate' | 'not_a_student' | 'counterfeit' | 'wrong_contact' | 'other';
  details: string;
  reporterEmail: string;
  createdAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface AnalyticsEvent {
  id: string;
  type: 'whatsapp_click' | 'store_view' | 'product_view' | 'feature_purchase' | 'premium_purchase';
  storeId: string;
  storeName: string;
  productId?: string;
  productTitle?: string;
  timestamp: string;
  amount?: number; // for paid promotions
}

export interface PremiumRequest {
  id: string;
  storeId: string;
  storeName: string;
  ownerId: string;
  ownerEmail: string;
  type: 'featured' | 'premium';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  notes?: string;
}

export interface Subscription {
  id: string;
  storeId: string;
  storeName: string;
  ownerId: string;
  plan: 'featured' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  amount: number;
  startDate: string;
  endDate?: string;
}

export interface AppwriteNotification {
  id: string;
  title: string;
  message: string;
  type: 'new_product' | 'premium_approved' | 'featured_approved' | 'system';
  userId?: string; // target user ID or 'all'
  storeId?: string;
  productId?: string;
  isRead: boolean;
  createdAt: string;
  badgeCount?: number;
}

export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  bucketId: string;
  storesCollectionId?: string;
  productsCollectionId?: string;
  reportsCollectionId?: string;
  eventsCollectionId?: string;
  premiumRequestsCollectionId?: string;
  subscriptionsCollectionId?: string;
  notificationsCollectionId?: string;
  cloudFunctionId?: string;
  fcmProviderId?: string;
  fcmToken?: string;
  pushNotificationsEnabled?: boolean;
  isConfigured: boolean;
}

