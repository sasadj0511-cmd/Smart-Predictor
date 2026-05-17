import { useState, useEffect } from 'react';

import { onAuthStateChanged, signInWithRedirect, getRedirectResult, GoogleAuthProvider, User } from 'firebase/auth';

import { auth } from '../firebase';

export function useAuth() {

  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {

                getRedirectResult(auth)

                  .then((result) => {

                                if (result?.user) {

                                console.log('Redirect login success:', result.user.email);

                                }

                  })

                  .catch((error) => {

                                 console.error('Redirect result error:', {

                                                         code: error?.code,

                                               message: error?.message,

                                               error,

                                 });

                  })

                  .finally(() => {

                                   setIsSigningIn(false);

                  });

                const unsubscribe = onAuthStateChanged(auth, (user) => {

                                                             setUser(user);

                                                             setLoading(false);

                });

                return () => unsubscribe();

  }, []);

  const login = async () => {

          if (isSigningIn) return;

          setIsSigningIn(true);

          try {

            const provider = new GoogleAuthProvider();

            provider.setCustomParameters({

                                                 prompt: 'select_account',

            });

            await signInWithRedirect(auth, provider);

          } catch (error: any) {

            console.error('Redirect login failed:', {

                                  code: error?.code,

                        message: error?.message,

                        error,

            });

            setIsSigningIn(false);

          }

  };

  const logout = () => auth.signOut();

  return { user, loading, login, logout, isSigningIn };

}
