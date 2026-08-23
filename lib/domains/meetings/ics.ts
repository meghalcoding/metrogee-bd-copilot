import type { MeetingRecord } from "./types";

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function utcStamp(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildMeetingIcs(meeting: MeetingRecord) {
  const description = escapeIcs(meeting.description ?? "");
  const location = escapeIcs(meeting.location ?? "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MetroGee Mitra//BD Operating System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${meeting.id}@metrogee-bd-copilot`,
    `DTSTAMP:${utcStamp(meeting.created_at)}`,
    `DTSTART:${utcStamp(meeting.start_at)}`,
    `DTEND:${utcStamp(meeting.end_at)}`,
    `SUMMARY:${escapeIcs(meeting.title)}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function buildGoogleCalendarUrl(meeting: MeetingRecord) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: meeting.title,
    dates: `${utcStamp(meeting.start_at)}/${utcStamp(meeting.end_at)}`,
    details: meeting.description ?? "",
    location: meeting.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildOutlookCalendarUrl(meeting: MeetingRecord) {
  const params = new URLSearchParams({
    rru: "addevent",
    subject: meeting.title,
    startdt: new Date(meeting.start_at).toISOString(),
    enddt: new Date(meeting.end_at).toISOString(),
    body: meeting.description ?? "",
    location: meeting.location ?? "",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
