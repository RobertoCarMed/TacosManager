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

    socket = io(APP_CONFIG.baseApiUrl, {
      auth: {token},
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
