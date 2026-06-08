import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  runTransaction,
  writeBatch,
  where,
  limit
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: metaEnv.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==========================================
// Auth API
// ==========================================
const USERS_COLLECTION = 'users';

export const getUserProfileDocument = async (uid: string) => {
  if (!uid) return null;
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const snapShot = await getDoc(userRef);
    if (snapShot.exists()) {
      return snapShot.data();
    }
  } catch (error) {
    console.error("Error fetching user profile", error);
  }
  return null;
};

export const createUserProfileDocument = async (userAuth: any, additionalData: any = {}) => {
  if (!userAuth) return;

  const userRef = doc(db, USERS_COLLECTION, userAuth.uid);
  const snapShot = await getDoc(userRef);

  if (!snapShot.exists()) {
    const { displayName, email, photoURL } = userAuth;
    const role = (email === 'shoplix000@gmail.com') ? 'admin' : 'user';
    try {
      await setDoc(userRef, {
        uid: userAuth.uid,
        name: displayName,
        email,
        photoURL,
        role,
        createdAt: serverTimestamp(),
        ...additionalData
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, USERS_COLLECTION);
    }
  }
  return userRef;
};

export const signInWithGoogle = async () => {
  try {
    const { user } = await signInWithPopup(auth, googleProvider);
    await createUserProfileDocument(user);
    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

// ==========================================
// Products API
// ==========================================
const PRODUCTS_COLLECTION = 'products';

// Performance Cache variables
let cachedProducts: any[] | null = null;
let cachedCategories: any[] | null = null;
let cachedShippingRates: any[] | null = null;
let cachedHeroSettings: any = null;

export const getProducts = async () => {
  try {
    if (cachedProducts) {
      return cachedProducts;
    }
    const q = query(collection(db, PRODUCTS_COLLECTION));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    cachedProducts = data;
    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
  }
};

export const getProductsWithLimit = async (limitNum: number, categoryId: string = 'all') => {
  try {
    // If cache is loaded, return from memory to minimize Firestore reads to absolute 0
    if (cachedProducts) {
      let filtered = cachedProducts;
      if (categoryId && categoryId !== 'all') {
        filtered = cachedProducts.filter((p: any) => p.categoryId === categoryId);
      }
      return filtered.slice(0, limitNum);
    }

    let q;
    if (categoryId && categoryId !== 'all') {
      q = query(
        collection(db, PRODUCTS_COLLECTION),
        where('categoryId', '==', categoryId),
        limit(limitNum)
      );
    } else {
      q = query(
        collection(db, PRODUCTS_COLLECTION),
        limit(limitNum)
      );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
    return [];
  }
};

export const getProductById = async (id: string) => {
  try {
    if (cachedProducts) {
      const found = cachedProducts.find((p: any) => p.id === id);
      if (found) return found;
    }
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${PRODUCTS_COLLECTION}/${id}`);
  }
};

export const addProduct = async (productData: any) => {
  try {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...productData,
      createdAt: serverTimestamp()
    });
    cachedProducts = null; // Invalidate cache
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PRODUCTS_COLLECTION);
  }
};

export const updateProduct = async (id: string, productData: any) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...productData,
      updatedAt: serverTimestamp()
    });
    cachedProducts = null; // Invalidate cache
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
  }
};

export const deleteProduct = async (id: string) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
    cachedProducts = null; // Invalidate cache
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
  }
};

// ==========================================
// Telegram Settings & Notifications API
// ==========================================
const TELEGRAM_DOCUMENT_ID = 'telegram';

export const getTelegramSettings = async () => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, TELEGRAM_DOCUMENT_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/${TELEGRAM_DOCUMENT_ID}`);
  }
};

export const updateTelegramSettings = async (settingsData: any) => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, TELEGRAM_DOCUMENT_ID);
    await setDoc(docRef, {
      ...settingsData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SETTINGS_COLLECTION}/${TELEGRAM_DOCUMENT_ID}`);
  }
};

export const sendTelegramMessage = async (botToken: string, chatId: string, text: string): Promise<boolean> => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });
    const result = await response.json();
    return result.ok === true;
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
    return false;
  }
};

export const sendTelegramNotificationIfNeeded = async (orderId: string, orderData: any) => {
  try {
    const settings = await getTelegramSettings();
    if (!settings || !settings.enabled || !settings.botToken || !settings.chatId) {
      return;
    }

    const customer = orderData.customerInfo || {};
    const fullName = customer.fullName || 'غير معروف';
    const phone = customer.phone || 'غير محدد';
    const state = customer.state || customer.stateCity || 'غير محدد';
    const city = customer.city || '';
    const items = orderData.items || [];
    
    const productsText = items.map((item: any, idx: number) => {
      const name = item.name || item.title || 'منتج غير معروف';
      const qty = item.quantity || 1;
      const price = item.price || 0;
      const size = item.size || item.selectedSize;
      const color = item.color || item.selectedColor;
      
      let options = [];
      if (size) options.push(`مقاس: ${size}`);
      if (color) options.push(`لون: ${color}`);
      const optionsStr = options.length > 0 ? ` (${options.join(' - ')})` : '';
      
      return `  ${idx + 1}. <b>${name}</b>${optionsStr}\n      الكمية: ${qty} | السعر: ${price} دج`;
    }).join('\n\n');

    const total = orderData.totalPrice || 0;
    const dateStr = new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' });
    const orderNumValue = orderData.orderNumber || orderId;

    const messageText = `🔹 <b>طلب جديد من المتجر!</b> 🔹\n\n` +
      `📦 <b>رقم الطلب:</b> <code>${orderNumValue}</code>\n` +
      `👤 <b>اسم العميل:</b> ${fullName}\n` +
      `📞 <b>الهاتف:</b> ${phone}\n` +
      `📍 <b>الولاية:</b> ${state}\n` +
      (city ? `🏙️ <b>البلدية:</b> ${city}\n` : '') +
      `\n🛍️ <b>المنتجات المطلوبة:</b>\n${productsText}\n\n` +
      `💰 <b>الإجمالي:</b> <b>${total} دج</b>\n` +
      `⏰ <b>وقت الطلب:</b> ${dateStr}`;

    await sendTelegramMessage(settings.botToken, settings.chatId, messageText);
  } catch (err) {
    console.error('Failed to send Telegram notification:', err);
  }
};

// ==========================================
// Orders & Pre-aggregated Analytics API
// ==========================================
const ORDERS_COLLECTION = 'orders';

// Algiers timezone helper models and operations (GMT+1)
export const getAlgiersDateComponents = (date: Date) => {
  try {
    const options = { timeZone: 'Africa/Algiers', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value || String(date.getFullYear());
    const month = parts.find(p => p.type === 'month')?.value || String(date.getMonth() + 1).padStart(2, '0');
    const day = parts.find(p => p.type === 'day')?.value || String(date.getDate()).padStart(2, '0');
    return { year, month, day, dateStr: `${year}-${month}-${day}` };
  } catch (e) {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return { year, month, day, dateStr: `${year}-${month}-${day}` };
  }
};

export const getAlgiersWeekString = (date: Date): string => {
  const { year, month, day } = getAlgiersDateComponents(date);
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const isPendingOrProcessing = (status: string) => {
  return status === 'pending' || status === 'processing';
};

export const applyAnalyticsDeltaInMemory = (analytics: any, orderData: any, coefficient: number = 1) => {
  if (!orderData) return;
  
  const status = orderData.status || 'pending';
  const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    console.warn(`[Analytics Guard] Ignored order with unknown status: ${status}`);
    return;
  }

  // Define globalStats structure cleanly
  if (!analytics.globalStats) {
    analytics.globalStats = {
      cancelledOrdersCount: 0,
      processingOrdersCount: 0,
      cancellationRate: 0
    };
  }

  // Update global counters
  if (status === 'cancelled') {
    if (analytics.globalStats.cancelledOrdersCount === undefined) analytics.globalStats.cancelledOrdersCount = 0;
    analytics.globalStats.cancelledOrdersCount += coefficient;
    if (analytics.globalStats.cancelledOrdersCount < 0) analytics.globalStats.cancelledOrdersCount = 0;
  } else if (status === 'processing') {
    if (analytics.globalStats.processingOrdersCount === undefined) analytics.globalStats.processingOrdersCount = 0;
    analytics.globalStats.processingOrdersCount += coefficient;
    if (analytics.globalStats.processingOrdersCount < 0) analytics.globalStats.processingOrdersCount = 0;
  }

  // Recalculate cancellationRate dynamically: (Cancelled ÷ Processing) * 100
  const cancelledCount = Number(analytics.globalStats.cancelledOrdersCount) || 0;
  const processingCount = Number(analytics.globalStats.processingOrdersCount) || 0;
  analytics.globalStats.cancellationRate = processingCount > 0 ? (cancelledCount / processingCount) * 100 : 0;

  // Extract date correctly
  let dateObj = new Date();
  if (orderData.createdAt) {
    if (typeof orderData.createdAt.toDate === 'function') {
      dateObj = orderData.createdAt.toDate();
    } else if (orderData.createdAt.seconds) {
      dateObj = new Date(orderData.createdAt.seconds * 1000);
    } else {
      dateObj = new Date(orderData.createdAt);
    }
  }
  
  const { dateStr } = getAlgiersDateComponents(dateObj);

  if (!analytics.dailyStats) {
    analytics.dailyStats = {};
  }

  if (!analytics.dailyStats[dateStr]) {
    analytics.dailyStats[dateStr] = {
      pendingCount: 0,
      processingCount: 0,
      shippedCount: 0,
      deliveredCount: 0,
      cancelledCount: 0,
      wilayaCounts: {}
    };
  }

  const daily = analytics.dailyStats[dateStr];
  if (daily.pendingCount === undefined) daily.pendingCount = 0;
  if (daily.processingCount === undefined) daily.processingCount = 0;
  if (daily.shippedCount === undefined) daily.shippedCount = 0;
  if (daily.deliveredCount === undefined) daily.deliveredCount = 0;
  if (daily.cancelledCount === undefined) daily.cancelledCount = 0;
  if (daily.wilayaCounts === undefined) daily.wilayaCounts = {};

  // Increment specific status counters today
  if (status === 'pending') {
    daily.pendingCount += coefficient;
    if (daily.pendingCount < 0) daily.pendingCount = 0;
  } else if (status === 'processing') {
    daily.processingCount += coefficient;
    if (daily.processingCount < 0) daily.processingCount = 0;
  } else if (status === 'shipped') {
    daily.shippedCount += coefficient;
    if (daily.shippedCount < 0) daily.shippedCount = 0;
  } else if (status === 'delivered') {
    daily.deliveredCount += coefficient;
    if (daily.deliveredCount < 0) daily.deliveredCount = 0;
  } else if (status === 'cancelled') {
    daily.cancelledCount += coefficient;
    if (daily.cancelledCount < 0) daily.cancelledCount = 0;
  }

  // Top Wilaya is calculated from non-cancelled orders only
  const wilayaName = orderData.customerInfo?.state?.trim();
  if (wilayaName && status !== 'cancelled') {
    if (!daily.wilayaCounts[wilayaName]) {
      daily.wilayaCounts[wilayaName] = 0;
    }
    daily.wilayaCounts[wilayaName] += coefficient;
    if (daily.wilayaCounts[wilayaName] <= 0) {
      delete daily.wilayaCounts[wilayaName];
    }
  }

  // Audit log entry for diagnostics and real-time validation (simplified)
  const logEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    orderId: orderData.id || orderData.orderNumber || 'new_order',
    status: status,
    coefficient: coefficient,
    type: coefficient > 0 ? 'ADD' : 'SUBTRACT',
    timestamp: new Date().toISOString()
  };

  if (!analytics.logs) analytics.logs = [];
  analytics.logs.unshift(logEntry);
  if (analytics.logs.length > 25) {
    analytics.logs = analytics.logs.slice(0, 25);
  }
};

export const updateAnalyticsForOrder = async (transaction: any, orderData: any, coefficient: number = 1) => {
  // Input integrity guard - reject orders that contain missing, corrupt, or invalid critical fields
  if (!orderData) return;
  
  const status = orderData.status || 'pending';
  const totalPrice = Number(orderData.totalPrice);
  
  // Validation checks:
  if (isNaN(totalPrice) || totalPrice < 0) {
    console.warn(`[Analytics Guard] Ignored order with invalid price: ${orderData.totalPrice}`);
    return;
  }
  const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    console.warn(`[Analytics Guard] Ignored order with unknown status: ${status}`);
    return;
  }
  if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
    console.warn(`[Analytics Guard] Ignored order with missing or empty items`);
    return;
  }

  const analyticsRef = doc(db, 'analytics', 'dashboard');
  const analyticsSnap = await transaction.get(analyticsRef);
  
  let analytics: any = {
    initialized: true,
    globalStats: { 
      totalSales: 0, 
      ordersCount: 0, 
      averageOrderValue: 0, 
      pendingRevenue: 0, 
      pendingOrdersCount: 0,
      grossSales: 0,
      shippedRevenue: 0,
      deliveredRevenue: 0,
      productRevenue: 0,
      shippingRevenue: 0,
      grossRevenue: 0,
      netProfit: 0,
      cancelledOrdersCount: 0,
      cancelledRevenueLost: 0,
      cancellationRate: 0
    },
    dailyStats: {},
    weeklyStats: {},
    wilayaStats: {},
    productStats: {},
    logs: [] // High-visibility diagnostic debug audit logs inside the doc
  };
  
  if (analyticsSnap.exists()) {
    const existingData = analyticsSnap.data();
    analytics = {
      initialized: existingData.initialized !== undefined ? existingData.initialized : true,
      globalStats: {
        totalSales: Number(existingData.globalStats?.totalSales) || 0,
        ordersCount: Number(existingData.globalStats?.ordersCount) || 0,
        averageOrderValue: Number(existingData.globalStats?.averageOrderValue) || 0,
        pendingRevenue: Number(existingData.globalStats?.pendingRevenue) || 0,
        pendingOrdersCount: Number(existingData.globalStats?.pendingOrdersCount) || 0,
        grossSales: Number(existingData.globalStats?.grossSales) ?? Number(existingData.globalStats?.totalSales) ?? 0,
        shippedRevenue: Number(existingData.globalStats?.shippedRevenue) || 0,
        deliveredRevenue: Number(existingData.globalStats?.deliveredRevenue) || 0,
        productRevenue: Number(existingData.globalStats?.productRevenue) ?? Number(existingData.globalStats?.totalSales) ?? 0,
        shippingRevenue: Number(existingData.globalStats?.shippingRevenue) || 0,
        grossRevenue: Number(existingData.globalStats?.grossRevenue) ?? Number(existingData.globalStats?.totalSales) ?? 0,
        netProfit: Number(existingData.globalStats?.netProfit) ?? Number(existingData.globalStats?.totalSales) ?? 0,
        cancelledOrdersCount: Number(existingData.globalStats?.cancelledOrdersCount) || 0,
        cancelledRevenueLost: Number(existingData.globalStats?.cancelledRevenueLost) || 0,
        cancellationRate: Number(existingData.globalStats?.cancellationRate) || 0
      },
      dailyStats: existingData.dailyStats || {},
      weeklyStats: existingData.weeklyStats || {},
      wilayaStats: existingData.wilayaStats || {},
      productStats: existingData.productStats || {},
      logs: existingData.logs || []
    };
  }

  applyAnalyticsDeltaInMemory(analytics, orderData, coefficient);

  transaction.set(analyticsRef, analytics);
};

export const emergencyRecalculateAnalytics = async () => {
  try {
    console.log("Emergency Recalculating Core Analytics started...");
    const ordersCol = collection(db, ORDERS_COLLECTION);
    const ordersSnap = await getDocs(ordersCol);
    
    const analytics: any = {
      initialized: true,
      globalStats: { 
        cancelledOrdersCount: 0,
        processingOrdersCount: 0,
        cancellationRate: 0
      },
      dailyStats: {},
      logs: [{
        id: `recalc-${Date.now()}`,
        orderId: 'all_reconciled',
        status: 'recalculated_from_scratch',
        coefficient: 1,
        type: 'RECONCILED',
        timestamp: new Date().toISOString()
      }]
    };

    const batch = writeBatch(db);
    let dirtyCount = 0;

    ordersSnap.docs.forEach((snapDoc) => {
      const orderRef = snapDoc.ref;
      const orderData = snapDoc.data();
      const status = orderData.status || 'pending';
      
      const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!allowedStatuses.includes(status)) return;

      // Keep tracking applied status for idempotency logic
      if (orderData.analyticsAppliedStatus !== status) {
        batch.update(orderRef, { analyticsAppliedStatus: status });
        dirtyCount++;
      }

      applyAnalyticsDeltaInMemory(analytics, orderData, 1);
    });

    const analyticsRef = doc(db, 'analytics', 'dashboard');
    batch.set(analyticsRef, analytics);
    
    await batch.commit();
    console.log(`Successfully completed reconciliation recalculation! Synced ${dirtyCount} orders.`);
    return analytics;
  } catch (error) {
    console.error("Failed to run emergency recalculation: ", error);
    throw error;
  }
};

export const ensureAnalyticsSeeded = async () => {
  try {
    const analyticsRef = doc(db, 'analytics', 'dashboard');
    const analyticsSnap = await getDoc(analyticsRef);
    
    if (analyticsSnap.exists()) {
      const data = analyticsSnap.data();
      if (data && data.initialized === true) {
        return data;
      }
    }
    
    return await emergencyRecalculateAnalytics();
  } catch (err) {
    console.error("Failed to enforce analytics seed check:", err);
    return {
      globalStats: { 
        cancelledOrdersCount: 0,
        processingOrdersCount: 0,
        cancellationRate: 0
      },
      dailyStats: {}
    };
  }
};

export const createOrder = async (orderData: any) => {
  try {
    const result = await runTransaction(db, async (transaction) => {
      const counterRef = doc(db, 'settings', 'counters');
      const analyticsRef = doc(db, 'analytics', 'dashboard');
      
      // 1. Perform ALL reads first!
      const counterSnap = await transaction.get(counterRef);
      const analyticsSnap = await transaction.get(analyticsRef);
      
      let nextNum = 1001;
      if (counterSnap.exists()) {
        const data = counterSnap.data();
        if (data && typeof data.lastOrderNumber === 'number') {
          nextNum = data.lastOrderNumber + 1;
        }
      }
      
      const orderNumber = `#ORD-${nextNum}`;
      const orderRef = doc(collection(db, ORDERS_COLLECTION));
      const status = orderData.status || 'pending';

      const enrichedOrderData = {
        ...orderData,
        status,
        orderNumber,
        analyticsAppliedStatus: status, // Set actual applied state directly to prevent double computing
        createdAt: serverTimestamp()
      };

      // Initialize analytics in-memory
      let analytics: any = {
        initialized: true,
        globalStats: { 
          cancelledOrdersCount: 0,
          processingOrdersCount: 0,
          cancellationRate: 0
        },
        dailyStats: {},
        logs: []
      };
      
      if (analyticsSnap.exists()) {
        const existingData = analyticsSnap.data();
        analytics = {
          initialized: existingData.initialized !== undefined ? existingData.initialized : true,
          globalStats: {
            cancelledOrdersCount: Number(existingData.globalStats?.cancelledOrdersCount) || 0,
            processingOrdersCount: Number(existingData.globalStats?.processingOrdersCount) || 0,
            cancellationRate: Number(existingData.globalStats?.cancellationRate) || 0
          },
          dailyStats: existingData.dailyStats || {},
          logs: existingData.logs || []
        };
      }

      // Compute in-memory update
      applyAnalyticsDeltaInMemory(analytics, { ...enrichedOrderData, createdAt: new Date() }, 1);
      
      // 2. Perform ALL writes afterwards
      transaction.set(orderRef, enrichedOrderData);
      transaction.set(counterRef, { lastOrderNumber: nextNum }, { merge: true });
      transaction.set(analyticsRef, analytics);
      
      return { id: orderRef.id, orderNumber, enrichedOrderData };
    });

    // Send Telegram Notification if configured/enabled
    try {
      await sendTelegramNotificationIfNeeded(result.id, result.enrichedOrderData);
    } catch (telegramErr) {
      console.error("Error triggering Telegram notification:", telegramErr);
    }

    return result.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ORDERS_COLLECTION);
  }
};

export const getOrders = async () => {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
  }
};

export const updateOrder = async (id: string, orderData: any) => {
  try {
    await runTransaction(db, async (transaction) => {
      const docRef = doc(db, ORDERS_COLLECTION, id);
      const analyticsRef = doc(db, 'analytics', 'dashboard');
      
      // 1. Perform ALL reads first!
      const orderSnap = await transaction.get(docRef);
      const analyticsSnap = await transaction.get(analyticsRef);
      
      if (!orderSnap.exists()) {
        throw new Error("Order not found");
      }
      
      const existingOrder = orderSnap.data();
      const oldStatus = existingOrder.analyticsAppliedStatus || existingOrder.status || 'pending';
      const newStatus = orderData.status;

      // Initialize analytics in-memory
      let analytics: any = {
        initialized: true,
        globalStats: { 
          cancelledOrdersCount: 0,
          processingOrdersCount: 0,
          cancellationRate: 0
        },
        dailyStats: {},
        logs: []
      };
      
      if (analyticsSnap.exists()) {
        const existingData = analyticsSnap.data();
        analytics = {
          initialized: existingData.initialized !== undefined ? existingData.initialized : true,
          globalStats: {
            cancelledOrdersCount: Number(existingData.globalStats?.cancelledOrdersCount) || 0,
            processingOrdersCount: Number(existingData.globalStats?.processingOrdersCount) || 0,
            cancellationRate: Number(existingData.globalStats?.cancellationRate) || 0
          },
          dailyStats: existingData.dailyStats || {},
          logs: existingData.logs || []
        };
      }

      // 2. Perform pure in-memory delta calculations
      if (newStatus && newStatus !== oldStatus) {
        // 1. Subtract the original contribution (using old status as existing reference)
        applyAnalyticsDeltaInMemory(analytics, { ...existingOrder, status: oldStatus }, -1);
        
        // 2. Add the updated contribution (using new status)
        applyAnalyticsDeltaInMemory(analytics, { ...existingOrder, ...orderData, status: newStatus }, 1);
        
        // Unify to avoid multiple calculations in highly concurrent environments
        orderData.analyticsAppliedStatus = newStatus;
      }

      // 3. Perform ALL writes afterwards!
      transaction.set(analyticsRef, analytics);
      const isCancelling = orderData.status === 'cancelled';
      const cancelPayload = isCancelling ? {
        cancelledAt: serverTimestamp()
      } : {};
      transaction.update(docRef, {
        ...orderData,
        ...cancelPayload,
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${id}`);
  }
};

export const getUsers = async () => {
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
  }
};

// ==========================================
// Categories API
// ==========================================
const CATEGORIES_COLLECTION = 'categories';

export const getCategories = async () => {
  try {
    if (cachedCategories) {
      return cachedCategories;
    }
    const q = query(collection(db, CATEGORIES_COLLECTION), orderBy('displayOrder', 'asc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    cachedCategories = data;
    return data;
  } catch (error) {
    // Treat error gracefully if collection does not exist yet or displayOrder does not have index
    try {
      const qFallback = query(collection(db, CATEGORIES_COLLECTION));
      const snapshot = await getDocs(qFallback);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      cachedCategories = data;
      return data;
    } catch (fallbackError) {
      handleFirestoreError(fallbackError, OperationType.LIST, CATEGORIES_COLLECTION);
    }
  }
};

export const addCategory = async (categoryData: any) => {
  try {
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
      ...categoryData,
      createdAt: serverTimestamp()
    });
    cachedCategories = null; // Invalidate cache
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, CATEGORIES_COLLECTION);
  }
};

export const updateCategory = async (id: string, categoryData: any) => {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(docRef, {
      ...categoryData,
      updatedAt: serverTimestamp()
    });
    cachedCategories = null; // Invalidate cache
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CATEGORIES_COLLECTION}/${id}`);
  }
};

export const deleteCategory = async (id: string) => {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await deleteDoc(docRef);
    cachedCategories = null; // Invalidate cache
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${CATEGORIES_COLLECTION}/${id}`);
  }
};

// ==========================================
// Storage API for Product Images
// ==========================================

const compressImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 800;
        const maxH = 1000;
        let width = img.width;
        let height = img.height;

        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        if (height > maxH) {
          width = Math.round((width * maxH) / height);
          height = maxH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string || '');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG to keep the payload extremely lightweight
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        resolve(event.target?.result as string || '');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      resolve('');
    };
    reader.readAsDataURL(file);
  });
};

export const uploadProductImage = async (file: File): Promise<string> => {
  const uploadPromise = (async () => {
    try {
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const randomId = Math.random().toString(36).substring(2, 10);
      const fileName = `${Date.now()}_${randomId}.${fileExtension}`;
      const filePath = `products/${fileName}`;
      const storageRef = ref(storage, filePath);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (err) {
      throw err;
    }
  })();

  const timeoutPromise = new Promise<string>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout")), 6000); // 6-seconds timeout
  });

  try {
    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (error) {
    console.warn("Storage upload failed or timed out. Falling back to compressed client-side Base64...", error);
    try {
      const compressed = await compressImageToBase64(file);
      if (compressed) {
        return compressed;
      }
      throw error;
    } catch (compressError) {
      console.error("Base64 compression failed:", compressError);
      throw error;
    }
  }
};

export const deleteProductImageByUrl = async (url: string): Promise<void> => {
  if (!url) return;
  try {
    // If it is a Firebase storage download URL, we can attempt to delete it
    if (url.includes('firebasestorage.googleapis.com')) {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.warn("Could not delete image from Firebase Storage:", error);
  }
};

// ==========================================
// Settings (Hero) API
// ==========================================
const SETTINGS_COLLECTION = 'settings';
const HERO_DOCUMENT_ID = 'hero';

export const getHeroSettings = async () => {
  try {
    if (cachedHeroSettings) {
      return cachedHeroSettings;
    }
    const docRef = doc(db, SETTINGS_COLLECTION, HERO_DOCUMENT_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      cachedHeroSettings = data;
      return data;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/${HERO_DOCUMENT_ID}`);
  }
};

export const updateHeroSettings = async (settingsData: any) => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, HERO_DOCUMENT_ID);
    await setDoc(docRef, {
      ...settingsData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    cachedHeroSettings = null; // Invalidate cache
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SETTINGS_COLLECTION}/${HERO_DOCUMENT_ID}`);
  }
};

export const uploadHeroImage = async (file: File): Promise<string> => {
  const uploadPromise = (async () => {
    try {
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const randomId = Math.random().toString(36).substring(2, 10);
      const fileName = `${Date.now()}_${randomId}.${fileExtension}`;
      const filePath = `heroes/${fileName}`;
      const storageRef = ref(storage, filePath);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (err) {
      throw err;
    }
  })();

  const timeoutPromise = new Promise<string>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout")), 8000); // 8-seconds timeout
  });

  try {
    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (error) {
    console.warn("Storage upload failed or timed out. Falling back to compressed client-side Base64...", error);
    try {
      const compressed = await compressImageToBase64(file);
      if (compressed) {
        return compressed;
      }
      throw error;
    } catch (compressError) {
      console.error("Base64 compression failed:", compressError);
      throw error;
    }
  }
};

// ==========================================
// Shipping Rates API
// ==========================================
const SHIPPING_RATES_COLLECTION = 'shipping_rates';

export const getShippingRates = async () => {
  try {
    if (cachedShippingRates) {
      return cachedShippingRates;
    }
    const q = query(collection(db, SHIPPING_RATES_COLLECTION));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    cachedShippingRates = data;
    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, SHIPPING_RATES_COLLECTION);
  }
};

export const updateShippingRate = async (rateData: any) => {
  if (!rateData || !rateData.wilayaId) {
    throw new Error('wilayaId is required to update shipping rate');
  }
  const idStr = String(rateData.wilayaId);
  try {
    const docRef = doc(db, SHIPPING_RATES_COLLECTION, idStr);
    await setDoc(docRef, {
      ...rateData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    cachedShippingRates = null; // Invalidate cache
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SHIPPING_RATES_COLLECTION}/${idStr}`);
  }
};


