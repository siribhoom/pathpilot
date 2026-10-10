/**
 * ============================================================================
 * FILE: src/firebase.ts
 * PURPOSE: Initializes Firebase Authentication and Cloud Firestore using the
 *          provisioned `firebase-applet-config.json` file, validates server
 *          connectivity on boot, and provides structured error reporting.
 *
 * BEGINNER CONCEPT — Client-Side Firebase Config vs. Security Rules:
 * The values in `firebase-applet-config.json` (like `projectId` and `apiKey`)
 * are public identifiers that tell the browser *which* Firebase project to
 * connect to—they are NOT secret backend keys. Data protection in Firebase is
 * enforced on Google's servers by `firestore.rules`, which verify that
 * `request.auth.uid == userId` on every single read and write.
 * ============================================================================
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize the Firebase application with the provisioned configuration
const app = initializeApp(firebaseConfig);

// Connect to the specific Cloud Firestore database provisioned for this applet
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Standard Operation Types for structured Firestore error diagnostics.
 */
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

/**
 * Structured error handler for all Firestore operations.
 * Packages the operation type, document path, and current auth state into a
 * diagnostic JSON payload whenever a permission or network error occurs.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate connection to Cloud Firestore when the application boots.
 */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

/**
 * Helper to trigger Google Sign-In via Popup.
 */
export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

/**
 * Helper to sign out the current Firebase user.
 */
export async function signOutUser() {
  return firebaseSignOut(auth);
}
