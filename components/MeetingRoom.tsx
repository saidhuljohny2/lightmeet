"use client";

import { useEffect, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { Controls } from "@/components/Controls";
import { VideoTile } from "@/components/VideoTile";
import { useMeeting } from "@/hooks/useMeeting";

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
    <main className="flex min-h-screen flex-col bg-[#eef3f8] text-ink dark:bg-[#070b14] dark:text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Meeting ID</div>
          <h1 className="break-all text-lg font-semibold">{roomId}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={`${meeting.participants.length}/10`} tone="neutral" />
          <StatusPill label={meeting.networkQuality} tone={meeting.networkQuality === "good" ? "good" : meeting.networkQuality === "fair" ? "fair" : "bad"} />
          <button className="rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900" onClick={copyLink}>
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </header>

      {meeting.error ? (
        <div className="mx-4 mt-4 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-100">
          {meeting.error}
        </div>
      ) : null}

      <section className="grid flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-h-[55vh] flex-col gap-4">
          <div className="grid flex-1 auto-rows-[220px] gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {meeting.isConnecting ? (
              <div className="grid rounded-lg border border-line bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 sm:col-span-2 xl:col-span-3">
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
    neutral: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    fair: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-100",
    bad: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
  };

  return <span className={`rounded-md border px-3 py-2 text-sm font-medium capitalize ${colors[tone]}`}>{label}</span>;
}
