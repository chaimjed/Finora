const FALLBACK_TIMEZONES = [
  "UTC", "Africa/Tunis", "Africa/Cairo", "Europe/Paris", "Europe/London",
  "America/New_York", "America/Los_Angeles", "Asia/Dubai", "Asia/Tokyo",
];

export function getAvailableTimezones(): string[] {
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf("timeZone");
    }
  } catch {
  }
  return FALLBACK_TIMEZONES;
}