"use client";

import { useEffect, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { Controls } from "@/components/Controls";
import { VideoTile } from "@/components/VideoTile";
import { useMeeting } from "@/hooks/useMeeting";
import { MAX_PARTICIPANTS } from "@/lib/config";

type MeetingRoomProps = {
  roomId: string;
};

export function MeetingRoom({ roomId }: MeetingRoomProps) {
  const [name, setName] = useState("Guest");
  const [meetingLink, setMeetingLink] = useState("");

  useEffect(() => {
    setName(window.sessionStorage.getItem("lightmeet-name") ?? "Guest");
    setMeetingLink(window.location.href);
  }, []);

  const meeting = useMeeting({ roomId, name });
  const [copied, setCopied] = useState(false);
  const localParticipant = meeting.participants.find((participant) => participant.isLocal);

  async function copyLink() {
    await navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="flex min-h-screen flex-col bg-obsidian text-white">
      <header className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.07] px-4 py-3 shadow-control backdrop-blur-xl sm:mx-6 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-white text-sm font-bold text-obsidian">LM</span>
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Meeting room</div>
            <h1 className="break-all text-lg font-semibold">{roomId}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={`${meeting.participants.length}/${MAX_PARTICIPANTS}`} tone="neutral" />
          <StatusPill label={meeting.networkQuality} tone={meeting.networkQuality === "good" ? "good" : meeting.networkQuality === "fair" ? "fair" : "bad"} />
          <button className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15" onClick={copyLink}>
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </header>

      {meeting.error ? (
        <div className="mx-4 mt-4 rounded-md border border-orange-300/30 bg-orange-400/10 px-4 py-3 text-sm text-orange-100 sm:mx-6">
          {meeting.error}
        </div>
      ) : null}

      <section className="grid flex-1 gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-h-[55vh] flex-col gap-4">
          <div className="grid flex-1 auto-rows-[230px] gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {meeting.isConnecting ? (
              <div className="grid rounded-lg border border-white/10 bg-white/[0.06] text-slate-300 sm:col-span-2 xl:col-span-3">
                <span className="m-auto">Connecting media and signaling...</span>
              </div>
            ) : (
              meeting.participants.map((participant) => <VideoTile key={participant.id} participant={participant} />)
            )}
          </div>

          <Controls
            elapsedSeconds={meeting.elapsedSeconds}
            isCameraOff={Boolean(localParticipant?.cameraOff)}
            isHandRaised={Boolean(localParticipant?.handRaised)}
            isMuted={Boolean(localParticipant?.muted)}
            isRecording={meeting.isRecording}
            onLeave={meeting.leave}
            onRecord={meeting.isRecording ? meeting.stopRecording : meeting.startRecording}
            onShareScreen={meeting.shareScreen}
            onToggleCamera={meeting.toggleCamera}
            onToggleHand={meeting.toggleHand}
            onToggleMic={meeting.toggleMic}
          />
        </div>

        <ChatPanel messages={meeting.messages} onSend={meeting.sendChat} />
      </section>
    </main>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "neutral" | "good" | "fair" | "bad" }) {
  const colors = {
    neutral: "border-white/10 bg-white/10 text-slate-100",
    good: "border-emerald-300/30 bg-emerald-400/15 text-emerald-100",
    fair: "border-orange-300/30 bg-orange-400/15 text-orange-100",
    bad: "border-red-300/30 bg-red-400/15 text-red-100",
  };

  return <span className={`rounded-md border px-3 py-2 text-sm font-semibold capitalize ${colors[tone]}`}>{label}</span>;
}
