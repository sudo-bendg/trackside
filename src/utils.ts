import type { Sighting } from "./types";

export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
) {
  return new Date(value).toLocaleDateString("en-GB", options);
}

export function getClassNumber(number: string): string {
  return number.length === 6 ? number.slice(0, 3) : number.slice(0, 2);
}

export function getMostSeenClass(sightings: Sighting[]): string | null {
  const counts = new Map<string, number>();
  for (const sighting of sightings) {
    counts.set(sighting.class_number, (counts.get(sighting.class_number) ?? 0) + 1);
  }

  return [...counts].sort((first, second) => second[1] - first[1])[0]?.[0] ?? null;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
