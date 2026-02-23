import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: (FirebaseUser & { id: string; user_metadata: { full_name: string | null } }) | null;
  loading: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setUser: (user: (FirebaseUser & { id: string; user_metadata: { full_name: string | null } }) | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(FirebaseUser & { id: string; user_metadata: { full_name: string | null } }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);

  const checkRoles = async (user: FirebaseUser) => {
    // Check custom claims or metadata for roles
    const token = await user.getIdTokenResult();
    setIsAdmin(!!token.claims.admin);
    setIsSeller(!!token.claims.seller);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const normalizedUser = firebaseUser ? Object.assign(firebaseUser, {
        id: firebaseUser.uid,
        user_metadata: { full_name: firebaseUser.displayName }
      }) : null;
      setUser(normalizedUser as (FirebaseUser & { id: string; user_metadata: { full_name: string | null } }) | null);
      if (firebaseUser) {
        checkRoles(firebaseUser);
      } else {
        setIsAdmin(false);
        setIsSeller(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: fullName });
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setIsAdmin(false);
    setIsSeller(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isSeller, signUp, signIn, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
