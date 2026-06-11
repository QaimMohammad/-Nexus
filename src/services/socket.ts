import { io, Socket } from 'socket.io-client';
import { API_URL, TOKEN_STORAGE_KEY } from './api';

let socket: Socket | null = null;

/**
 * Returns the shared Socket.IO connection, creating it on first use.
 * Used for presence, real-time chat, and WebRTC call signaling.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      auth: { token: localStorage.getItem(TOKEN_STORAGE_KEY) },
      autoConnect: true
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
