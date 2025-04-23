import { createContext, useContext, useEffect, useState } from 'react';
import { useSegments, useRouter, router as expoRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the auth context type
type AuthContextType = {
  signIn: (token: string, userId: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType>({
  signIn: async () => {},
  signOut: async () => {},
  isLoading: true,
  isAuthenticated: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0] === 'auth';
      
      if (isAuthenticated && inAuthGroup) {
        router.replace('/(tabs)' as any);
      } else if (!isAuthenticated && !inAuthGroup) {
        router.replace('/(auth)' as any);
      }
    }
  }, [isLoading, isAuthenticated, segments]);
  
  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const signIn = async (token: string, userId: string, username: string) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('username', username);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };
  
  const signOut = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'userId', 'username']);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <AuthContext.Provider value={{ signIn, signOut, isLoading, isAuthenticated }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}