import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass databaseId per Firebase Integration guidelines
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Google Auth Provider configured for popups
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Operation types for strict Firestore error reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo:
        currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network unreachable.');
    }
  }
}
testConnection();

// Sign In With Google
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Sync user profile to Firestore
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(
          userRef,
          {
            userId: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Quantitative Trader',
            photoURL: user.photoURL || '',
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    }
    return user;
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

// Sign Out
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

// User Portfolio & Watchlist data interface
export interface UserPortfolioData {
  userId: string;
  watchlist: string[];
  cashBalance: number;
  updatedAt: string;
}

export async function getUserPortfolio(userId: string): Promise<UserPortfolioData | null> {
  const path = `portfolios/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'portfolios', userId));
    if (snap.exists()) {
      return snap.data() as UserPortfolioData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserPortfolio(
  userId: string,
  data: Partial<UserPortfolioData>
): Promise<void> {
  const path = `portfolios/${userId}`;
  try {
    await setDoc(
      doc(db, 'portfolios', userId),
      {
        userId,
        watchlist: data.watchlist || ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'GOOGL'],
        cashBalance: data.cashBalance !== undefined ? data.cashBalance : 100000,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Saved Prediction interface
export interface SavedPredictionRecord {
  id?: string;
  userId: string;
  ticker: string;
  modelType: string;
  timeframe: string;
  currentPrice: number;
  predictedPrice: number;
  directionalSignal: string;
  confidenceScore: number;
  summary: string;
  createdAt: string;
}

export async function savePredictionRecord(
  prediction: Omit<SavedPredictionRecord, 'id'>
): Promise<string> {
  const predictionId = `${prediction.ticker}_${Date.now()}`;
  const path = `predictions/${predictionId}`;
  try {
    await setDoc(doc(db, 'predictions', predictionId), {
      ...prediction,
      id: predictionId,
    });
    return predictionId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getUserPredictions(userId: string): Promise<SavedPredictionRecord[]> {
  const path = 'predictions';
  try {
    const q = query(
      collection(db, 'predictions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SavedPredictionRecord) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export { onAuthStateChanged };
