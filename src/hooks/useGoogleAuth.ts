import { useState } from "react";

export const useGoogleAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    throw new Error('Google sign-in is not available. Use email/password.');
  };

  const logout = async () => {
    setUser(null);
  };

  const checkAuthState = (callback: (user: any) => void) => {
    callback(null);
    return () => {};
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    logout,
    checkAuthState,
  };
};
