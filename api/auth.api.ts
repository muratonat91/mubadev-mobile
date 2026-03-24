import api from './axios';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface UserDto {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'superuser' | 'user';
  status: string;
  company: string | null;
  company_title?: string | null;
  phone?: string | null;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  company?: string;
  company_title?: string;
  phone?: string;
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
  updateProfile: (data: UpdateProfilePayload) =>
    wrap<UserDto>(api.put('/auth/profile', data)),
  changePassword: (current_password: string, new_password: string) =>
    wrap<void>(api.post('/auth/change-password', { current_password, new_password })),
  forgotPassword: (email: string) =>
    wrap<void>(api.post('/auth/forgot-password', { email })),
};
