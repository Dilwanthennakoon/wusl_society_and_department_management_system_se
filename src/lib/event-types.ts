export const EVENT_TYPES = [
  "Workshop",
  "Seminar",
  "Conference",
  "Competition",
  "Exhibition",
  "Training Program",
  "Awareness Program",
  "Cultural Event",
  "Sports Event",
  "Community Service",
  "Meeting",
  "Other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export function isEventType(value: string): value is EventType {
  return EVENT_TYPES.includes(value as EventType);
}

