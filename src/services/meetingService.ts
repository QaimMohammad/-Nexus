import api from './api';
import { User } from '../types';

export interface ApiMeeting {
  id: string;
  organizer: User;
  participant: User;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  roomId: string;
  createdAt: string;
}

export const meetingService = {
  async createMeeting(input: {
    participantId: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
  }): Promise<ApiMeeting> {
    const res = await api.post('/meetings', input);
    return res.data.data.meeting;
  },

  async listMeetings(params?: { from?: string; to?: string; status?: string }): Promise<ApiMeeting[]> {
    const res = await api.get('/meetings', { params });
    return res.data.data.meetings;
  },

  async respond(id: string, status: 'accepted' | 'rejected'): Promise<ApiMeeting> {
    const res = await api.put(`/meetings/${id}/respond`, { status });
    return res.data.data.meeting;
  },

  async cancel(id: string): Promise<ApiMeeting> {
    const res = await api.put(`/meetings/${id}/cancel`);
    return res.data.data.meeting;
  }
};
