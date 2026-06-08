"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPeerId } from "@/lib/ids";
import { buildRecordingStream, downloadBlob } from "@/lib/recording";
import { SignalingClient } from "@/lib/signaling";
import type { ChatMessage, Participant, PeerId, ServerSignal, SignalPeer } from "@/types/meeting";

const MAX_PARTICIPANTS = 10;

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

type UseMeetingOptions = {
  roomId: string;
  name: string;
};

export function useMeeting({ roomId, name }: UseMeetingOptions) {
  const peerId = useMemo(() => createPeerId(), []);
  const localStreamRef = useRef<MediaStream | null>(null);
  const signalingRef = useRef<SignalingClient | null>(null);
  const peersRef = useRef(new Map<PeerId, RTCPeerConnection>());
  const mediaStateRef = useRef({ muted: false, cameraOff: false, handRaised: false });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [networkQuality, setNetworkQuality] = useState<"good" | "fair" | "poor">("good");

  const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_URL ?? "ws://localhost:3001";

  const upsertParticipant = useCallback((participant: Participant) => {
    setParticipants((current) => {
      const exists = current.some((item) => item.id === participant.id);
      if (exists) {
        return current.map((item) => (item.id === participant.id ? { ...item, ...participant } : item));
      }
      return [...current, participant].slice(0, MAX_PARTICIPANTS);
    });
  }, []);

  const sendMediaState = useCallback(() => {
    signalingRef.current?.send({
      type: "media-state",
      roomId,
      from: peerId,
      ...mediaStateRef.current,
    });
  }, [peerId, roomId]);

  const createPeerConnection = useCallback(
    (remotePeer: SignalPeer) => {
      const existing = peersRef.current.get(remotePeer.peerId);
      if (existing) return existing;

      const connection = new RTCPeerConnection(rtcConfig);
      peersRef.current.set(remotePeer.peerId, connection);

      localStreamRef.current?.getTracks().forEach((track) => {
        connection.addTrack(track, localStreamRef.current as MediaStream);
      });

      connection.onicecandidate = (event) => {
        if (event.candidate) {
          signalingRef.current?.send({
            type: "ice-candidate",
            to: remotePeer.peerId,
            from: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      connection.ontrack = (event) => {
        upsertParticipant({
          id: remotePeer.peerId,
          name: remotePeer.name,
          stream: event.streams[0],
        });
      };

      connection.onconnectionstatechange = () => {
        const state = connection.connectionState;
        if (state === "failed" || state === "disconnected") {
          setNetworkQuality(state === "failed" ? "poor" : "fair");
        }
        if (state === "connected") {
          setNetworkQuality("good");
        }
      };

      upsertParticipant({ id: remotePeer.peerId, name: remotePeer.name });
      return connection;
    },
    [peerId, upsertParticipant],
  );

  const makeOffer = useCallback(
    async (remotePeer: SignalPeer) => {
      const connection = createPeerConnection(remotePeer);
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      signalingRef.current?.send({ type: "offer", to: remotePeer.peerId, from: peerId, sdp: offer });
    },
    [createPeerConnection, peerId],
  );

  const handleSignal = useCallback(
    async (message: ServerSignal) => {
      try {
        if (message.type === "welcome") {
          if (message.peers.length >= MAX_PARTICIPANTS) {
            setError("This room is full. Meetings support up to 10 participants.");
            return;
          }
          await Promise.all(message.peers.map(makeOffer));
        }

        if (message.type === "peer-joined") {
          upsertParticipant({ id: message.peer.peerId, name: message.peer.name });
        }

        if (message.type === "peer-left") {
          peersRef.current.get(message.peerId)?.close();
          peersRef.current.delete(message.peerId);
          setParticipants((current) => current.filter((participant) => participant.id !== message.peerId));
        }

        if (message.type === "offer") {
          const connection = createPeerConnection({ peerId: message.from, name: message.name ?? "Guest" });
          await connection.setRemoteDescription(message.sdp);
          const answer = await connection.createAnswer();
          await connection.setLocalDescription(answer);
          signalingRef.current?.send({ type: "answer", to: message.from, from: peerId, sdp: answer });
        }

        if (message.type === "answer") {
          const connection = peersRef.current.get(message.from);
          if (connection && !connection.currentRemoteDescription) {
            await connection.setRemoteDescription(message.sdp);
          }
        }

        if (message.type === "ice-candidate") {
          const connection = peersRef.current.get(message.from);
          if (connection) {
            await connection.addIceCandidate(message.candidate);
          }
        }

        if (message.type === "chat") {
          setMessages((current) => [
            ...current,
            {
              id: message.id,
              peerId: message.from,
              name: message.name,
              text: message.text,
              sentAt: message.sentAt,
              mine: message.from === peerId,
            },
          ]);
        }

        if (message.type === "media-state") {
          setParticipants((current) =>
            current.map((participant) =>
              participant.id === message.from
                ? {
                    ...participant,
                    muted: message.muted,
                    cameraOff: message.cameraOff,
                    handRaised: message.handRaised,
                  }
                : participant,
            ),
          );
        }

        if (message.type === "error") {
          setError(message.message);
        }
      } catch {
        setError("A meeting connection error occurred. Please refresh and try again.");
      }
    },
    [createPeerConnection, makeOffer, peerId, upsertParticipant],
  );

  useEffect(() => {
    let mounted = true;
    const peerConnections = peersRef.current;
    const client = new SignalingClient(signalingUrl);
    signalingRef.current = client;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) return;
        localStreamRef.current = stream;
        upsertParticipant({ id: peerId, name, stream, isLocal: true });

        client.connect();
        client.onMessage((message) => {
          void handleSignal(message);
        });
        client.send({ type: "join", roomId, peerId, name });
        setIsConnecting(false);
      } catch {
        setError("Camera or microphone permission was denied. Check browser permissions and reload.");
        setIsConnecting(false);
      }
    }

    void start();

    return () => {
      mounted = false;
      recorderRef.current?.stop();
      client.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnections.forEach((connection) => connection.close());
      peerConnections.clear();
    };
  }, [handleSignal, name, peerId, roomId, signalingUrl, upsertParticipant]);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const toggleMic = useCallback(() => {
    const nextMuted = !mediaStateRef.current.muted;
    mediaStateRef.current.muted = nextMuted;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    upsertParticipant({ id: peerId, name, muted: nextMuted, isLocal: true });
    sendMediaState();
  }, [name, peerId, sendMediaState, upsertParticipant]);

  const toggleCamera = useCallback(() => {
    const nextCameraOff = !mediaStateRef.current.cameraOff;
    mediaStateRef.current.cameraOff = nextCameraOff;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !nextCameraOff;
    });
    upsertParticipant({ id: peerId, name, cameraOff: nextCameraOff, isLocal: true });
    sendMediaState();
  }, [name, peerId, sendMediaState, upsertParticipant]);

  const toggleHand = useCallback(() => {
    mediaStateRef.current.handRaised = !mediaStateRef.current.handRaised;
    upsertParticipant({ id: peerId, name, handRaised: mediaStateRef.current.handRaised, isLocal: true });
    sendMediaState();
  }, [name, peerId, sendMediaState, upsertParticipant]);

  const replaceVideoTrack = useCallback(async (track: MediaStreamTrack) => {
    const stream = localStreamRef.current;
    if (!stream) return;

    stream.getVideoTracks().forEach((oldTrack) => {
      stream.removeTrack(oldTrack);
      oldTrack.stop();
    });
    stream.addTrack(track);

    peersRef.current.forEach((connection) => {
      const sender = connection.getSenders().find((item) => item.track?.kind === "video");
      void sender?.replaceTrack(track);
    });
  }, []);

  const shareScreen = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = screenStream.getVideoTracks()[0];
      await replaceVideoTrack(screenTrack);
      screenTrack.onended = async () => {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        await replaceVideoTrack(cameraStream.getVideoTracks()[0]);
      };
    } catch {
      setError("Screen sharing could not start. Your browser may have blocked the request.");
    }
  }, [replaceVideoTrack]);

  const sendChat = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        peerId,
        name,
        text: trimmed,
        sentAt: Date.now(),
        mine: true,
      };
      setMessages((current) => [...current, message]);
      signalingRef.current?.send({ type: "chat", roomId, from: peerId, name, text: trimmed, id: message.id, sentAt: message.sentAt });
    },
    [name, peerId, roomId],
  );

  const startRecording = useCallback(() => {
    try {
      const streams = participants.map((participant) => participant.stream).filter(Boolean) as MediaStream[];
      const stream = buildRecordingStream(streams);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8,opus" });
      recordingChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: "video/webm" });
        downloadBlob(blob, `lightmeet-${roomId}-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`);
        setIsRecording(false);
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setError("Recording could not start in this browser.");
    }
  }, [participants, roomId]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const leave = useCallback(() => {
    window.location.href = "/";
  }, []);

  return {
    peerId,
    participants,
    messages,
    error,
    isConnecting,
    isRecording,
    elapsedSeconds,
    networkQuality,
    toggleMic,
    toggleCamera,
    toggleHand,
    shareScreen,
    sendChat,
    startRecording,
    stopRecording,
    leave,
  };
}
