import { io, Socket } from "socket.io-client";

type ServerToClientEvents = {
  userJoined: (username: string, totalUsers: number) => void;
  userLeft: (username: string, totalUsers: number) => void;
  chatMessage: (message: ChatMessage) => void;
  roomUsers: (users: string[]) => void;
  error: (message: string) => void;
};

type ClientToServerEvents = {
  joinRoom: (
    username: string,
    room: string,
    callback: (success: boolean, message?: string) => void,
  ) => void;
  sendMessage: (message: string, callback: (success: boolean) => void) => void;
  leaveRoom: (callback: (success: boolean) => void) => void;
  typing: (isTyping: boolean) => void;
};

export type ChatMessage = {
  username: string;
  text: string;
  room: string;
  timestamp: number;
};

export class ChatRoomClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  private _isConnected = false;
  private _username: string = "";
  private _currentRoom: string = "";
  private _messages: ChatMessage[] = [];
  private _users: string[] = [];
  private _typing: Set<string> = new Set();

  constructor(serverUrl: string = "http://localhost:8000", options = {}) {
    this.socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      ...options,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.socket.on("connect", () => {
      this._isConnected = true;
      console.info(`Connected to server with socket ID: ${this.socket.id}`);
    });

    this.socket.on("disconnect", () => {
      this._isConnected = false;
      this._currentRoom = "";
      this._users = [];
      this._typing.clear();
      console.info("Disconnected from server");
    });

    this.socket.on("userJoined", (username, totalUsers) => {
      console.info(`${username} joined the room. Total users: ${totalUsers}`);
      if (username !== this._username) {
        this._users.push(username);
      }
    });

    this.socket.on("userLeft", (username, totalUsers) => {
      console.info(`${username} left the room. Total users: ${totalUsers}`);
      this._users = this._users.filter((user) => user !== username);
    });

    this.socket.on("chatMessage", (message) => {
      console.info(`New message from ${message.username}: ${message.text}`);
      this._messages.push(message);
    });

    this.socket.on("roomUsers", (users) => {
      console.info("-----------__>", users);
      this._users = users;
    });

    this.socket.on("error", (message) => {
      console.error(`Server error: ${message}`);
    });
  }

  public joinRoom(username: string, room: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this._isConnected) {
        console.error("Not connected to server");
        resolve(false);
        return;
      }

      this.socket.emit("joinRoom", username, room, (success, message) => {
        if (success) {
          this._username = username;
          this._currentRoom = room;
          console.info(`Joined room: ${room}`);
          resolve(true);
        } else {
          console.error(`Failed to join room: ${message}`);
          resolve(false);
        }
      });
    });
  }

  public sendMessage(text: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this._isConnected || !this._currentRoom) {
        console.error("Not connected or not in a room");
        resolve(false);
        return;
      }

      this.socket.emit("sendMessage", text, (success) => {
        if (success) {
          console.info("Message sent successfully");
        } else {
          console.error("Failed to send message");
        }
        resolve(success);
      });
    });
  }

  public leaveRoom(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this._isConnected || !this._currentRoom) {
        console.error("Not connected or not in a room");
        resolve(false);
        return;
      }

      this.socket.emit("leaveRoom", (success) => {
        if (success) {
          console.info(`Left room: ${this._currentRoom}`);
          this._currentRoom = "";
          this._users = [];
        } else {
          console.error("Failed to leave room");
        }
        resolve(success);
      });
    });
  }

  public setTyping(isTyping: boolean): void {
    if (!this._isConnected || !this._currentRoom) {
      return;
    }

    this.socket.emit("typing", isTyping);
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get username(): string {
    return this._username;
  }

  get currentRoom(): string {
    return this._currentRoom;
  }

  get messages(): ChatMessage[] {
    return [...this._messages];
  }

  get users(): string[] {
    return [...this._users];
  }
}
