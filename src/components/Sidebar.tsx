import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, logOut } from '../firebase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: 'home' | 'checkout' | 'success' | 'admin') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate }) => {
  const [showAccountOptions, setShowAccountOptions] = useState(false);
  const { currentUser, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      onClose(); // Optional: close sidebar on success
    } catch (error: any) {
      console.error("Sign in failed", error);
      if (error?.code === 'auth/unauthorized-domain') {
        setAuthError("Domain not authorized. Please add this app URL to Firebase Authentication > Settings > Authorized domains.");
      } else {
        setAuthError(error?.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      onClose();
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  return (
    <>
      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      {/* Sidebar Drawer */}
      <div 
        className={`fixed top-0 bottom-0 left-0 w-[280px] bg-brand-bg z-[70] transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col pt-12 px-6">
          {currentUser && currentUser.role === 'admin' && (
             <button 
               onClick={() => {
                 onNavigate?.('admin');
                 onClose();
               }}
               className="py-4 text-[15px] font-medium text-brand-accent border-b border-neutral-200/60 hover:text-brand-text transition-colors text-left flex items-center gap-2"
             >
               Admin Dashboard
             </button>
          )}

          <button 
            onClick={() => setShowAccountOptions(!showAccountOptions)}
            className="py-4 text-[15px] font-medium text-brand-text border-b border-neutral-200/60 hover:text-neutral-500 transition-colors text-left"
          >
            Account
          </button>
          
          {showAccountOptions && !loading && (
            <div className="py-4 border-b border-neutral-200/60">
              {authError && (
                <div className="mb-3 p-3 bg-red-50 text-red-600 text-[13px] rounded-xl border border-red-100 leading-tight">
                  {authError}
                </div>
              )}
              {currentUser ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt={currentUser.displayName || 'User'} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-500 font-medium">
                        {currentUser.email?.[0].toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[14px] font-medium text-brand-text truncate">{currentUser.displayName || 'User'}</span>
                      <span className="text-[12px] text-neutral-500 truncate">{currentUser.email}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 bg-neutral-100 border border-neutral-200 rounded-full py-2.5 px-4 text-[14px] font-medium text-red-600 hover:bg-neutral-200 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-neutral-300 rounded-full py-2.5 px-4 text-[14px] font-medium text-brand-text hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  {isSigningIn ? (
                    <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
                </button>
              )}
            </div>
          )}

          <a href="#" className="py-4 text-[15px] font-medium text-brand-text border-b border-neutral-200/60 hover:text-neutral-500 transition-colors">Language & Region</a>
          <a href="#" className="py-4 text-[15px] font-medium text-brand-text border-b border-neutral-200/60 hover:text-neutral-500 transition-colors">Contact Us</a>
        </div>
      </div>
    </>
  );
};
