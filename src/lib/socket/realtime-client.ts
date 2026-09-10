import { io, type Socket } from 'socket.io-client';

export class RealtimeClient {
  private socket: Socket | undefined;

  connect(endpoint: string) {
    this.disconnect();
    this.socket = io(endpoint, { autoConnect: false });
    this.socket.connect();
    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = undefined;
  }

  getSocket() {
    return this.socket;
  }
}

export const realtimeClient = new RealtimeClient();
