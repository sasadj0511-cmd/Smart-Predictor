import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from '../firebase';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
                setUser(user);
                setLoading(false);
        });
        return () => unsubscribe();
  }, []);

  const login = async () => {
        if (isSigningIn) return; // Prevent duplicate requests

        setIsSigningIn(true);
        try {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                console.log('✅ Google login successful:', {
                          user: result.user?.email,
                          displayName: result.user?.displayName
                });
                return result;
        } catch (error: any) {
                console.error('❌ Google login failed:', {
                          code: error?.code,
                          message: error?.message,
                          error
                });
                throw error;
        } finally {
                setIsSigningIn(false);
        }
  };

  const logout = () => auth.signOut();

  return { user, loading, login, logout, isSigningIn };
}
