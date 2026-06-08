import { WebSocketServer } from "ws";
import { createHmac, timingSafeEqual } from "crypto";
import { MAX_PARTICIPANTS } from "./config/meeting.mjs";

const port = Number(process.env.PORT ?? 3001);
const authSecret = process.env.AUTH_SECRET ?? "dev-lightmeet-change-this-secret";
const server = new WebSocketServer({ port });
const rooms = new Map();
const clients = new Map();

function send(socket, message) {
  if (socket?.readyState === socket?.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function broadcast(roomId, message, exceptPeerId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.forEach((client, peerId) => {
    if (peerId !== exceptPeerId) send(client.socket, message);
  });
}

function verifyAdminSignalToken(token) {
  if (!token) return false;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const expected = createHmac("sha256", authSecret).update(encodedPayload).digest("base64url");
  const valueBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (valueBuffer.length !== expectedBuffer.length || !timingSafeEqual(valueBuffer, expectedBuffer)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    return payload.role === "admin" && payload.purpose === "signaling" && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
}

server.on("connection", (socket) => {
  socket.on("message", (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      send(socket, { type: "error", message: "Invalid JSON message." });
      return;
    }

    if (message.type === "join") {
      const room = rooms.get(message.roomId) ?? new Map();
      if (room.size >= MAX_PARTICIPANTS) {
        send(socket, { type: "error", message: "Room is full." });
        socket.close();
        return;
      }

      rooms.set(message.roomId, room);
      const requestedRole = message.role === "admin" && verifyAdminSignalToken(message.adminToken) ? "admin" : "student";
      const peers = [...room.values()].map((client) => ({ peerId: client.peerId, name: client.name, role: client.role }));
      const client = { socket, peerId: message.peerId, name: message.name, role: requestedRole, roomId: message.roomId };
      room.set(message.peerId, client);
      clients.set(socket, client);

      send(socket, { type: "welcome", peers });
      broadcast(message.roomId, { type: "peer-joined", peer: { peerId: message.peerId, name: message.name, role: client.role } }, message.peerId);
      return;
    }

    const client = clients.get(socket);
    if (!client) {
      send(socket, { type: "error", message: "Join a room before sending signals." });
      return;
    }

    if (message.type === "chat" || message.type === "media-state") {
      broadcast(client.roomId, message, client.peerId);
      return;
    }

    if (message.type === "admin-control") {
      if (client.role !== "admin") {
        send(socket, { type: "error", message: "Only the admin can control participants." });
        return;
      }
      const target = rooms.get(client.roomId)?.get(message.to);
      send(target?.socket, { type: "admin-control", from: client.peerId, action: message.action });
      return;
    }

    if (message.to) {
      const target = rooms.get(client.roomId)?.get(message.to);
      send(target?.socket, { ...message, name: client.name });
    }
  });

  socket.on("close", () => {
    const client = clients.get(socket);
    if (!client) return;

    clients.delete(socket);
    const room = rooms.get(client.roomId);
    room?.delete(client.peerId);
    if (room && room.size === 0) rooms.delete(client.roomId);
    broadcast(client.roomId, { type: "peer-left", peerId: client.peerId }, client.peerId);
  });
});

console.log(`LightMeet signaling server running on ws://localhost:${port}`);
