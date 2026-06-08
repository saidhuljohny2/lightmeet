"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const displayName = name.trim() || suggestedName;

  useEffect(() => {
    setSuggestedName(`Guest ${Math.floor(Math.random() * 900 + 100)}`);
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((session: { isAdmin: boolean }) => setIsAdmin(session.isAdmin))
      .finally(() => setAuthChecked(true));
  }, []);

  function saveName() {
    window.sessionStorage.setItem("lightmeet-name", displayName);
  }

  function createMeeting() {
    if (!isAdmin) {
      router.push("/login");
      return;
    }
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
    if (!isAdmin) {
      router.push("/login");
      return;
    }
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

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAdmin(false);
    setScheduledLink("");
    setScheduleStatus("Admin signed out.");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-pearl text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between rounded-lg border border-white/70 bg-white/75 px-4 py-3 shadow-soft backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-obsidian text-sm font-bold text-white shadow-control">LM</span>
            <div>
              <div className="text-base font-semibold leading-5">LightMeet</div>
              <div className="text-xs text-slate-500">Premium WebRTC rooms</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
            <span className="rounded-md border border-line bg-white px-3 py-2">No database</span>
            <span className="rounded-md border border-line bg-white px-3 py-2">Local recording</span>
            {isAdmin ? (
              <button className="rounded-md border border-line bg-white px-3 py-2 font-semibold hover:bg-slate-50" onClick={logout} type="button">
                Sign out
              </button>
            ) : (
              <button className="rounded-md bg-obsidian px-3 py-2 font-semibold text-white" onClick={() => router.push("/login")} type="button">
                Admin login
              </button>
            )}
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1.04fr)_440px]">
          <section className="relative min-h-[560px] overflow-hidden rounded-lg border border-white/80 bg-obsidian p-6 text-white shadow-premium sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(59,130,246,0.42),transparent_28rem),radial-gradient(circle_at_88%_18%,rgba(16,185,129,0.28),transparent_24rem)]" />
            <div className="absolute inset-x-8 bottom-0 top-28 rounded-t-lg border border-white/10 bg-white/[0.06] backdrop-blur" />
            <div className="relative z-10 max-w-2xl">
              <p className="mb-4 inline-flex rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-blue-100">
                Live sessions, beautifully simple
              </p>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">Meet, teach, record, and share without the weight.</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                A polished meeting experience for fast live sessions, recurring classes, lightweight teams, and browser-only recordings.
              </p>
            </div>

            <div className="relative z-10 mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
              <Metric label="Room capacity" value={String(MAX_PARTICIPANTS)} />
              <Metric label="Recorder" value="MP4" />
              <Metric label="Deploy" value="Vercel" />
            </div>

            <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-2">
              <PreviewTile name="Aisha" status="Presenting" color="bg-blue-500" />
              <PreviewTile name="Jon" status="Recording on" color="bg-emerald-500" />
              <PreviewTile name="Maya" status="Hand raised" color="bg-amber-400" />
              <PreviewTile name="You" status="Camera ready" color="bg-slate-200" darkText />
            </div>
          </section>

          <section className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-premium backdrop-blur-xl">
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="name">
              Display name
            </label>
            <input
              id="name"
              className="mb-4 w-full rounded-md border border-line bg-white px-3 py-3 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100"
              placeholder={suggestedName}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

            <button
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-md bg-obsidian px-4 py-3 font-semibold text-white shadow-control transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={!authChecked}
              onClick={createMeeting}
              type="button"
            >
              <span aria-hidden>+</span>
              {isAdmin ? "Create Meeting" : "Admin Login to Start"}
            </button>

            {!isAdmin && authChecked ? <p className="mb-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">Students can join with a meeting ID. Only the admin can start or schedule meetings.</p> : null}

            <details className="mb-5 rounded-md border border-line bg-white" open={isAdmin ? undefined : false}>
              <summary className="cursor-pointer list-none px-4 py-3 text-center font-semibold transition hover:bg-slate-50">
                Schedule Meeting
              </summary>
              <form className="space-y-3 border-t border-line p-4" onSubmit={scheduleMeeting}>
                <FieldLabel htmlFor="scheduleTitle">Meeting title</FieldLabel>
                <input
                  id="scheduleTitle"
                  className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100"
                  value={scheduleTitle}
                  onChange={(event) => setScheduleTitle(event.target.value)}
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FieldLabel htmlFor="scheduleDate">Date</FieldLabel>
                    <input id="scheduleDate" className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100" type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="scheduleTime">Time</FieldLabel>
                    <input id="scheduleTime" className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100" type="time" value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="duration">Minutes</FieldLabel>
                    <input id="duration" className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100" min="15" step="15" type="number" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                  <div>
                    <FieldLabel htmlFor="recurrence">Repeat</FieldLabel>
                    <select id="recurrence" className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100" value={recurrenceFrequency} onChange={(event) => setRecurrenceFrequency(event.target.value as CalendarRecurrence["frequency"])}>
                      <option value="none">Does not repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {recurrenceFrequency !== "none" ? (
                    <div>
                      <FieldLabel htmlFor="repeatCount">Occurrences</FieldLabel>
                      <input id="repeatCount" className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100" min="2" max="365" type="number" value={recurrenceCount} onChange={(event) => setRecurrenceCount(event.target.value)} />
                    </div>
                  ) : null}
                </div>

                {recurrenceFrequency !== "none" ? (
                  <div>
                    <FieldLabel htmlFor="recurrenceEndDate">Recurrence end date</FieldLabel>
                    <input id="recurrenceEndDate" className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100" min={scheduleDate || undefined} type="date" value={recurrenceEndDate} onChange={(event) => setRecurrenceEndDate(event.target.value)} />
                    <p className="mt-1 text-xs text-slate-500">End date overrides occurrence count in the calendar invite.</p>
                  </div>
                ) : null}

                <button className="w-full rounded-md bg-mint px-4 py-2 font-semibold text-white transition hover:bg-emerald-700" type="submit">
                  Create Scheduled Link
                </button>

                {scheduledLink ? (
                  <div className="space-y-2 rounded-md bg-slate-50 p-3 text-sm">
                    <p className="break-all text-slate-700">{scheduledLink}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button className="rounded-md border border-line px-3 py-2 font-semibold hover:bg-white" onClick={copyScheduledLink} type="button">
                        Copy Link
                      </button>
                      <button className="rounded-md border border-line px-3 py-2 font-semibold hover:bg-white" onClick={downloadInvite} type="button">
                        Download Invite
                      </button>
                    </div>
                  </div>
                ) : null}

                {scheduleStatus ? <p className="text-sm text-slate-500">{scheduleStatus}</p> : null}
              </form>
            </details>

            <form className="space-y-3" onSubmit={joinMeeting}>
              <FieldLabel htmlFor="meetingId">Join with Meeting ID</FieldLabel>
              <input
                id="meetingId"
                className="w-full rounded-md border border-line bg-white px-3 py-3 outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100"
                placeholder="example: abc123-def456"
                value={meetingId}
                onChange={(event) => setMeetingId(event.target.value)}
              />
              <button className="w-full rounded-md border border-line bg-white px-4 py-3 font-semibold transition hover:bg-slate-50" type="submit">
                Join Meeting
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return (
    <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/10 p-4 backdrop-blur">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-300">{label}</div>
    </div>
  );
}

function PreviewTile({ color, darkText, name, status }: { color: string; darkText?: boolean; name: string; status: string }) {
  return (
    <div className="flex min-h-28 items-end justify-between rounded-lg border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
      <div>
        <div className="text-sm font-semibold text-white">{name}</div>
        <div className="mt-1 text-xs text-slate-300">{status}</div>
      </div>
      <div className={`grid h-12 w-12 place-items-center rounded-md ${color} text-sm font-bold ${darkText ? "text-slate-950" : "text-white"}`}>
        {name.slice(0, 1)}
      </div>
    </div>
  );
}
