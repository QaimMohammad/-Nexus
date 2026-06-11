import api from './api';
import { User } from '../types';

export interface ApiCollaborationRequest {
  id: string;
  investorId: User | string;
  entrepreneurId: User | string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export const collaborationService = {
  async createRequest(entrepreneurId: string, message: string): Promise<ApiCollaborationRequest> {
    const res = await api.post('/collaborations', { entrepreneurId, message });
    return res.data.data.request;
  },

  async listRequests(): Promise<ApiCollaborationRequest[]> {
    const res = await api.get('/collaborations');
    return res.data.data.requests;
  },

  async respond(id: string, status: 'accepted' | 'rejected'): Promise<ApiCollaborationRequest> {
    const res = await api.put(`/collaborations/${id}`, { status });
    return res.data.data.request;
  }
};
