import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authLogin, authRefresh, authLogout, LoginResponse } from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  company?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  ACCESS_TOKEN_EXPIRES: 'auth_access_token_expires',
  REFRESH_TOKEN_EXPIRES: 'auth_refresh_token_expires',
  USER: 'auth_user',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth state on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const accessExpires = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES);

      if (storedUser && accessToken) {
        const parsedUser = JSON.parse(storedUser);
        
        // Check if access token is expired
        if (accessExpires && new Date(accessExpires) < new Date()) {
          // Try to refresh
          if (refreshToken) {
            const refreshed = await refreshTokens();
            if (refreshed) {
              setUser(parsedUser);
            }
          }
        } else {
          setUser(parsedUser);
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const storeAuthData = async (response: LoginResponse) => {
    try {
      const userData: User = {
        id: response.customer.id,
        email: response.customer.email,
        name: response.customer.username,
        company: response.customer.companyName,
      };

      // Use individual setItem calls for web compatibility
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES, response.accessTokenExpiresAt);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES, response.refreshTokenExpiresAt);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

      setUser(userData);
      console.log('Auth data stored successfully');
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  };

  const clearAuthData = async () => {
    // Use individual removeItem calls for web compatibility
    await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Attempting login for:', email);
      const response = await authLogin(email, password);
      console.log('Login successful');
      await storeAuthData(response);
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Anmeldung fehlgeschlagen';
      
      if (error.response?.status === 401) {
        errorMessage = 'Ungültige E-Mail oder Passwort';
      } else if (error.response?.status === 422) {
        errorMessage = 'Bitte füllen Sie alle Felder aus';
      } else if (error.response?.status === 503) {
        errorMessage = 'Server nicht erreichbar. Bitte später erneut versuchen.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message?.includes('Network Error')) {
        errorMessage = 'Netzwerkfehler. Bitte Internetverbindung prüfen.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Zeitüberschreitung. Bitte erneut versuchen.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (accessToken) {
        await authLogout(accessToken);
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    } finally {
      await clearAuthData();
    }
  };

  const refreshTokens = async (): Promise<boolean> => {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        return false;
      }

      const response = await authRefresh(refreshToken);
      
      // Use individual setItem calls for web compatibility
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES, response.accessTokenExpiresAt);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES, response.refreshTokenExpiresAt);

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      await clearAuthData();
      return false;
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const accessExpires = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES);
    
    // Check if token is expired
    if (accessExpires && new Date(accessExpires) < new Date()) {
      // Try to refresh
      const refreshed = await refreshTokens();
      if (refreshed) {
        return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      }
      return null;
    }
    
    return accessToken;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        accessToken: null, // We use getAccessToken() for fresh token
        login,
        logout,
        refreshTokens,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
