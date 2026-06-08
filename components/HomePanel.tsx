"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCalendarFile, downloadCalendarFile, type CalendarRecurrence } from "@/lib/calendar";
import { MAX_PARTICIPANTS } from "@/lib/config";
import { createMeetingId } from "@/lib/ids";

export function HomePanel() {
  const router = useRouter();
  const [suggestedName, setSuggestedName] = useState("Guest");
  const [meetingId, setMeetingId] = useState("");
  const [name, setName] = useState("");
  const [scheduleTitle, setScheduleTitle] = useState("LightMeet session");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<CalendarRecurrence["frequency"]>("none");
  const [recurrenceCount, setRecurrenceCount] = useState("10");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [scheduledLink, setScheduledLink] = useState("");
  const [scheduleStatus, setScheduleStatus] = useState("");
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

  async function scheduleMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const startsAt = new Date(`${scheduleDate}T${scheduleTime || "09:00"}`);
    if (!scheduleDate || Number.isNaN(startsAt.getTime())) {
      setScheduleStatus("Choose a valid date and time.");
      return;
    }
    if (recurrenceFrequency !== "none" && recurrenceEndDate) {
      const endsOn = new Date(`${recurrenceEndDate}T23:59:59`);
      if (endsOn < startsAt) {
        setScheduleStatus("Recurrence end date must be after the first meeting.");
        return;
      }
    }

    saveName();
    const roomId = createMeetingId();
    const link = `${window.location.origin}/meeting/${roomId}`;
    setScheduledLink(link);
    await navigator.clipboard.writeText(link);
    setScheduleStatus(recurrenceFrequency === "none" ? "Meeting link copied." : "Recurring meeting link copied.");
  }

  async function copyScheduledLink() {
    if (!scheduledLink) return;
    await navigator.clipboard.writeText(scheduledLink);
    setScheduleStatus("Meeting link copied.");
  }

  function downloadInvite() {
    if (!scheduledLink || !scheduleDate) return;
    const startsAt = new Date(`${scheduleDate}T${scheduleTime || "09:00"}`);
    const recurrenceUntil = recurrenceEndDate ? new Date(`${recurrenceEndDate}T23:59:59`) : undefined;
    const contents = createCalendarFile({
      title: scheduleTitle.trim() || "LightMeet session",
      startsAt,
      durationMinutes: Number(durationMinutes) || 45,
      meetingLink: scheduledLink,
      recurrence: {
        frequency: recurrenceFrequency,
        count: Number(recurrenceCount) || 10,
        until: recurrenceUntil,
      },
    });
    downloadCalendarFile(contents, `lightmeet-${scheduleDate}.ics`);
    setScheduleStatus("Calendar invite downloaded.");
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
              <Metric label="Participants" value={String(MAX_PARTICIPANTS)} />
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
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
              onClick={createMeeting}
              type="button"
            >
              <span aria-hidden>+</span>
              Create Meeting
            </button>

            <details className="mb-5 rounded-md border border-line dark:border-slate-700">
              <summary className="cursor-pointer list-none px-4 py-3 text-center font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800">
                Schedule Meeting
              </summary>
              <form className="space-y-3 border-t border-line p-4 dark:border-slate-700" onSubmit={scheduleMeeting}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="scheduleTitle">
                  Meeting title
                </label>
                <input
                  id="scheduleTitle"
                  className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  value={scheduleTitle}
                  onChange={(event) => setScheduleTitle(event.target.value)}
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="scheduleDate">
                      Date
                    </label>
                    <input
                      id="scheduleDate"
                      className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                      type="date"
                      value={scheduleDate}
                      onChange={(event) => setScheduleDate(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="scheduleTime">
                      Time
                    </label>
                    <input
                      id="scheduleTime"
                      className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                      type="time"
                      value={scheduleTime}
                      onChange={(event) => setScheduleTime(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="duration">
                      Minutes
                    </label>
                    <input
                      id="duration"
                      className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                      min="15"
                      step="15"
                      type="number"
                      value={durationMinutes}
                      onChange={(event) => setDurationMinutes(event.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="recurrence">
                      Repeat
                    </label>
                    <select
                      id="recurrence"
                      className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                      value={recurrenceFrequency}
                      onChange={(event) => setRecurrenceFrequency(event.target.value as CalendarRecurrence["frequency"])}
                    >
                      <option value="none">Does not repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {recurrenceFrequency !== "none" ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="repeatCount">
                        Occurrences
                      </label>
                      <input
                        id="repeatCount"
                        className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                        min="2"
                        max="365"
                        type="number"
                        value={recurrenceCount}
                        onChange={(event) => setRecurrenceCount(event.target.value)}
                      />
                    </div>
                  ) : null}
                </div>

                {recurrenceFrequency !== "none" ? (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="recurrenceEndDate">
                      Recurrence end date
                    </label>
                    <input
                      id="recurrenceEndDate"
                      className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                      min={scheduleDate || undefined}
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(event) => setRecurrenceEndDate(event.target.value)}
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">When set, the calendar invite uses this end date instead of occurrence count.</p>
                  </div>
                ) : null}

                <button className="w-full rounded-md bg-mint px-4 py-2 font-semibold text-white transition hover:bg-emerald-700" type="submit">
                  Create Scheduled Link
                </button>

                {scheduledLink ? (
                  <div className="space-y-2 rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-950">
                    <p className="break-all text-slate-700 dark:text-slate-200">{scheduledLink}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button className="rounded-md border border-line px-3 py-2 font-semibold hover:bg-white dark:border-slate-700 dark:hover:bg-slate-900" onClick={copyScheduledLink} type="button">
                        Copy Link
                      </button>
                      <button className="rounded-md border border-line px-3 py-2 font-semibold hover:bg-white dark:border-slate-700 dark:hover:bg-slate-900" onClick={downloadInvite} type="button">
                        Download Invite
                      </button>
                    </div>
                  </div>
                ) : null}

                {scheduleStatus ? <p className="text-sm text-slate-500 dark:text-slate-400">{scheduleStatus}</p> : null}
              </form>
            </details>

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
