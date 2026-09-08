// Initial creation: Auth context providing current user + role (admin/crew/client) to the whole app.
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import type { AppUser, UserRole } from "@/types";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// New accounts default to "client" — an admin must manually promote crew/admin accounts
// in Firestore. This is intentional: nobody should be able to grant themselves admin
// access just by signing up.
const DEFAULT_ROLE: UserRole = "client";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        setUser(userDocSnap.data() as AppUser);
      } else {
        // First-time sign-in (e.g. new Google account): create their profile doc.
        const newUser: AppUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          displayName: firebaseUser.displayName ?? firebaseUser.email ?? "New User",
          role: DEFAULT_ROLE,
          photoURL: firebaseUser.photoURL ?? undefined,
          createdAt: Date.now(),
        };
        await setDoc(userDocRef, newUser);
        setUser(newUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser: AppUser = {
      uid: credential.user.uid,
      email,
      displayName,
      role: DEFAULT_ROLE,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, "users", credential.user.uid), newUser);
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
