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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zoyabiteskitchen.onrender.com';

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

      // Sync with backend
      try {
        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name: fullName })
        });
        const data = await res.json();
        if (data.token) localStorage.setItem('auth_token', data.token);
      } catch (err) {
        console.error('Backend sync failed', err);
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Sync with backend
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.token) localStorage.setItem('auth_token', data.token);
      } catch (err) {
        // If login fails, maybe try register (in case user was created in Firebase but not backend)
        try {
          const res = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name: email.split('@')[0] })
          });
          const data = await res.json();
          if (data.token) localStorage.setItem('auth_token', data.token);
        } catch (err2) {
          console.error('Backend sync failed', err2);
        }
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    localStorage.removeItem('auth_token');
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
