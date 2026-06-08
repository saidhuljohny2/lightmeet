export type PeerId = string;

export type Participant = {
  id: PeerId;
  name: string;
  stream?: MediaStream;
  isLocal?: boolean;
  muted?: boolean;
  cameraOff?: boolean;
  handRaised?: boolean;
};

export type ChatMessage = {
  id: string;
  peerId: PeerId;
  name: string;
  text: string;
  sentAt: number;
  mine?: boolean;
};

export type SignalPeer = {
  peerId: PeerId;
  name: string;
};

export type ClientSignal =
  | { type: "join"; roomId: string; peerId: PeerId; name: string }
  | { type: "offer"; to: PeerId; from: PeerId; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; to: PeerId; from: PeerId; sdp: RTCSessionDescriptionInit }
  | { type: "ice-candidate"; to: PeerId; from: PeerId; candidate: RTCIceCandidateInit }
  | { type: "chat"; roomId: string; from: PeerId; name: string; text: string; id: string; sentAt: number }
  | { type: "media-state"; roomId: string; from: PeerId; muted: boolean; cameraOff: boolean; handRaised: boolean };

export type ServerSignal =
  | { type: "welcome"; peers: SignalPeer[] }
  | { type: "peer-joined"; peer: SignalPeer }
  | { type: "peer-left"; peerId: PeerId }
  | { type: "offer"; to: PeerId; from: PeerId; name?: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; to: PeerId; from: PeerId; sdp: RTCSessionDescriptionInit }
  | { type: "ice-candidate"; to: PeerId; from: PeerId; candidate: RTCIceCandidateInit }
  | { type: "chat"; from: PeerId; name: string; text: string; id: string; sentAt: number }
  | { type: "media-state"; from: PeerId; muted: boolean; cameraOff: boolean; handRaised: boolean }
  | { type: "error"; message: string };
