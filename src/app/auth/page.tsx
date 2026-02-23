'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

function AuthContent() {
    const [isLogin, setIsLogin] = useState(true);
    const searchParams = useSearchParams();
    const [isAdminLogin, setIsAdminLogin] = useState(searchParams.get('mode') === 'admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signUp } = useAuth();
    const router = useRouter();
    const redirect = searchParams.get('redirect');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) throw error;
                toast.success('Welcome back!');
                router.push(isAdminLogin ? '/admin1122' : (redirect ? `/${redirect}` : '/'));
            } else {
                const { error } = await signUp(email, password, fullName);
                if (error) throw error;
                toast.success('Account created! Please check your email to verify.');
            }
        } catch (err: any) {
            toast.error(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
        >
            <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-lg">
                <h1 className="font-display text-3xl font-bold text-center mb-2">
                    {isAdminLogin ? 'Admin Login' : isLogin ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p className="text-muted-foreground text-center mb-8">
                    {isAdminLogin ? 'Sign in to admin panel' : isLogin ? 'Sign in to your account' : 'Join ZoyaBites today'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && !isAdminLogin && (
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Your name" />
                        </div>
                    )}
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                    </div>
                    <div>
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} />
                    </div>
                    <Button type="submit" className={`w-full ${isAdminLogin ? 'bg-primary' : ''}`} disabled={loading}>
                        {loading ? 'Please wait...' : isAdminLogin ? '🔒 Admin Sign In' : isLogin ? 'Sign In' : 'Create Account'}
                    </Button>
                </form>

                {!isAdminLogin && (
                    <>
                        <div className="flex items-center gap-3 my-6">
                            <Separator className="flex-1" />
                            <span className="text-xs text-muted-foreground uppercase">or</span>
                            <Separator className="flex-1" />
                        </div>

                        <GoogleSignInButton
                            onSuccess={() => {
                                toast.success('Welcome!');
                                router.push(redirect ? `/${redirect}` : '/');
                            }}
                            onError={(err: any) => {
                                toast.error(err.message || 'Google sign-in failed');
                            }}
                        />

                        <p className="text-center text-sm text-muted-foreground mt-6">
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-primary font-medium hover:underline"
                            >
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </>
                )}
            </div>
        </motion.div>
    );
}

export default function AuthPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-24 pb-16 container mx-auto px-4 flex justify-center">
                <Suspense fallback={
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                }>
                    <AuthContent />
                </Suspense>
            </div>
        </div>
    );
}
