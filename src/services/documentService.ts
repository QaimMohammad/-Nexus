import api from './api';
import { User } from '../types';

export interface ApiDocument {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  owner: User;
  sharedWith: User[];
  version: number;
  status: 'draft' | 'in_review' | 'final' | 'signed';
  signatures: { user: User; signedAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export const documentService = {
  async upload(file: File, name?: string): Promise<ApiDocument> {
    const form = new FormData();
    form.append('file', file);
    if (name) form.append('name', name);
    const res = await api.post('/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data.document;
  },

  async list(): Promise<ApiDocument[]> {
    const res = await api.get('/documents');
    return res.data.data.documents;
  },

  /** Returns a blob URL suitable for download links or inline preview (PDF viewer). */
  async download(id: string, inline = false): Promise<string> {
    const res = await api.get(`/documents/${id}/download`, {
      params: inline ? { inline: 'true' } : {},
      responseType: 'blob'
    });
    return URL.createObjectURL(res.data);
  },

  async share(id: string, userId: string): Promise<ApiDocument> {
    const res = await api.put(`/documents/${id}/share`, { userId });
    return res.data.data.document;
  },

  /** signature: base64 data URL of the signature image */
  async sign(id: string, signature: string): Promise<ApiDocument> {
    const res = await api.post(`/documents/${id}/sign`, { signature });
    return res.data.data.document;
  },

  async update(id: string, updates: { name?: string; status?: string }): Promise<ApiDocument> {
    const res = await api.put(`/documents/${id}`, updates);
    return res.data.data.document;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  }
};
