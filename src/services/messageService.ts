import api from './api';
import { Message, User } from '../types';

export interface ApiConversation {
  user: User;
  unreadCount: number;
  lastMessage: Message;
}

export const messageService = {
  async listConversations(): Promise<ApiConversation[]> {
    const res = await api.get('/messages/conversations');
    return res.data.data.conversations;
  },

  async getMessagesWith(userId: string): Promise<Message[]> {
    const res = await api.get(`/messages/${userId}`);
    return res.data.data.messages;
  },

  async sendMessage(receiverId: string, content: string): Promise<Message> {
    const res = await api.post('/messages', { receiverId, content });
    return res.data.data.message;
  }
};
