import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | undefined | null;
  loading: boolean;
  logout: () => Promise<void>;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'userProfile';

const saveToLocalStorage = (user: User) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const getFromLocalStorage = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt)
      };
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  return null;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | undefined | null>(undefined);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        if (!navigator.onLine) {
          const cachedProfile = getFromLocalStorage();
          if (cachedProfile && cachedProfile.uid === user.uid) {
            setUserProfile(cachedProfile);
            setLoading(false);
            return;
          }
        }

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'uid'>;
            const profile = {
              uid: user.uid,
              ...userData,
              createdAt: userData.createdAt?.toDate() || new Date()
            };
            setUserProfile(profile);
            saveToLocalStorage(profile);
          } else {
            setUserProfile(null);
            localStorage.removeItem(STORAGE_KEY);
            navigate('/login');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          if (!navigator.onLine) {
            const cachedProfile = getFromLocalStorage();
            if (cachedProfile && cachedProfile.uid === user.uid) {
              setUserProfile(cachedProfile);
            } else {
              setUserProfile(null);
            }
          } else {
            setUserProfile(null);
          }
        }
      } else {
        setUserProfile(null);
        localStorage.removeItem(STORAGE_KEY);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [navigate]);

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem(STORAGE_KEY);
    setUserProfile(null);
    navigate('/login');
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    logout,
    isOnline
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
