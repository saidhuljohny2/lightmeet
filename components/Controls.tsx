"use client";

type ControlsProps = {
  elapsedSeconds: number;
  isMuted: boolean;
  isCameraOff: boolean;
  isRecording: boolean;
  isHandRaised: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onShareScreen: () => void;
  onRecord: () => void;
  onToggleHand: () => void;
  onLeave: () => void;
};

export function Controls({
  elapsedSeconds,
  isMuted,
  isCameraOff,
  isRecording,
  isHandRaised,
  onToggleMic,
  onToggleCamera,
  onShareScreen,
  onRecord,
  onToggleHand,
  onLeave,
}: ControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.08] p-3 shadow-control backdrop-blur-xl">
      <span className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold tabular-nums text-white">{formatTime(elapsedSeconds)}</span>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <ControlButton active={isMuted} label={isMuted ? "Unmute" : "Mute"} onClick={onToggleMic} />
        <ControlButton active={isCameraOff} label={isCameraOff ? "Camera on" : "Camera off"} onClick={onToggleCamera} />
        <ControlButton label="Share screen" onClick={onShareScreen} />
        <ControlButton active={isRecording} label={isRecording ? "⏺ Stop rec" : "⏺ Record"} onClick={onRecord} />
        <ControlButton active={isHandRaised} label={isHandRaised ? "✋ Lower hand" : "✋ Raise hand"} onClick={onToggleHand} />
      </div>
      <button className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-control transition hover:bg-red-600" onClick={onLeave}>
        Leave
      </button>
    </div>
  );
}

function ControlButton({ active, label, onClick }: { active?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
        active ? "border-blue-300/40 bg-blue-400/20 text-blue-100" : "border-white/10 bg-white/10 text-white hover:bg-white/15"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
