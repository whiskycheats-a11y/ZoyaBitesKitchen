import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";
import { toast } from "sonner";

interface GoogleSignInButtonProps {
  onSuccess?: (user: unknown) => void;
  onError?: (error: unknown) => void;
}

export const GoogleSignInButton = ({ onSuccess, onError }: GoogleSignInButtonProps) => {
  const handleSignIn = async () => {
    toast.info('Google sign-in is not available yet. Please use email/password.');
  };

  return (
    <Button
      onClick={handleSignIn}
      variant="outline"
      className="w-full flex items-center gap-2"
    >
      <Chrome className="w-5 h-5" />
      Sign in with Google
    </Button>
  );
};
