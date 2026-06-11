import api from './api';
import { User, UserRole } from '../types';

export const userService = {
  async listUsers(role?: UserRole, search?: string): Promise<User[]> {
    const res = await api.get('/users', { params: { role, search } });
    return res.data.data.users as User[];
  },

  async getUser(id: string): Promise<User> {
    const res = await api.get(`/users/${id}`);
    return res.data.data.user as User;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const res = await api.put(`/users/${id}`, updates);
    return res.data.data.user as User;
  }
};
