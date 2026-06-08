import type { ClientSignal, ServerSignal } from "@/types/meeting";

type SignalHandler = (message: ServerSignal) => void;

export class SignalingClient {
  private socket?: WebSocket;
  private listeners = new Set<SignalHandler>();

  constructor(private readonly url: string) {}

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.addEventListener("message", (event) => {
      try {
        this.emit(JSON.parse(event.data) as ServerSignal);
      } catch {
        this.emit({ type: "error", message: "Received an invalid signaling message." });
      }
    });

    this.socket.addEventListener("error", () => {
      this.emit({ type: "error", message: "Could not reach the signaling server." });
    });
  }

  onMessage(handler: SignalHandler) {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  send(message: ClientSignal) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return;
    }

    this.socket?.addEventListener(
      "open",
      () => {
        this.socket?.send(JSON.stringify(message));
      },
      { once: true },
    );
  }

  close() {
    this.socket?.close();
    this.listeners.clear();
  }

  private emit(message: ServerSignal) {
    this.listeners.forEach((listener) => listener(message));
  }
}
