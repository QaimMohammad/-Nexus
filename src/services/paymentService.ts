import api from './api';
import { User } from '../types';

export interface ApiTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  direction: 'in' | 'out';
  status: 'pending' | 'completed' | 'failed';
  note: string;
  failureReason?: string;
  reference: string;
  counterparty?: User;
  createdAt: string;
}

export const paymentService = {
  async getWallet(): Promise<{ balance: number; currency: string }> {
    const res = await api.get('/payments/wallet');
    return res.data.data;
  },

  async deposit(amount: number, note?: string) {
    const res = await api.post('/payments/deposit', { amount, note });
    return res.data.data as { transaction: ApiTransaction; balance: number };
  },

  async withdraw(amount: number, note?: string) {
    const res = await api.post('/payments/withdraw', { amount, note });
    return res.data.data as { transaction: ApiTransaction; balance: number };
  },

  async transfer(recipientId: string, amount: number, note?: string) {
    const res = await api.post('/payments/transfer', { recipientId, amount, note });
    return res.data.data as { transaction: ApiTransaction; balance: number };
  },

  async listTransactions(): Promise<ApiTransaction[]> {
    const res = await api.get('/payments/transactions');
    return res.data.data.transactions;
  }
};
