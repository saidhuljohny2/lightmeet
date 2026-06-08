"use client";

import type { Participant, PeerId } from "@/types/meeting";

type AdminPanelProps = {
  participants: Participant[];
  onControl: (peerId: PeerId, action: "mute" | "camera-off" | "remove") => void;
};

export function AdminPanel({ participants, onControl }: AdminPanelProps) {
  const students = participants.filter((participant) => !participant.isLocal);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.08] p-4 shadow-control backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-white">Admin controls</h2>
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs text-slate-300">{students.length} students</span>
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-slate-400">Student controls appear when participants join.</p>
      ) : (
        <div className="space-y-3">
          {students.map((student) => (
            <div key={student.id} className="rounded-md border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{student.name}</div>
                  <div className="text-xs text-slate-400">{student.role ?? "student"}</div>
                </div>
                {student.handRaised ? <span className="rounded bg-amber-400 px-2 py-1 text-xs font-semibold text-slate-950">✋</span> : null}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <AdminButton label="Mute" onClick={() => onControl(student.id, "mute")} />
                <AdminButton label="Camera" onClick={() => onControl(student.id, "camera-off")} />
                <button className="rounded-md bg-red-500 px-2 py-2 text-xs font-semibold text-white transition hover:bg-red-600" onClick={() => onControl(student.id, "remove")} type="button">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AdminButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="rounded-md border border-white/10 bg-white/10 px-2 py-2 text-xs font-semibold text-white transition hover:bg-white/15" onClick={onClick} type="button">
      {label}
    </button>
  );
}
