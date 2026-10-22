import { Client, Account, Databases, Storage, ID, Query, OAuthProvider, Permission, Role } from 'appwrite';
import { AppwriteConfig, Store, Product, ReportedContent, AnalyticsEvent } from '../types';

const STORAGE_KEY_APPWRITE = 'hustlehub_appwrite_config';

// Default Appwrite configuration (can be driven by Vite env variables or localStorage)
export const defaultAppwriteConfig: AppwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '6ad9477c0031111e1c1c',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'hustlehub_db',
  bucketId: import.meta.env.VITE_APPWRITE_BUCKET_ID || 'hustlehub_assets',
  storesCollectionId: import.meta.env.VITE_APPWRITE_STORES_COLLECTION_ID || 'stores',
  productsCollectionId: import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || 'products',
  reportsCollectionId: import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID || 'reports',
  eventsCollectionId: import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID || 'analytics_events',
  isConfigured: true,
};

export const getStoredAppwriteConfig = (): AppwriteConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPWRITE);
    if (raw) {
      const parsed = JSON.parse(raw);
      const config = { ...defaultAppwriteConfig, ...parsed };
      // Never allow blank values in localStorage to wipe out working Appwrite defaults
      if (!config.projectId || typeof config.projectId !== 'string' || !config.projectId.trim()) {
        config.projectId = defaultAppwriteConfig.projectId;
      }
      if (!config.databaseId || typeof config.databaseId !== 'string' || !config.databaseId.trim()) {
        config.databaseId = defaultAppwriteConfig.databaseId;
      }
      if (!config.endpoint || typeof config.endpoint !== 'string' || !config.endpoint.trim()) {
        config.endpoint = defaultAppwriteConfig.endpoint;
      }
      config.isConfigured = Boolean(config.projectId);
      return config;
    }
  } catch (err) {
    console.error('Failed to read appwrite config from localStorage', err);
  }
  return defaultAppwriteConfig;
};

export const saveStoredAppwriteConfig = (config: AppwriteConfig): void => {
  localStorage.setItem(STORAGE_KEY_APPWRITE, JSON.stringify(config));
  // Re-initialize with new config
  initAppwrite(config);
};

let clientInstance: Client | null = null;
let accountInstance: Account | null = null;
let databasesInstance: Databases | null = null;
let storageInstance: Storage | null = null;

export const initAppwrite = (config = getStoredAppwriteConfig()) => {
  if (!config.projectId) {
    clientInstance = null;
    accountInstance = null;
    databasesInstance = null;
    storageInstance = null;
    return null;
  }

  try {
    const client = new Client();
    client
      .setEndpoint(config.endpoint || 'https://cloud.appwrite.io/v1')
      .setProject(config.projectId);

    clientInstance = client;
    accountInstance = new Account(client);
    databasesInstance = new Databases(client);
    storageInstance = new Storage(client);

    return { client, account: accountInstance, databases: databasesInstance, storage: storageInstance };
  } catch (err) {
    console.error('Failed to init Appwrite client:', err);
    return null;
  }
};

// Initialize on load
initAppwrite();

export const getAppwrite = () => {
  if (!clientInstance) {
    initAppwrite();
  }
  return {
    client: clientInstance,
    account: accountInstance,
    databases: databasesInstance,
    storage: storageInstance,
    ID,
    OAuthProvider,
  };
};

/**
 * Upload an image file to Appwrite Storage bucket if configured,
 * otherwise safely returns a local DataURL for instant offline & demo functionality.
 */
export const uploadImageToStorage = async (file: File): Promise<string> => {
  const config = getStoredAppwriteConfig();
  const { storage } = getAppwrite();

  if (storage && config.projectId && config.bucketId) {
    try {
      const fileId = ID.unique();
      const response = await storage.createFile(config.bucketId, fileId, file);
      // Generate Appwrite View URL
      const fileUrl = `${config.endpoint}/storage/buckets/${config.bucketId}/files/${response.$id}/view?project=${config.projectId}`;
      return fileUrl;
    } catch (error) {
      console.warn('Appwrite upload failed, falling back to local object storage', error);
    }
  }

  // Fallback to data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Trigger Appwrite OAuth login with Google or other built-in providers
 */
export const triggerAppwriteOAuth = async (provider: 'google' | 'github' = 'google') => {
  const { account } = getAppwrite();
  const config = getStoredAppwriteConfig();

  if (!account || !config.projectId) {
    throw new Error('Please configure your Appwrite Project ID in Settings first.');
  }

  const successUrl = window.location.origin + '?oauth_success=1';
  const failureUrl = window.location.origin + '?oauth_error=1';

  const oauthProvider = provider === 'github' ? OAuthProvider.Github : OAuthProvider.Google;
  account.createOAuth2Session(oauthProvider, successUrl, failureUrl);
};

/**
 * Test connectivity with Appwrite endpoint & project
 */
export const testAppwriteConnection = async (endpoint: string, projectId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const testClient = new Client().setEndpoint(endpoint).setProject(projectId);
    const testAccount = new Account(testClient);
    try {
      await testAccount.get();
      return { success: true, message: 'Connected to Appwrite! Authenticated session detected.' };
    } catch (accError: any) {
      // 401 means project exists and API endpoint is reachable, just no active session
      if (
        accError?.code === 401 ||
        accError?.status === 401 ||
        accError?.message?.includes('unauthorized') ||
        accError?.message?.includes('User (role: guests)') ||
        accError?.type === 'general_unauthorized_scope'
      ) {
        return { success: true, message: 'Successfully reached Appwrite project! API connection verified.' };
      }
      return { success: false, message: accError?.message || 'Failed to verify project' };
    }
  } catch (error: any) {
    return { success: false, message: error?.message || 'Could not connect to Appwrite' };
  }
};

/**
 * Database Document Helpers - Realtime Cloud Sync
 */

// Helper to sanitize document payload for Appwrite
export const cleanPayload = (obj: Record<string, any>) => {
  const clean: Record<string, any> = {};
  const ignoredKeys = new Set([
    '$id',
    '$createdAt',
    '$updatedAt',
    '$permissions',
    '$databaseId',
    '$collectionId',
    'appwriteDocId',
    'isSyncedToCloud',
    'cloudSyncError',
  ]);

  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined && !ignoredKeys.has(key)) {
      clean[key] = val;
    }
  }
  return clean;
};

/**
 * Resilient Document Creator
 * Automatically adapts payload structure, types, attribute names, and permissions
 * based on the exact collection schema configured in the user's Appwrite project.
 */
export const resilientCreateDocument = async (
  databaseId: string,
  collectionId: string,
  docId: string,
  initialPayload: Record<string, any>
): Promise<{ success: boolean; error?: string; doc?: any }> => {
  const { databases } = getAppwrite();
  if (!databases) {
    return { success: false, error: 'Appwrite client is not initialized.' };
  }

  let payload = cleanPayload(initialPayload);

  // Standard permissions for collections with Document Security enabled
  const standardPermissions = [
    Permission.read(Role.any()),
    Permission.write(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any()),
  ];

  let usePermissions = false;
  let triedPermissions = false;
  let lastError = '';
  const prohibitedAttrs = new Set<string>();

  // Ensure safe document ID (Appwrite requires: <=36 chars, alphanumeric, cannot start with leading special char)
  let safeDocId = (docId || ID.unique())
    .replace(/^[^a-zA-Z0-9]+/, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 36);

  if (!safeDocId || safeDocId.length < 3) {
    safeDocId = ID.unique();
  }

  // Adaptive creation loop (handles attribute rejections, type differences, permission differences)
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      const perms = usePermissions ? standardPermissions : undefined;
      const res = await databases.createDocument(
        databaseId,
        collectionId,
        safeDocId,
        payload,
        perms
      );
      return { success: true, doc: res };
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      lastError = msg;
      console.warn(`Appwrite createDocument in "${collectionId}" attempt ${attempt + 1} rejected:`, msg);

      // Check 1: Document security / permissions mismatch
      if (
        msg.toLowerCase().includes('permissions must not be set') ||
        msg.toLowerCase().includes('document security is disabled')
      ) {
        usePermissions = false;
        triedPermissions = true;
        continue;
      }
      if (
        !usePermissions &&
        !triedPermissions &&
        (msg.toLowerCase().includes('permission denied') ||
          msg.toLowerCase().includes('unauthorized') ||
          msg.toLowerCase().includes('user (role: guests) missing scope') ||
          msg.toLowerCase().includes('missing scope (documents.write)'))
      ) {
        usePermissions = true;
        triedPermissions = true;
        continue;
      }

      // Check 2: Document ID already exists or invalid
      if (
        msg.toLowerCase().includes('document_already_exists') ||
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('document id')
      ) {
        safeDocId = ID.unique();
        continue;
      }

      // Check 3: Unknown or prohibited attribute
      // Catches: 'Invalid document structure: Unknown attribute: "storeWhatsApp"',
      //          'Attribute "xyz" is not allowed', 'Prohibited attribute: "xyz"', etc.
      const unknownMatch =
        msg.match(/unknown attribute:\s*["']?([a-zA-Z0-9_]+)["']?/i) ||
        msg.match(/attribute\s+["']?([a-zA-Z0-9_]+)["']?\s+is not allowed/i) ||
        msg.match(/prohibited attribute:\s*["']?([a-zA-Z0-9_]+)["']?/i) ||
        msg.match(/attribute_not_found.*?([a-zA-Z0-9_]+)/i);

      if (unknownMatch && unknownMatch[1]) {
        const attrName = unknownMatch[1];
        prohibitedAttrs.add(attrName);
        delete payload[attrName];

        // If images attribute was rejected, try fallback attribute names like imageUrl or image
        if (attrName === 'images' && !prohibitedAttrs.has('imageUrl') && initialPayload.images) {
          const firstImg = Array.isArray(initialPayload.images) ? initialPayload.images[0] : String(initialPayload.images);
          payload.imageUrl = firstImg;
        } else if (attrName === 'imageUrl' && !prohibitedAttrs.has('image') && initialPayload.images) {
          const firstImg = Array.isArray(initialPayload.images) ? initialPayload.images[0] : String(initialPayload.images);
          payload.image = firstImg;
        }

        // If camelCase was rejected, check if lowercase exists in initialPayload
        const lowerName = attrName.toLowerCase();
        if (lowerName !== attrName && initialPayload[lowerName] !== undefined && !prohibitedAttrs.has(lowerName)) {
          payload[lowerName] = initialPayload[lowerName];
        }

        continue;
      }

      // Check 4: Missing required attribute
      // Catches: 'Invalid document structure: Missing required attribute "storewhatsapp"'
      const requiredMatch =
        msg.match(/missing required attribute\s+["']?([a-zA-Z0-9_]+)["']?/i) ||
        msg.match(/attribute\s+["']?([a-zA-Z0-9_]+)["']?\s+is required/i);

      if (requiredMatch && requiredMatch[1]) {
        const reqAttr = requiredMatch[1];
        // Search in initialPayload case-insensitively or via snake_case
        const existingKey = Object.keys(initialPayload).find(
          k => k.toLowerCase() === reqAttr.toLowerCase() ||
               k.toLowerCase().replace(/_/g, '') === reqAttr.toLowerCase().replace(/_/g, '')
        );

        if (existingKey && initialPayload[existingKey] !== undefined) {
          payload[reqAttr] = initialPayload[existingKey];
        } else if (reqAttr.toLowerCase().includes('whatsapp')) {
          payload[reqAttr] = initialPayload.storeWhatsApp || initialPayload.whatsappNumber || '+263000000000';
        } else if (reqAttr.toLowerCase().includes('store')) {
          payload[reqAttr] = initialPayload.storeId || initialPayload.storeName || '';
        } else if (reqAttr.toLowerCase().includes('image')) {
          const firstImg = Array.isArray(initialPayload.images) ? initialPayload.images[0] : String(initialPayload.images || '');
          payload[reqAttr] = firstImg;
        } else {
          payload[reqAttr] = '';
        }
        continue;
      }

      // Check 5: Images type mismatch (array vs string, or invalid type)
      if (
        msg.toLowerCase().includes('images') ||
        msg.toLowerCase().includes('imageurl') ||
        msg.toLowerCase().includes('image')
      ) {
        if (Array.isArray(payload.images)) {
          // Schema expects single string, not array
          payload.images = payload.images[0] || '';
          continue;
        } else if (typeof payload.images === 'string' && msg.toLowerCase().includes('array')) {
          // Schema expects array
          payload.images = [payload.images].filter(Boolean);
          continue;
        }
      }

      // Check 6: Price type mismatch (float vs integer vs string)
      if (msg.toLowerCase().includes('price') && msg.toLowerCase().includes('type')) {
        if (msg.toLowerCase().includes('integer')) {
          payload.price = Math.round(Number(payload.price) || 0);
        } else if (msg.toLowerCase().includes('string')) {
          payload.price = String(payload.price);
        } else {
          payload.price = Number(payload.price) || 0;
        }
        continue;
      }

      // Check 7: String size limit exceeded
      const sizeMatch = msg.match(/attribute\s+["']?([a-zA-Z0-9_]+)["']?.*?shorter than\s+(\d+)/i);
      if (sizeMatch && sizeMatch[1] && sizeMatch[2]) {
        const attrName = sizeMatch[1];
        const maxLen = parseInt(sizeMatch[2], 10);
        if (typeof payload[attrName] === 'string') {
          payload[attrName] = payload[attrName].slice(0, maxLen);
          continue;
        }
      }

      // Check 8: Strip non-essential optional fields on later attempts
      if (attempt === 4) {
        delete payload.id;
        delete payload.createdAt;
        delete payload.updatedAt;
        delete payload.views;
        delete payload.whatsappInquiries;
        delete payload.inStock;
        delete payload.isService;
        delete payload.isTradeable;
        delete payload.tradePreference;
        continue;
      }

      if (attempt === 8) {
        delete payload.storeLocation;
        delete payload.storeIsVerified;
        delete payload.condition;
        delete payload.currency;
        continue;
      }

      // If cannot parse specific error, break to return error
      break;
    }
  }

  // Provide clear instructions if permission failed
  if (
    lastError.toLowerCase().includes('missing scope (documents.write)') ||
    lastError.toLowerCase().includes('unauthorized') ||
    lastError.toLowerCase().includes('permission denied')
  ) {
    return {
      success: false,
      error: `Appwrite Permission Error: The "${collectionId}" collection does not allow guests to write. In Appwrite Console > Database > "${collectionId}" > Settings > Permissions, add Role: Any with Create, Read, Update permissions.`,
    };
  }

  return { success: false, error: lastError || 'Failed to create document in Appwrite' };
};

export const fetchStoresFromAppwrite = async (): Promise<Store[] | null> => {
  const config = getStoredAppwriteConfig();
  const { databases } = getAppwrite();
  if (!databases || !config.projectId || !config.databaseId) return null;

  try {
    const collId = config.storesCollectionId || 'stores';
    let res;
    try {
      res = await databases.listDocuments(config.databaseId, collId, [
        Query.limit(100),
        Query.orderDesc('$createdAt'),
      ]);
    } catch {
      // Fallback without sort query in case index on $createdAt does not exist
      res = await databases.listDocuments(config.databaseId, collId, [
        Query.limit(100),
      ]);
    }

    return res.documents.map((doc: any) => ({
      id: doc.id || doc.$id,
      ownerId: doc.ownerId || '',
      ownerName: doc.ownerName || '',
      ownerEmail: doc.ownerEmail || '',
      password: doc.password || '',
      name: doc.name || '',
      tagline: doc.tagline || '',
      description: doc.description || '',
      category: doc.category || 'other_service',
      university: doc.university || 'NUST',
      location: doc.location || '',
      delivers: Boolean(doc.delivers),
      deliveryNotes: doc.deliveryNotes || '',
      whatsappNumber: doc.whatsappNumber || '',
      whatsappClicks: Number(doc.whatsappClicks) || 0,
      profileViews: Number(doc.profileViews) || 0,
      isVerified: doc.isVerified !== undefined ? Boolean(doc.isVerified) : true,
      verificationStatus: doc.verificationStatus || 'verified',
      isFrozen: Boolean(doc.isFrozen),
      freezeReason: doc.freezeReason || '',
      isFeatured: Boolean(doc.isFeatured),
      featuredUntil: doc.featuredUntil || '',
      featuredRequested: Boolean(doc.featuredRequested),
      featuredRequestDate: doc.featuredRequestDate || '',
      hasPremiumLimit: Boolean(doc.hasPremiumLimit),
      premiumRequested: Boolean(doc.premiumRequested),
      premiumRequestDate: doc.premiumRequestDate || '',
      logoUrl: doc.logoUrl || '',
      bannerUrl: doc.bannerUrl || '',
      createdAt: doc.createdAt || doc.$createdAt || new Date().toISOString(),
      rating: doc.rating !== undefined ? Number(doc.rating) : 5.0,
      reviewCount: Number(doc.reviewCount) || 0,
    })) as Store[];
  } catch (err: any) {
    console.warn('Appwrite fetchStoresFromAppwrite error:', err?.message || err);
    return null;
  }
};

export const fetchProductsFromAppwrite = async (): Promise<Product[] | null> => {
  const config = getStoredAppwriteConfig();
  const { databases } = getAppwrite();
  if (!databases || !config.projectId || !config.databaseId) return null;

  try {
    const collId = config.productsCollectionId || 'products';
    let res;
    try {
      res = await databases.listDocuments(config.databaseId, collId, [
        Query.limit(100),
        Query.orderDesc('$createdAt'),
      ]);
    } catch {
      // Fallback without sort query in case index on $createdAt does not exist
      res = await databases.listDocuments(config.databaseId, collId, [
        Query.limit(100),
      ]);
    }

    return res.documents.map((doc: any) => {
      // Parse images flexibly: array, JSON string, or single string
      let parsedImages: string[] = [];
      if (Array.isArray(doc.images)) {
        parsedImages = doc.images.filter(Boolean);
      } else if (typeof doc.images === 'string' && doc.images.trim()) {
        const raw = doc.images.trim();
        if (raw.startsWith('[') && raw.endsWith(']')) {
          try {
            parsedImages = JSON.parse(raw);
          } catch {
            parsedImages = [raw];
          }
        } else {
          parsedImages = [raw];
        }
      } else if (doc.imageUrl) {
        parsedImages = [doc.imageUrl];
      } else if (doc.image) {
        parsedImages = [doc.image];
      }

      return {
        id: doc.id || doc.$id,
        appwriteDocId: doc.$id,
        isSyncedToCloud: true,
        storeId: doc.storeId || doc.store_id || '',
        storeName: doc.storeName || doc.store_name || '',
        storeWhatsApp: doc.storeWhatsApp || doc.storewhatsapp || doc.store_whatsapp || doc.whatsapp || '',
        storeLocation: doc.storeLocation || doc.store_location || doc.location || '',
        storeIsVerified: doc.storeIsVerified !== undefined ? Boolean(doc.storeIsVerified) : (doc.store_is_verified !== undefined ? Boolean(doc.store_is_verified) : true),
        title: doc.title || '',
        description: doc.description || '',
        price: Number(doc.price) || 0,
        currency: doc.currency || '$',
        category: doc.category || 'other_service',
        isService: Boolean(doc.isService !== undefined ? doc.isService : doc.is_service),
        condition: doc.condition || 'good',
        isTradeable: Boolean(doc.isTradeable !== undefined ? doc.isTradeable : doc.is_tradeable),
        tradePreference: doc.tradePreference || doc.trade_preference || '',
        images: parsedImages.length > 0 ? parsedImages : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
        inStock: doc.inStock !== undefined ? Boolean(doc.inStock) : (doc.in_stock !== undefined ? Boolean(doc.in_stock) : true),
        views: Number(doc.views) || 0,
        whatsappInquiries: Number(doc.whatsappInquiries || doc.whatsapp_inquiries) || 0,
        createdAt: doc.createdAt || doc.created_at || doc.$createdAt || new Date().toISOString(),
      } as Product;
    });
  } catch (err: any) {
    console.warn('Appwrite fetchProductsFromAppwrite error:', err?.message || err);
    return null;
  }
};

export const createStoreInAppwrite = async (store: Store): Promise<{ success: boolean; error?: string; docId?: string }> => {
  const config = getStoredAppwriteConfig();
  const { databases } = getAppwrite();
  if (!databases || !config.projectId || !config.databaseId) {
    return { success: false, error: 'Appwrite not configured' };
  }

  const collId = config.storesCollectionId || 'stores';
  const initialPayload: Record<string, any> = {
    ownerId: store.ownerId,
    ownerName: store.ownerName,
    ownerEmail: store.ownerEmail,
    password: store.password || '',
    name: store.name,
    tagline: store.tagline || '',
    description: store.description || '',
    category: store.category || 'other_service',
    university: store.university || 'NUST',
    location: store.location || '',
    delivers: Boolean(store.delivers),
    deliveryNotes: store.deliveryNotes || '',
    whatsappNumber: store.whatsappNumber || '',
    whatsappClicks: Number(store.whatsappClicks) || 0,
    profileViews: Number(store.profileViews) || 0,
    isVerified: store.isVerified !== undefined ? Boolean(store.isVerified) : true,
    verificationStatus: store.verificationStatus || 'verified',
    isFrozen: Boolean(store.isFrozen),
    freezeReason: store.freezeReason || '',
    isFeatured: Boolean(store.isFeatured),
    featuredUntil: store.featuredUntil || '',
    featuredRequested: Boolean(store.featuredRequested),
    hasPremiumLimit: Boolean(store.hasPremiumLimit),
    premiumRequested: Boolean(store.premiumRequested),
    logoUrl: store.logoUrl || '',
    bannerUrl: store.bannerUrl || '',
    rating: Number(store.rating) || 5.0,
    reviewCount: Number(store.reviewCount) || 0,
  };

  const result = await resilientCreateDocument(config.databaseId, collId, store.id, initialPayload);
  return {
    success: result.success,
    error: result.error,
    docId: result.doc?.$id,
  };
};

export const updateStoreInAppwrite = async (storeId: string, updates: Partial<Store>): Promise<void> => {
  const config = getStoredAppwriteConfig();
  const { databases } = getAppwrite();
  if (!databases || !config.projectId || !config.databaseId) return;

  try {
    const collId = config.storesCollectionId || 'stores';
    await databases.updateDocument(
      config.databaseId,
      collId,
      storeId.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36),
      cleanPayload(updates)
    );
  } catch (err) {
    console.warn('Failed to sync store update to Appwrite:', err);
  }
};

export const deleteStoreInAppwrite = async (storeId: string): Promise<void> => {
  const config = getStoredAppwriteConfig();
  const { databases } = getAppwrite();
  if (!databases || !config.projectId || !config.databaseId) return;

  try {
    const collId = config.storesCollectionId || 'stores';
    await databases.deleteDocument(
      config.databaseId,
      collId,
      storeId.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36)
    );
  } catch (err) {
    console.warn('Failed to sync store deletion to Appwrite:', err);
  }
};

export const createProductInAppwrite = async (product: Product): Promise<{ success: boolean; error?: string; docId?: string }> => {
  const config = getStoredAppwriteConfig();
  const { databases } = getAppwrite();
  if (!databases || !config.projectId || !config.databaseId) {
    return { success: false, error: 'Appwrite is not configured with Project ID and Database ID.' };
  }

  const collId = config.productsCollectionId || 'products';

  // Ensure image array has at least one valid image
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'];

  // Ensure whatsapp number is available from product or store cache
  let whatsapp = product.storeWhatsApp || '';
  if (!whatsapp && typeof localStorage !== 'undefined') {
    try {
      const rawStores = localStorage.getItem('hustlehub_stores_live');
      if (rawStores) {
        const parsed = JSON.parse(rawStores);
        const matchStore = parsed.find((s: any) => s.id === product.storeId || s.name === product.storeName);
        if (matchStore && matchStore.whatsappNumber) {
          whatsapp = matchStore.whatsappNumber;
        }
      }
    } catch {}
  }
  if (!whatsapp) {
    whatsapp = '+263712016200';
  }

  const initialPayload: Record<string, any> = {
    id: product.id,
    storeId: product.storeId,
    storeName: product.storeName || '',
    storewhatsapp: whatsapp, // Appwrite products table column
    storeWhatsApp: whatsapp, // Fallback camelCase
    store_whatsapp: whatsapp, // Fallback snake_case
    storeLocation: product.storeLocation || 'Campus',
    storeIsVerified: product.storeIsVerified !== undefined ? Boolean(product.storeIsVerified) : true,
    title: product.title,
    description: product.description || '',
    price: Number(product.price) || 0,
    currency: product.currency || '$',
    category: product.category || 'clothing',
    isService: Boolean(product.isService),
    condition: product.condition || 'good',
    isTradeable: Boolean(product.isTradeable),
    tradePreference: product.tradePreference || '',
    images: images,
    inStock: product.inStock !== undefined ? Boolean(product.inStock) : true,
    views: Number(product.views) || 0,
    whatsappInquiries: Number(product.whatsappInquiries) || 0,
  };

  const result = await resilientCreateDocument(config.databaseId, collId, product.id, initialPayload);
  return {
    success: result.success,
    error: result.error,
    docId: result.doc?.$id,
  };
};

export const updateProductInAppwrite = async (productId: string, updates: Partial<Product>): Promise<void> => {
  const config = getStoredAppwriteConfig();
  const { databases } = getAppwrite();
  if (!databases || !config.projectId || !config.databaseId) return;

  try {
    const collId = config.productsCollectionId || 'products';
    await databases.updateDocument(
      config.databaseId,
      collId,
      productId.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36),
      cleanPayload(updates)
    );
  } catch (err) {
    console.warn('Failed to sync product update to Appwrite:', err);
  }
};

export const deleteProductInAppwrite = async (productId: string): Promise<void> => {
  const config = getStoredAppwriteConfig();
  const { databases } = getAppwrite();
  if (!databases || !config.projectId || !config.databaseId) return;

  try {
    const collId = config.productsCollectionId || 'products';
    await databases.deleteDocument(
      config.databaseId,
      collId,
      productId.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36)
    );
  } catch (err) {
    console.warn('Failed to sync product deletion to Appwrite:', err);
  }
};

export const createReportInAppwrite = async (report: ReportedContent): Promise<void> => {
  const config = getStoredAppwriteConfig();
  const { databases } = getAppwrite();
  if (!databases || !config.projectId || !config.databaseId) return;

  try {
    const collId = config.reportsCollectionId || 'reports';
    await databases.createDocument(
      config.databaseId,
      collId,
      (report.id || ID.unique()).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36),
      cleanPayload(report)
    );
  } catch (err) {
    console.warn('Failed to sync report to Appwrite:', err);
  }
};

export const createAnalyticsEventInAppwrite = async (event: AnalyticsEvent): Promise<void> => {
  const config = getStoredAppwriteConfig();
  const { databases } = getAppwrite();
  if (!databases || !config.projectId || !config.databaseId) return;

  try {
    const collId = config.eventsCollectionId || 'analytics_events';
    await databases.createDocument(
      config.databaseId,
      collId,
      (event.id || ID.unique()).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36),
      cleanPayload(event)
    );
  } catch (err) {
    console.warn('Failed to record event to Appwrite:', err);
  }
};

/**
 * Setup Realtime Subscriptions
 * Subscribes to changes on stores and products in Appwrite so all connected devices update live!
 */
export const subscribeToMarketplaceRealtime = (callbacks: {
  onStoreChange?: (payload?: any) => void;
  onProductChange?: (payload?: any) => void;
  onReportChange?: (payload?: any) => void;
}): (() => void) => {
  const config = getStoredAppwriteConfig();
  const { client } = getAppwrite();
  if (!client || !config.projectId || !config.databaseId) {
    return () => {};
  }

  try {
    const storesColl = config.storesCollectionId || 'stores';
    const productsColl = config.productsCollectionId || 'products';
    const reportsColl = config.reportsCollectionId || 'reports';

    const storesChannel = `databases.${config.databaseId}.collections.${storesColl}.documents`;
    const productsChannel = `databases.${config.databaseId}.collections.${productsColl}.documents`;
    const reportsChannel = `databases.${config.databaseId}.collections.${reportsColl}.documents`;

    const unsubscribe = client.subscribe(
      [storesChannel, productsChannel, reportsChannel],
      (response) => {
        const events = response.events || [];
        const isStore = events.some((e: string) => e.includes(storesColl) || e.includes('stores'));
        const isProduct = events.some((e: string) => e.includes(productsColl) || e.includes('products'));
        const isReport = events.some((e: string) => e.includes(reportsColl) || e.includes('reports'));

        if (isStore && callbacks.onStoreChange) callbacks.onStoreChange(response.payload);
        if (isProduct && callbacks.onProductChange) callbacks.onProductChange(response.payload);
        if (isReport && callbacks.onReportChange) callbacks.onReportChange(response.payload);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return () => {};
  }
};
