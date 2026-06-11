import api, { TOKEN_STORAGE_KEY } from './api';
import { User, UserRole } from '../types';

export interface LoginResult {
  token?: string;
  user?: User;
  requiresOtp?: boolean;
  userId?: string;
  devOtp?: string;
}

export const authService = {
  async register(name: string, email: string, password: string, role: UserRole) {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { token, user } = res.data.data as { token: string; user: User };
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return user;
  },

  async login(email: string, password: string, role?: UserRole): Promise<LoginResult> {
    const res = await api.post('/auth/login', { email, password, role });
    const data = res.data.data as LoginResult;
    if (data.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    }
    return data;
  },

  async verifyOtp(userId: string, otp: string) {
    const res = await api.post('/auth/verify-otp', { userId, otp });
    const { token, user } = res.data.data as { token: string; user: User };
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return user;
  },

  async forgotPassword(email: string): Promise<{ devResetToken?: string }> {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token: string, password: string) {
    await api.post('/auth/reset-password', { token, password });
  },

  async me(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data.data.user as User;
  },

  logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};
