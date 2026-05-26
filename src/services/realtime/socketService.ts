import {io, Socket} from 'socket.io-client';
import {APP_CONFIG} from '../../shared/constants';

let socket: Socket | null = null;

export const socketService = {
  connect(token: string): Socket {
    if (socket?.connected) {
      return socket;
    }

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }

    socket = io(APP_CONFIG.socketUrl, {
      auth: {token},
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    return socket;
  },

  disconnect(): void {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
  },

  getSocket(): Socket | null {
    return socket;
  },
};
