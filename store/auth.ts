import { createContext, useContext } from 'react';
import type { UserDto } from '../api/auth.api';

export interface AuthState {
  user: UserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: UserDto | null) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuthStore(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthStore must be used inside AuthProvider');
  return ctx;
}
