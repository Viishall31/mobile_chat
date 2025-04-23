import { createContext, useContext, useEffect, useState } from 'react';
import { useSegments, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const AuthContext = createContext<{
  signIn: (token: string, userId: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  userData: { userId: string; username: string } | null;
}>({
  signIn: async () => {},
  signOut: async () => {},
  continueAsGuest: async () => {},
  isLoading: true,
  isAuthenticated: false,
  isGuest: false,
  userData: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [userData, setUserData] = useState<{ userId: string; username: string } | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0] === 'auth';

      if ((isAuthenticated || isGuest) && inAuthGroup) {
        router.replace('/(tabs)/chat');
      } else if (!isAuthenticated && !isGuest && !inAuthGroup) {
        router.replace('/auth');
      }
    }
  }, [isLoading, isAuthenticated, isGuest, segments]);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const guestId = await AsyncStorage.getItem('guestId');
      const userId = await AsyncStorage.getItem('userId');
      const username = await AsyncStorage.getItem('username');

      if (token && userId && username) {
        setIsAuthenticated(true);
        setUserData({ userId, username });
      } else if (guestId) {
        setIsGuest(true);
        setUserData({ 
          userId: guestId, 
          username: await AsyncStorage.getItem('guestName') || `Guest-${guestId.slice(0, 4)}` 
        });
      }
    } catch (error) {
      setIsAuthenticated(false);
      setIsGuest(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (token: string, userId: string, username: string) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('username', username);
      // Clear guest data if exists
      await AsyncStorage.multiRemove(['guestId', 'guestName']);
      setIsAuthenticated(true);
      setIsGuest(false);
      setUserData({ userId, username });
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const continueAsGuest = async () => {
    try {
      const guestId = uuidv4();
      const guestName = `Guest-${guestId.slice(0, 4)}`;
      await AsyncStorage.setItem('guestId', guestId);
      await AsyncStorage.setItem('guestName', guestName);
      setIsGuest(true);
      setUserData({ userId: guestId, username: guestName });
    } catch (error) {
      console.error('Error continuing as guest:', error);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'userId', 'username', 'guestId', 'guestName']);
      setIsAuthenticated(false);
      setIsGuest(false);
      setUserData(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      signIn, 
      signOut, 
      continueAsGuest, 
      isLoading, 
      isAuthenticated, 
      isGuest,
      userData 
    }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}