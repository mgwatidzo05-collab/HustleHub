import { Client, Account, Databases, Storage, ID, Query, OAuthProvider, Permission, Role } from 'appwrite';
import { AppwriteConfig, Store, Product, ReportedContent, AnalyticsEvent } from '../types';

const STORAGE_KEY_APPWRITE = 'hustlehub_appwrite_config';

// Default Appwrite configuration (can be driven by Vite env variables or localStorage)
export const defaultAppwriteConfig: AppwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'hustlehub_db',
  bucketId: import.meta.env.VITE_APPWRITE_BUCKET_ID || 'hustlehub_assets',
  storesCollectionId: import.meta.env.VITE_APPWRITE_STORES_COLLECTION_ID || 'stores',
  productsCollectionId: import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || 'products',
  reportsCollectionId: import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID || 'reports',
  eventsCollectionId: import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID || 'analytics_events',
  isConfigured: Boolean(import.meta.env.VITE_APPWRITE_PROJECT_ID),
};

export const getStoredAppwriteConfig = (): AppwriteConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPWRITE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultAppwriteConfig, ...parsed };
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
  for (let attempt = 0; attempt < 30; attempt++) {
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

      // Check 3: Prohibited attribute ("Attribute 'xyz' is not allowed")
      const prohibitedMatch =
        msg.match(/attribute\s+["']?([a-zA-Z0-9_]+)["']?\s+is not allowed/i) ||
        msg.match(/prohibited attribute\s*[:]?\s*["']?([a-zA-Z0-9_]+)["']?/i) ||
        msg.match(/unknown attribute\s*[:]?\s*["']?([a-zA-Z0-9_]+)["']?/i) ||
        msg.match(/attribute_not_found.*?([a-zA-Z0-9_]+)/i) ||
        msg.match(/invalid document structure.*?attribute\s+["']?([a-zA-Z0-9_]+)["']?/i);

      if (prohibitedMatch && prohibitedMatch[1]) {
        const attrName = prohibitedMatch[1];
        prohibitedAttrs.add(attrName);
        delete payload[attrName];

        const lowerAttr = attrName.toLowerCase().replace(/[^a-z0-9]/g, '');

        // If camelCase was rejected, try lowercase alternate; if lowercase was rejected, try camelCase alternate
        const alternateKey = attrName === lowerAttr
          ? Object.keys(initialPayload).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === lowerAttr && k !== attrName)
          : lowerAttr;

        if (alternateKey && !prohibitedAttrs.has(alternateKey)) {
          for (const [k, v] of Object.entries(initialPayload)) {
            if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === lowerAttr && v !== undefined) {
              payload[alternateKey] = v;
              break;
            }
          }
        }

        // If images attribute was rejected, try fallback attribute names like imageUrl, imageurl, or image
        if ((lowerAttr === 'images' || lowerAttr === 'imageurl') && initialPayload.images) {
          const firstImg = Array.isArray(initialPayload.images) ? initialPayload.images[0] : String(initialPayload.images);
          if (!prohibitedAttrs.has('imageUrl')) payload.imageUrl = firstImg;
          else if (!prohibitedAttrs.has('imageurl')) payload.imageurl = firstImg;
          else if (!prohibitedAttrs.has('image')) payload.image = firstImg;
        }

        continue;
      }

      // Check 3B: Missing required attribute ("missing required attribute 'xyz'")
      const requiredMatch =
        msg.match(/missing required attribute\s*[:]?\s*["']?([a-zA-Z0-9_]+)["']?/i) ||
        msg.match(/attribute\s+["']?([a-zA-Z0-9_]+)["']?\s+(?:is required|is missing|cannot be empty)/i) ||
        msg.match(/required attribute\s*[:]?\s*["']?([a-zA-Z0-9_]+)["']?/i) ||
        msg.match(/attribute_required.*?([a-zA-Z0-9_]+)/i);

      if (requiredMatch && requiredMatch[1]) {
        const reqAttr = requiredMatch[1];
        const lowerReq = reqAttr.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Search in initialPayload case-insensitively
        let foundVal: any = undefined;
        for (const [k, v] of Object.entries(initialPayload)) {
          if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === lowerReq && v !== undefined) {
            foundVal = v;
            break;
          }
        }

        // Semantic field fallbacks
        if (foundVal === undefined) {
          if (lowerReq.includes('store') && lowerReq.includes('id')) {
            foundVal = initialPayload.storeId || initialPayload.storeid || '';
          } else if (lowerReq.includes('whatsapp') || lowerReq.includes('phone')) {
            foundVal = initialPayload.storewhatsapp || initialPayload.storeWhatsApp || initialPayload.whatsappNumber || initialPayload.whatsapp || '';
          } else if (lowerReq.includes('image') || lowerReq.includes('photo')) {
            foundVal = Array.isArray(initialPayload.images) ? initialPayload.images[0] : (initialPayload.images || '');
          } else if (lowerReq.includes('name') && lowerReq.includes('store')) {
            foundVal = initialPayload.storeName || initialPayload.storename || '';
          } else if (lowerReq.includes('title') || lowerReq.includes('name')) {
            foundVal = initialPayload.title || initialPayload.name || '';
          } else if (lowerReq.includes('price') || lowerReq.includes('cost')) {
            foundVal = initialPayload.price !== undefined ? initialPayload.price : 0;
          } else if (lowerReq.includes('desc')) {
            foundVal = initialPayload.description || '';
          } else if (lowerReq.includes('category')) {
            foundVal = initialPayload.category || 'other_service';
          }
        }

        if (foundVal !== undefined) {
          payload[reqAttr] = foundVal;
          // Delete any other key in payload that has the same name but different casing
          for (const k of Object.keys(payload)) {
            if (k !== reqAttr && k.toLowerCase().replace(/[^a-z0-9]/g, '') === lowerReq) {
              delete payload[k];
            }
          }
          continue;
        }
      }

      // Check 4: Images type mismatch (array vs string)
      if (
        msg.toLowerCase().includes('images') || msg.toLowerCase().includes('imageurl') || msg.toLowerCase().includes('image')
      ) {
        if (
          msg.toLowerCase().includes('expected string') ||
          msg.toLowerCase().includes('got array') ||
          msg.toLowerCase().includes('valid string') ||
          msg.toLowerCase().includes('type string')
        ) {
          // Schema expects a single string for images, not an array
          if (Array.isArray(payload.images)) {
            payload.images = payload.images[0] || '';
          }
          continue;
        } else if (
          msg.toLowerCase().includes('expected array') ||
          msg.toLowerCase().includes('got string') ||
          msg.toLowerCase().includes('valid array')
        ) {
          // Schema expects array
          if (typeof payload.images === 'string') {
            payload.images = [payload.images].filter(Boolean);
          }
          continue;
        }
      }

      // Check 5: Price type mismatch (float vs integer vs string)
      if (msg.toLowerCase().includes('price') && msg.toLowerCase().includes('type')) {
        if (msg.toLowerCase().includes('integer')) {
          payload.price = Math.round(Number(payload.price) || 0);
        } else if (msg.toLowerCase().includes('string')) {
          payload.price = String(payload.price);
        }
        continue;
      }

      // Check 6: String size limit exceeded
      const sizeMatch = msg.match(/attribute\s+["']?([a-zA-Z0-9_]+)["']?.*?shorter than\s+(\d+)/i);
      if (sizeMatch && sizeMatch[1] && sizeMatch[2]) {
        const attrName = sizeMatch[1];
        const maxLen = parseInt(sizeMatch[2], 10);
        if (typeof payload[attrName] === 'string') {
          payload[attrName] = payload[attrName].slice(0, maxLen);
          continue;
        }
      }

      // If cannot parse specific error, break to return error
      break;
    }
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
      ownerId: doc.ownerId || doc.ownerid || doc.userId || doc.userid || '',
      ownerName: doc.ownerName || doc.ownername || doc.name || '',
      ownerEmail: doc.ownerEmail || doc.owneremail || doc.email || doc.owner_email || '',
      password: doc.password || doc.pass || '',
      name: doc.name || '',
      tagline: doc.tagline || '',
      description: doc.description || doc.desc || '',
      category: doc.category || 'other_service',
      university: doc.university || 'NUST',
      location: doc.location || doc.storelocation || '',
      delivers: Boolean(doc.delivers),
      deliveryNotes: doc.deliveryNotes || doc.deliverynotes || '',
      whatsappNumber: doc.whatsappNumber || doc.whatsappnumber || doc.whatsapp || doc.phone || '',
      whatsappClicks: Number(doc.whatsappClicks ?? doc.whatsappclicks ?? 0),
      profileViews: Number(doc.profileViews ?? doc.profileviews ?? 0),
      isVerified: Boolean(doc.isVerified ?? doc.isverified ?? false),
      verificationStatus: doc.verificationStatus || doc.verificationstatus || (doc.verificationRequested || doc.verificationrequested ? 'pending' : (doc.isVerified || doc.isverified ? 'verified' : 'unverified')),
      verificationRequested: Boolean(doc.verificationRequested ?? doc.verificationrequested),
      verificationRequestDate: doc.verificationRequestDate || doc.verificationrequestdate || '',
      isFrozen: Boolean(doc.isFrozen ?? doc.isfrozen),
      freezeReason: doc.freezeReason || doc.freezereason || '',
      isFeatured: Boolean(doc.isFeatured ?? doc.isfeatured),
      featuredUntil: doc.featuredUntil || doc.featureduntil || '',
      featuredRequested: Boolean(doc.featuredRequested ?? doc.featuredrequested),
      featuredRequestDate: doc.featuredRequestDate || doc.featuredrequestdate || '',
      hasPremiumLimit: Boolean(doc.hasPremiumLimit ?? doc.haspremiumlimit),
      premiumRequested: Boolean(doc.premiumRequested ?? doc.premiumrequested),
      premiumRequestDate: doc.premiumRequestDate || doc.premiumrequestdate || '',
      logoUrl: doc.logoUrl || doc.logourl || doc.logo || '',
      bannerUrl: doc.bannerUrl || doc.bannerurl || doc.banner || '',
      createdAt: doc.createdAt || doc.createdat || doc.$createdAt || new Date().toISOString(),
      rating: doc.rating !== undefined ? Number(doc.rating) : 5.0,
      reviewCount: Number(doc.reviewCount ?? doc.reviewcount ?? 0),
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
        storeId: doc.storeId || doc.storeid || doc.store_id || '',
        storeName: doc.storeName || doc.storename || '',
        storeWhatsApp: doc.storeWhatsApp || doc.storewhatsapp || doc.whatsapp || doc.store_whatsapp || '',
        storeLocation: doc.storeLocation || doc.storelocation || '',
        storeIsVerified: doc.storeIsVerified !== undefined ? Boolean(doc.storeIsVerified) : (doc.storeisverified !== undefined ? Boolean(doc.storeisverified) : false),
        title: doc.title || doc.name || '',
        description: doc.description || doc.desc || '',
        price: Number(doc.price) || 0,
        currency: doc.currency || '$',
        category: doc.category || 'other_service',
        isService: Boolean(doc.isService ?? doc.isservice),
        condition: doc.condition || 'good',
        isTradeable: Boolean(doc.isTradeable ?? doc.istradeable),
        tradePreference: doc.tradePreference || doc.tradepreference || '',
        images: parsedImages.length > 0 ? parsedImages : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
        inStock: doc.inStock !== undefined ? Boolean(doc.inStock) : (doc.instock !== undefined ? Boolean(doc.instock) : true),
        views: Number(doc.views) || 0,
        whatsappInquiries: Number(doc.whatsappInquiries ?? doc.whatsappinquiries ?? 0),
        createdAt: doc.createdAt || doc.createdat || doc.$createdAt || new Date().toISOString(),
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
    // Both casings: ownerEmail and owneremail, password and pass
    ownerEmail: store.ownerEmail,
    owneremail: store.ownerEmail,
    email: store.ownerEmail,
    password: store.password || '',
    pass: store.password || '',
    ownerName: store.ownerName,
    ownername: store.ownerName,
    ownerId: store.ownerId,
    ownerid: store.ownerId,
    name: store.name,
    tagline: store.tagline || '',
    description: store.description || '',
    category: store.category || 'other_service',
    university: store.university || 'NUST',
    location: store.location || '',
    delivers: Boolean(store.delivers),
    deliveryNotes: store.deliveryNotes || '',
    deliverynotes: store.deliveryNotes || '',
    whatsappNumber: store.whatsappNumber || '',
    whatsappnumber: store.whatsappNumber || '',
    whatsapp: store.whatsappNumber || '',
    whatsappClicks: Number(store.whatsappClicks) || 0,
    whatsappclicks: Number(store.whatsappClicks) || 0,
    profileViews: Number(store.profileViews) || 0,
    profileviews: Number(store.profileViews) || 0,
    isVerified: Boolean(store.isVerified),
    isverified: Boolean(store.isVerified),
    verificationStatus: store.verificationStatus || 'unverified',
    verificationstatus: store.verificationStatus || 'unverified',
    verificationRequested: Boolean(store.verificationRequested),
    verificationrequested: Boolean(store.verificationRequested),
    verificationRequestDate: store.verificationRequestDate || '',
    verificationrequestdate: store.verificationRequestDate || '',
    isFrozen: Boolean(store.isFrozen),
    isfrozen: Boolean(store.isFrozen),
    freezeReason: store.freezeReason || '',
    freezereason: store.freezeReason || '',
    isFeatured: Boolean(store.isFeatured),
    isfeatured: Boolean(store.isFeatured),
    featuredUntil: store.featuredUntil || '',
    featureduntil: store.featuredUntil || '',
    featuredRequested: Boolean(store.featuredRequested),
    featuredrequested: Boolean(store.featuredRequested),
    hasPremiumLimit: Boolean(store.hasPremiumLimit),
    haspremiumlimit: Boolean(store.hasPremiumLimit),
    premiumRequested: Boolean(store.premiumRequested),
    premiumrequested: Boolean(store.premiumRequested),
    logoUrl: store.logoUrl || '',
    logourl: store.logoUrl || '',
    bannerUrl: store.bannerUrl || '',
    bannerurl: store.bannerUrl || '',
    rating: Number(store.rating) || 5.0,
    reviewCount: Number(store.reviewCount) || 0,
    reviewcount: Number(store.reviewCount) || 0,
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

  const collId = config.storesCollectionId || 'stores';
  const clean = cleanPayload(updates);
  let targetDocId = (updates as any).appwriteDocId || storeId.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36);

  // Provide dual casing aliases
  if (updates.isVerified !== undefined) {
    clean.isVerified = updates.isVerified;
    clean.isverified = updates.isVerified;
  }
  if (updates.verificationStatus !== undefined) {
    clean.verificationStatus = updates.verificationStatus;
    clean.verificationstatus = updates.verificationStatus;
  }
  if (updates.verificationRequested !== undefined) {
    clean.verificationRequested = updates.verificationRequested;
    clean.verificationrequested = updates.verificationRequested;
  }
  if (updates.featuredRequested !== undefined) {
    clean.featuredRequested = updates.featuredRequested;
    clean.featuredrequested = updates.featuredRequested;
  }
  if (updates.premiumRequested !== undefined) {
    clean.premiumRequested = updates.premiumRequested;
    clean.premiumrequested = updates.premiumRequested;
  }
  if (updates.isFeatured !== undefined) {
    clean.isFeatured = updates.isFeatured;
    clean.isfeatured = updates.isFeatured;
  }
  if (updates.hasPremiumLimit !== undefined) {
    clean.hasPremiumLimit = updates.hasPremiumLimit;
    clean.haspremiumlimit = updates.hasPremiumLimit;
  }

  // Resilient update loop: if any attribute is rejected by Appwrite schema, drop it and retry
  const payloadToUpdate = { ...clean };

  const tryUpdate = async (docIdToUse: string): Promise<boolean> => {
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        await databases.updateDocument(
          config.databaseId,
          collId,
          docIdToUse,
          payloadToUpdate
        );
        return true;
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (msg.includes('document_not_found') || msg.includes('could not be found')) {
          return false;
        }
        const prohibitedMatch =
          msg.match(/attribute\s+["']?([a-zA-Z0-9_]+)["']?\s+is not allowed/i) ||
          msg.match(/prohibited attribute\s*[:]?\s*["']?([a-zA-Z0-9_]+)["']?/i) ||
          msg.match(/unknown attribute\s*[:]?\s*["']?([a-zA-Z0-9_]+)["']?/i);

        if (prohibitedMatch && prohibitedMatch[1]) {
          delete payloadToUpdate[prohibitedMatch[1]];
          continue;
        }
        console.warn('Appwrite updateStore warning:', msg);
        break;
      }
    }
    return false;
  };

  const directSuccess = await tryUpdate(targetDocId);
  if (!directSuccess) {
    // Document not found by targetDocId - query to locate the actual document in Appwrite
    try {
      const listRes = await databases.listDocuments(config.databaseId, collId, [Query.limit(100)]);
      const match = listRes.documents.find(
        (d: any) => d.id === storeId || d.$id === storeId || (updates.name && d.name === updates.name)
      );
      if (match) {
        await tryUpdate(match.$id);
      }
    } catch (lookupErr) {
      console.warn('Lookup store document in Appwrite error:', lookupErr);
    }
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

  // User confirmed their Appwrite attributes: 'storeId' (camelCase) and 'storewhatsapp' (lowercase)
  const initialPayload: Record<string, any> = {
    title: product.title,
    description: product.description || '',
    price: Number(product.price) || 0,
    storeId: product.storeId,
    storewhatsapp: product.storeWhatsApp || '',
    category: product.category || 'other_service',
    images: images,
    condition: product.condition || 'good',
    currency: product.currency || '$',
    storeName: product.storeName || '',
    storeLocation: product.storeLocation || '',
    storeIsVerified: Boolean(product.storeIsVerified),
    inStock: product.inStock !== undefined ? Boolean(product.inStock) : true,
    views: Number(product.views) || 0,
    whatsappInquiries: Number(product.whatsappInquiries) || 0,
    isService: Boolean(product.isService),
    isTradeable: Boolean(product.isTradeable),
    tradePreference: product.tradePreference || '',
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

export const fetchReportsFromAppwrite = async (): Promise<ReportedContent[] | null> => {
  const config = getStoredAppwriteConfig();
  const { databases } = getAppwrite();
  if (!databases || !config.projectId || !config.databaseId) return null;

  try {
    const collId = config.reportsCollectionId || 'reports';
    let res;
    try {
      res = await databases.listDocuments(config.databaseId, collId, [
        Query.limit(100),
        Query.orderDesc('$createdAt'),
      ]);
    } catch {
      res = await databases.listDocuments(config.databaseId, collId, [
        Query.limit(100),
      ]);
    }

    return res.documents.map((doc: any) => ({
      id: doc.id || doc.$id,
      targetType: doc.targetType || doc.targettype || 'product',
      targetId: doc.targetId || doc.targetid || '',
      targetTitle: doc.targetTitle || doc.targettitle || 'Reported Content',
      storeName: doc.storeName || doc.storename || '',
      reason: doc.reason || 'other',
      details: doc.details || '',
      reporterEmail: doc.reporterEmail || doc.reporteremail || 'anonymous',
      createdAt: doc.createdAt || doc.createdat || doc.$createdAt || new Date().toISOString(),
      status: doc.status || 'pending',
    })) as ReportedContent[];
  } catch (err) {
    console.warn('Appwrite fetchReportsFromAppwrite error:', err);
    return null;
  }
};

export const createReportInAppwrite = async (report: ReportedContent): Promise<void> => {
  const config = getStoredAppwriteConfig();
  const { databases } = getAppwrite();
  if (!databases || !config.projectId || !config.databaseId) return;

  const collId = config.reportsCollectionId || 'reports';
  const initialPayload: Record<string, any> = {
    targetType: report.targetType,
    targettype: report.targetType,
    targetId: report.targetId,
    targetid: report.targetId,
    targetTitle: report.targetTitle,
    targettitle: report.targetTitle,
    storeName: report.storeName || '',
    storename: report.storeName || '',
    reason: report.reason,
    details: report.details,
    reporterEmail: report.reporterEmail || '',
    reporteremail: report.reporterEmail || '',
    status: report.status || 'pending',
  };

  await resilientCreateDocument(config.databaseId, collId, report.id, initialPayload);
};

export const updateReportInAppwrite = async (reportId: string, status: 'resolved' | 'dismissed'): Promise<void> => {
  const config = getStoredAppwriteConfig();
  const { databases } = getAppwrite();
  if (!databases || !config.projectId || !config.databaseId) return;

  try {
    const collId = config.reportsCollectionId || 'reports';
    const safeDocId = reportId.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36);
    await databases.updateDocument(config.databaseId, collId, safeDocId, { status });
  } catch (err) {
    console.warn('Failed to sync report status update to Appwrite:', err);
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
