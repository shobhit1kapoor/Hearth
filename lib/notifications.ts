export type QuietHours = {
  enabled: boolean;
  start: string;
  end: string;
  days: number[];
  timezone: string;
};

export function scheduleNotification(input: {
  now: Date;
  safetyCritical: boolean;
  professionalReview: boolean;
  quietHours: QuietHours;
}) {
  if (input.safetyCritical || input.professionalReview || !input.quietHours.enabled) {
    return { deliverAt: input.now, delayed: false };
  }
  const local = partsInTimezone(input.now, input.quietHours.timezone);
  if (!input.quietHours.days.includes(local.day) || !isWithinQuietHours(local.time, input.quietHours.start, input.quietHours.end)) {
    return { deliverAt: input.now, delayed: false };
  }
  const [endHour, endMinute] = input.quietHours.end.split(":").map(Number);
  const candidate = new Date(input.now);
  candidate.setUTCHours(candidate.getUTCHours() + hoursUntil(local.hour, local.minute, endHour, endMinute), endMinute, 0, 0);
  return { deliverAt: candidate, delayed: true };
}

function isWithinQuietHours(current: string, start: string, end: string) {
  if (start === end) return true;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

function partsInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return {
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday),
    hour,
    minute,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

function hoursUntil(hour: number, minute: number, targetHour: number, targetMinute: number) {
  const currentTotal = hour * 60 + minute;
  const targetTotal = targetHour * 60 + targetMinute;
  const difference = (targetTotal - currentTotal + 24 * 60) % (24 * 60);
  return Math.max(1, Math.ceil(difference / 60));
}
