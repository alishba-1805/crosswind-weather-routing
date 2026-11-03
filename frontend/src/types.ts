export const levels = [
  "Low",
  "Moderate",
  "High",
  "Severe",
  "No Travel",
  "Unknown",
] as const;
export type Risk = (typeof levels)[number];
export const colors: Record<Risk, string> = {
  Low: "#a4c4a6",
  Moderate: "#e1ce7c",
  High: "#edac70",
  Severe: "#f28683",
  "No Travel": "#db82cf",
  Unknown: "#a4aebc",
};
export interface Place {
  label: string;
  position: [number, number];
}
export interface Weather {
  wind: number | null;
  rain: number | null;
  snow: number | null;
  valid_at: string | null;
  retrieved_at: string | null;
}
export interface Checkpoint {
  mile: number;
  position: [number, number];
  eta: string;
  risk: Risk;
  weather: Weather;
}
export interface Route {
  id: string;
  geometry: [number, number][];
  meters: number;
  seconds: number;
  notices: unknown[];
  checkpoints: Checkpoint[];
  exposure: {
    miles: Record<Risk, number>;
    coverage: number;
    average: number | null;
  };
}
export interface Analysis {
  routes: Route[];
  preferred: string | null;
  explanation: string;
  warnings: string[];
  source: string;
  overlay: {
    base_time: string;
    samples: {
      position: [number, number];
      frames: (Weather & { risk: Risk })[];
    }[];
  };
}
export const apiRoot = import.meta.env.VITE_API_URL || "";
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiRoot + path, init);
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error?.message || "Request failed. Please retry.");
  return data;
}
export function time(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
