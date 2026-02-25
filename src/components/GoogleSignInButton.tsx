import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface GoogleSignInButtonProps {
  onSuccess?: (user: unknown) => void;
  onError?: (error: unknown) => void;
}

export const GoogleSignInButton = ({ onSuccess, onError }: GoogleSignInButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google sign-in failed');

      localStorage.setItem('auth_token', data.token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || '',
        roles: data.user.roles || [],
        user_metadata: { full_name: data.user.name || null },
      });

      onSuccess?.(data.user);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        onError?.(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      variant="outline"
      className="w-full flex items-center gap-2"
      disabled={loading}
      data-testid="button-google-signin"
    >
      <Chrome className="w-5 h-5" />
      {loading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
};
