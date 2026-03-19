import api from './axios';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserDto {
  id: number;
  email: string;
  role: 'admin' | 'superuser' | 'user';
  status: string;
  company: string | null;
}

const wrap = <T>(p: Promise<{ data: { data: T } }>) => p.then(r => r.data.data);

export const AuthApi = {
  register: (email: string) => wrap<void>(api.post('/auth/register', { email })),
  verifyCode: (email: string, code: string) =>
    wrap<void>(api.post('/auth/verify-code', { email, code })),
  login: (email: string, password: string) =>
    wrap<AuthTokens>(api.post('/auth/login', { email, password })),
  refresh: (refreshToken: string) =>
    wrap<AuthTokens>(api.post('/auth/refresh', { refreshToken })),
  me: () => wrap<UserDto>(api.get('/auth/me')),
  completeProfile: (payload: {
    email: string;
    password: string;
    company?: string;
    company_title?: string;
    phone?: string;
  }) => wrap<void>(api.post('/auth/register/complete', payload)),
};
