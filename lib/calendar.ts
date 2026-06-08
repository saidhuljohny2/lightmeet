type CalendarEvent = {
  title: string;
  startsAt: Date;
  durationMinutes: number;
  meetingLink: string;
  recurrence?: CalendarRecurrence;
};

export type CalendarRecurrence = {
  frequency: "none" | "daily" | "weekly" | "monthly";
  count: number;
  until?: Date;
};

export function createCalendarFile({ title, startsAt, durationMinutes, meetingLink, recurrence }: CalendarEvent) {
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  const safeTitle = escapeCalendarText(title);
  const safeLink = escapeCalendarText(meetingLink);
  const recurrenceRule = buildRecurrenceRule(recurrence);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LightMeet//Meeting Scheduler//EN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@lightmeet.local`,
    `DTSTAMP:${formatCalendarDate(new Date())}`,
    `DTSTART:${formatCalendarDate(startsAt)}`,
    `DTEND:${formatCalendarDate(endsAt)}`,
    `SUMMARY:${safeTitle}`,
    `DESCRIPTION:Join the LightMeet session: ${safeLink}`,
    `URL:${meetingLink}`,
  ];

  if (recurrenceRule) {
    lines.push(recurrenceRule);
  }

  return [
    ...lines,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadCalendarFile(contents: string, filename: string) {
  const blob = new Blob([contents], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatCalendarDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeCalendarText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function buildRecurrenceRule(recurrence?: CalendarRecurrence) {
  if (!recurrence || recurrence.frequency === "none") return null;

  const frequencyMap = {
    daily: "DAILY",
    weekly: "WEEKLY",
    monthly: "MONTHLY",
  } as const;
  if (recurrence.until) {
    return `RRULE:FREQ=${frequencyMap[recurrence.frequency]};UNTIL=${formatCalendarDate(recurrence.until)}`;
  }

  const count = Math.min(Math.max(Math.floor(recurrence.count || 1), 1), 365);
  return `RRULE:FREQ=${frequencyMap[recurrence.frequency]};COUNT=${count}`;
}
