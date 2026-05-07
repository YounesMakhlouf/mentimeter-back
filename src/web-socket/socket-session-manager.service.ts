import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";

@Injectable()
export class SocketSessions {
  private sessions: Map<string, Socket> = new Map();

  getSocket(id: string) {
    return this.sessions.get(id);
  }

  setSocket(userPseudo: string, socket: Socket) {
    this.sessions.set(userPseudo, socket);
  }

  removeSocket(userPseudo: string) {
    this.sessions.delete(userPseudo);
  }

  getSockets(): Map<string, Socket> {
    return this.sessions;
  }

  getUserPseudo(socketId: string): string {
    return [...this.sessions.entries()].find(([_, s]) => s.id === socketId)[0];
  }
}
