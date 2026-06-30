export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  createdAt?: string;
}

export interface Meeting {
  _id: string;
  title: string;
  description?: string;
  meetingCode: string;
  host: User | string;
  status: 'scheduled' | 'active' | 'ended';
  startTime: string;
  endTime?: string;
  settings: {
    isMutedByDefault: boolean;
    isCameraOffByDefault: boolean;
    requireWaitingRoom: boolean;
  };
  createdAt?: string;
}

export interface Participant {
  _id: string;
  meeting: string | Meeting;
  user: User;
  role: 'host' | 'cohost' | 'participant';
  status: 'waiting' | 'joined' | 'left' | 'rejected';
  joinTime?: string;
  leaveTime?: string;
  isMuted: boolean;
  isCameraOff: boolean;
  handRaised: boolean;
}

export interface FileAttachment {
  _id: string;
  originalName: string;
  fileName: string;
  path: string;
  mimeType: string;
  size: number;
  uploader: string | User;
  meeting: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  meeting: string;
  sender: User;
  messageType: 'text' | 'file';
  text?: string;
  file?: FileAttachment;
  createdAt: string;
}

export interface WhiteboardElement {
  id: string;
  type: 'pen' | 'highlighter' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'sticky';
  points?: [number, number][]; // for lines/drawings
  x?: number; // for shapes / text
  y?: number;
  width?: number;
  height?: number;
  color: string;
  size: number;
  text?: string;
}

export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface SocketPeer {
  socketId: string;
  user: User;
}
