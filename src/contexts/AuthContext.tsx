import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserData {
  id: string;
  email: string;
  name: string;
  phone?: string;
  roles: string[];
  user_metadata: { full_name: string | null };
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setUser: (user: UserData | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            const u: UserData = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name || '',
              phone: data.user.phone,
              roles: data.user.roles || [],
              user_metadata: { full_name: data.user.name || null },
            };
            setUser(u);
            setIsAdmin(u.roles.includes('admin'));
            setIsSeller(u.roles.includes('seller'));
          }
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: fullName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        const u: UserData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || fullName,
          roles: data.user.roles || [],
          user_metadata: { full_name: data.user.name || fullName },
        };
        setUser(u);
        setIsAdmin(u.roles.includes('admin'));
        setIsSeller(u.roles.includes('seller'));
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        const u: UserData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || '',
          roles: data.user.roles || [],
          user_metadata: { full_name: data.user.name || null },
        };
        setUser(u);
        setIsAdmin(u.roles.includes('admin'));
        setIsSeller(u.roles.includes('seller'));
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
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
