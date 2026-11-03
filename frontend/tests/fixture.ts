import type { Analysis } from "../src/types";
// Invented test geometry and weather. Never displayed as live provider output.
export function fixture(): Analysis {
  const weather = {
    wind: 25,
    rain: 0.1,
    snow: 0,
    valid_at: "2026-11-03T12:00:00Z",
    retrieved_at: "2026-11-03T10:00:00Z",
  };
  return {
    source: "SYNTHETIC TEST FIXTURE",
    preferred: "route-1",
    explanation:
      "Ordered by Severe miles, High miles, average risk, then time.",
    warnings: ["Synthetic browser test data — not live routes or weather."],
    routes: [0, 1, 2].map((i) => ({
      id: `route-${i + 1}`,
      geometry: [
        [-77.4105, 39.4143],
        [-77.34 + i * 0.04, 39.28],
        [-77.2014, 39.1434],
      ],
      meters: 42000 + i * 2000,
      seconds: 2400 + i * 300,
      notices: [],
      checkpoints: [
        {
          mile: 0,
          position: [-77.4105, 39.4143],
          eta: "2026-11-03T12:00:00Z",
          risk: "Moderate",
          weather,
        },
        {
          mile: 26.1 + i,
          position: [-77.2014, 39.1434],
          eta: "2026-11-03T12:40:00Z",
          risk: "High",
          weather: { ...weather, wind: 35 },
        },
      ],
      exposure: {
        miles: {
          Low: 0,
          Moderate: 13,
          High: 13.1 + i,
          Severe: 0,
          "No Travel": 0,
          Unknown: 0,
        },
        coverage: 1,
        average: 1.5,
      },
    })),
    overlay: {
      base_time: "2026-11-03T12:00:00Z",
      samples: [
        [-77.4105, 39.4143],
        [-77.34, 39.28],
        [-77.2014, 39.1434],
      ].map((p) => ({
        position: p as [number, number],
        frames: Array.from({ length: 49 }, (_, h) => ({
          ...weather,
          wind: 25 + h,
          risk: h === 48 ? "Unknown" : h >= 24 ? "Severe" : "Moderate",
        })),
      })),
    },
  };
}
