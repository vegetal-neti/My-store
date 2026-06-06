import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, getUserProfileDocument } from '../firebase';

export interface AppUser extends User {
  role?: string;
  dbData?: any;
}

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (user) {
        let userDoc = await getUserProfileDocument(user.uid);
        let role = userDoc?.role || 'user';
        
        // Auto-promote the specified admin email to admin role
        if (user.email === 'shoplix000@gmail.com') {
          role = 'admin';
          if (userDoc?.role !== 'admin') {
            try {
              const { doc, updateDoc } = await import('firebase/firestore');
              const { db } = await import('../firebase');
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, { role: 'admin' });
              // Refresh user profile data
              userDoc = { ...userDoc, role: 'admin' };
            } catch (err) {
              console.error("Failed to auto-update admin role in Firestore:", err);
            }
          }
        }
        
        setCurrentUser({ ...user, role, dbData: userDoc } as AppUser);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {!loading ? children : (
        <div className="w-full min-h-screen flex items-center justify-center bg-brand-bg">
          <div className="w-8 h-8 border-2 border-brand-text border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
