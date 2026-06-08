"use client";

import { useEffect, useRef } from "react";
import { getInitials } from "@/lib/ids";
import type { Participant } from "@/types/meeting";

type VideoTileProps = {
  participant: Participant;
};

export function VideoTile({ participant }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  return (
    <article className="relative overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-control">
      {participant.stream && !participant.cameraOff ? (
        <video ref={videoRef} autoPlay playsInline muted={participant.isLocal} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center bg-slate-900">
          <div className="grid h-20 w-20 place-items-center rounded-md bg-gradient-to-br from-blue-500 to-emerald-400 text-2xl font-bold text-white shadow-control">
            {getInitials(participant.name)}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
        <span className="min-w-0 truncate text-sm font-medium">
          {participant.name}
          {participant.isLocal ? " (you)" : ""}
        </span>
        <div className="flex shrink-0 items-center gap-1 text-xs">
          {participant.handRaised ? <span className="rounded bg-amber-400 px-2 py-1 font-semibold text-slate-950">✋</span> : null}
          {participant.muted ? <span className="rounded bg-white/15 px-2 py-1">Muted</span> : null}
        </div>
      </div>

      {participant.handRaised ? (
        <div className="absolute right-3 top-3 rounded-md bg-amber-400 px-3 py-2 text-2xl shadow-lg" aria-label={`${participant.name} raised a hand`}>
          ✋
        </div>
      ) : null}
    </article>
  );
}
