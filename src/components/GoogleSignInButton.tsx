import { Button } from "@/components/ui/button";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Chrome } from "lucide-react";

interface GoogleSignInButtonProps {
  onSuccess?: (user: unknown) => void;
  onError?: (error: unknown) => void;
}

export const GoogleSignInButton = ({ onSuccess, onError }: GoogleSignInButtonProps) => {
  const { signInWithGoogle, loading } = useGoogleAuth();

  const handleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      onSuccess?.(user);
    } catch (err) {
      onError?.(err);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      variant="outline"
      className="w-full flex items-center gap-2"
    >
      <Chrome className="w-5 h-5" />
      {loading ? "Signing in..." : "Sign in with Google"}
    </Button>
  );
};
