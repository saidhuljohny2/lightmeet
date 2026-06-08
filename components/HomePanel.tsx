"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createMeetingId } from "@/lib/ids";

export function HomePanel() {
  const router = useRouter();
  const [suggestedName, setSuggestedName] = useState("Guest");
  const [meetingId, setMeetingId] = useState("");
  const [name, setName] = useState("");
  const displayName = name.trim() || suggestedName;

  useEffect(() => {
    setSuggestedName(`Guest ${Math.floor(Math.random() * 900 + 100)}`);
  }, []);

  function saveName() {
    window.sessionStorage.setItem("lightmeet-name", displayName);
  }

  function createMeeting() {
    saveName();
    router.push(`/meeting/${createMeetingId()}`);
  }

  function joinMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = meetingId.trim();
    if (!normalized) return;
    saveName();
    router.push(`/meeting/${encodeURIComponent(normalized)}`);
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-ink dark:bg-[#0b1120] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-brand text-sm font-bold text-white">LM</span>
            <span className="text-lg font-semibold">LightMeet</span>
          </div>
          <span className="rounded-md border border-line bg-white px-3 py-1 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            WebRTC mesh
          </span>
        </nav>

        <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-brand">Private live sessions</p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">Lightweight online meetings.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Create a room, share the link, and talk directly through peer-to-peer video. No accounts, no database, no cloud recordings.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3 text-sm text-slate-600 dark:text-slate-300">
              <Metric label="Participants" value="10" />
              <Metric label="Storage" value="Local" />
              <Metric label="Deploy" value="Vercel" />
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-900">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="name">
              Display name
            </label>
            <input
              id="name"
              className="mb-4 w-full rounded-md border border-line bg-white px-3 py-3 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
              placeholder={suggestedName}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

            <button
              className="mb-5 flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
              onClick={createMeeting}
              type="button"
            >
              <span aria-hidden>+</span>
              Create Meeting
            </button>

            <form className="space-y-3" onSubmit={joinMeeting}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="meetingId">
                Join with Meeting ID
              </label>
              <input
                id="meetingId"
                className="w-full rounded-md border border-line bg-white px-3 py-3 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                placeholder="example: abc123-def456"
                value={meetingId}
                onChange={(event) => setMeetingId(event.target.value)}
              />
              <button
                className="w-full rounded-md border border-line px-4 py-3 font-semibold transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                type="submit"
              >
                Join Meeting
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="text-xl font-bold text-ink dark:text-white">{value}</div>
      <div className="mt-1 text-xs">{label}</div>
    </div>
  );
}
