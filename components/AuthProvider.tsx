import { useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../store/auth';
import { AuthApi, type UserDto } from '../api/auth.api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;
      const me = await AuthApi.me();
      setUserState(me);
    } catch {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void restoreSession(); }, [restoreSession]);

  const setUser = (u: UserDto | null) => setUserState(u);

  const logout = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    setUserState(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, setUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
