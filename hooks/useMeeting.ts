"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAX_PARTICIPANTS } from "@/lib/config";
import { createPeerId } from "@/lib/ids";
import { buildRecordingStream, downloadBlob, getSupportedRecordingFormat, type RecordingFormat } from "@/lib/recording";
import { SignalingClient } from "@/lib/signaling";
import type { ChatMessage, Participant, PeerId, ServerSignal, SignalPeer } from "@/types/meeting";

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

type UseMeetingOptions = {
  roomId: string;
  name: string;
  isAdmin: boolean;
  enabled?: boolean;
};

export function useMeeting({ roomId, name, isAdmin, enabled = true }: UseMeetingOptions) {
  const peerId = useMemo(() => createPeerId(), []);
  const localStreamRef = useRef<MediaStream | null>(null);
  const signalingRef = useRef<SignalingClient | null>(null);
  const peersRef = useRef(new Map<PeerId, RTCPeerConnection>());
  const mediaStateRef = useRef({ muted: false, cameraOff: false, handRaised: false });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingDownloadedRef = useRef(false);
  const recordingFormatRef = useRef<RecordingFormat>(getSupportedRecordingFormat());
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

  const applyLocalMediaState = useCallback(
    (nextState: Partial<{ muted: boolean; cameraOff: boolean; handRaised: boolean }>) => {
      mediaStateRef.current = { ...mediaStateRef.current, ...nextState };
      localStreamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = !mediaStateRef.current.muted;
      });
      localStreamRef.current?.getVideoTracks().forEach((track) => {
        track.enabled = !mediaStateRef.current.cameraOff;
      });
      upsertParticipant({
        id: peerId,
        name,
        muted: mediaStateRef.current.muted,
        cameraOff: mediaStateRef.current.cameraOff,
        handRaised: mediaStateRef.current.handRaised,
        isLocal: true,
        role: isAdmin ? "admin" : "student",
      });
      sendMediaState();
    },
    [isAdmin, name, peerId, sendMediaState, upsertParticipant],
  );

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
          role: remotePeer.role,
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

      upsertParticipant({ id: remotePeer.peerId, name: remotePeer.name, role: remotePeer.role });
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
            setError(`This room is full. Meetings support up to ${MAX_PARTICIPANTS} participants.`);
            return;
          }
          await Promise.all(message.peers.map(makeOffer));
        }

        if (message.type === "peer-joined") {
          upsertParticipant({ id: message.peer.peerId, name: message.peer.name, role: message.peer.role });
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

        if (message.type === "admin-control") {
          if (message.action === "mute") {
            applyLocalMediaState({ muted: true });
            setError("The admin muted your microphone.");
          }
          if (message.action === "camera-off") {
            applyLocalMediaState({ cameraOff: true });
            setError("The admin turned your camera off.");
          }
          if (message.action === "remove") {
            setError("The admin removed you from the meeting.");
            window.setTimeout(() => {
              window.location.href = "/";
            }, 900);
          }
        }

        if (message.type === "error") {
          setError(message.message);
        }
      } catch {
        setError("A meeting connection error occurred. Please refresh and try again.");
      }
    },
    [applyLocalMediaState, createPeerConnection, makeOffer, peerId, upsertParticipant],
  );

  const downloadRecording = useCallback(() => {
    if (recordingDownloadedRef.current) return;
    recordingDownloadedRef.current = true;
    const format = recordingFormatRef.current;
    const blob = new Blob(recordingChunksRef.current, { type: format.mimeType });
    if (blob.size > 0) {
      downloadBlob(blob, `lightmeet-${roomId}-${new Date().toISOString().replace(/[:.]/g, "-")}.${format.extension}`);
    }
    setIsRecording(false);
  }, [roomId]);

  const stopRecordingAndDownload = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;
    const peerConnections = peersRef.current;
    const client = new SignalingClient(signalingUrl);
    signalingRef.current = client;

    async function start() {
      try {
        const adminToken = isAdmin ? await getAdminSignalToken() : undefined;
        if (isAdmin && !adminToken) {
          setError("Admin signaling token could not be created. Please sign in again.");
          setIsConnecting(false);
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) return;
        localStreamRef.current = stream;
        upsertParticipant({ id: peerId, name, stream, isLocal: true, role: isAdmin ? "admin" : "student" });

        client.connect();
        client.onMessage((message) => {
          void handleSignal(message);
        });
        client.send({ type: "join", roomId, peerId, name, role: isAdmin ? "admin" : "student", adminToken });
        setIsConnecting(false);
      } catch {
        setError("Camera or microphone permission was denied. Check browser permissions and reload.");
        setIsConnecting(false);
      }
    }

    void start();

    return () => {
      mounted = false;
      void stopRecordingAndDownload();
      client.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnections.forEach((connection) => connection.close());
      peerConnections.clear();
    };
  }, [enabled, handleSignal, isAdmin, name, peerId, roomId, signalingUrl, stopRecordingAndDownload, upsertParticipant]);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function handlePageHide() {
      void stopRecordingAndDownload();
    }

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [stopRecordingAndDownload]);

  const toggleMic = useCallback(() => {
    applyLocalMediaState({ muted: !mediaStateRef.current.muted });
  }, [applyLocalMediaState]);

  const toggleCamera = useCallback(() => {
    applyLocalMediaState({ cameraOff: !mediaStateRef.current.cameraOff });
  }, [applyLocalMediaState]);

  const toggleHand = useCallback(() => {
    applyLocalMediaState({ handRaised: !mediaStateRef.current.handRaised });
  }, [applyLocalMediaState]);

  const sendAdminControl = useCallback(
    (to: PeerId, action: "mute" | "camera-off" | "remove") => {
      if (!isAdmin) return;
      signalingRef.current?.send({ type: "admin-control", roomId, from: peerId, to, action });
      if (action === "remove") {
        peersRef.current.get(to)?.close();
        peersRef.current.delete(to);
        setParticipants((current) => current.filter((participant) => participant.id !== to));
      }
    },
    [isAdmin, peerId, roomId],
  );

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
      const format = getSupportedRecordingFormat();
      recordingFormatRef.current = format;
      const recorder = new MediaRecorder(stream, { mimeType: format.mimeType });
      recordingChunksRef.current = [];
      recordingDownloadedRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        downloadRecording();
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setError("Recording could not start in this browser.");
    }
  }, [downloadRecording, participants]);

  const stopRecording = useCallback(() => {
    void stopRecordingAndDownload();
  }, [stopRecordingAndDownload]);

  const leave = useCallback(async () => {
    await stopRecordingAndDownload();
    window.location.href = "/";
  }, [stopRecordingAndDownload]);

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
    sendAdminControl,
    isAdmin,
  };
}

async function getAdminSignalToken() {
  const response = await fetch("/api/auth/signal-token");
  if (!response.ok) return undefined;
  const body = (await response.json()) as { token?: string };
  return body.token;
}
