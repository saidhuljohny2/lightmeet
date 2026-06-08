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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold tabular-nums dark:bg-slate-900">{formatTime(elapsedSeconds)}</span>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <ControlButton active={isMuted} label={isMuted ? "Unmute" : "Mute"} onClick={onToggleMic} />
        <ControlButton active={isCameraOff} label={isCameraOff ? "Camera on" : "Camera off"} onClick={onToggleCamera} />
        <ControlButton label="Share screen" onClick={onShareScreen} />
        <ControlButton active={isRecording} label={isRecording ? "Stop rec" : "Record"} onClick={onRecord} />
        <ControlButton active={isHandRaised} label={isHandRaised ? "Lower hand" : "Raise hand"} onClick={onToggleHand} />
      </div>
      <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700" onClick={onLeave}>
        Leave
      </button>
    </div>
  );
}

function ControlButton({ active, label, onClick }: { active?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
        active
          ? "border-brand bg-blue-50 text-brand dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100"
          : "border-line bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900"
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
