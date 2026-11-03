"""Deterministic sampling and checkpoint-centered exposure."""

from bisect import bisect_left
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from math import asin, cos, isfinite, radians, sin, sqrt

MILE = 1609.344
LEVELS = ("Low", "Moderate", "High", "Severe", "No Travel", "Unknown")


@dataclass(frozen=True)
class Weather:
    wind: float | None
    rain: float | None
    snow: float | None
    valid_at: str | None = None
    retrieved_at: str | None = None


def risk(weather: Weather, load: float) -> str:
    values = (weather.wind, weather.rain, weather.snow)
    known = [v is not None and isfinite(v) and v >= 0 for v in values]
    ranks = []
    for v, ok, thresholds in zip(
        values, known, ((25, 35, 45, 55), (0.1, 0.25, 0.5, 1), (0.5, 1, 2, 3)), strict=True
    ):
        if ok:
            ranks.append(
                sum(
                    v >= t if i < 3 or thresholds[0] == 25 else v > t
                    for i, t in enumerate(thresholds)
                )
            )
    wind = weather.wind if known[0] else 0
    if wind >= 55 or (wind >= 45 and load > 30000):
        return "No Travel"
    if wind >= 35 and load > 40000:
        ranks.append(3)
    if 4 in ranks:
        return "No Travel"
    return LEVELS[max(ranks)] if all(known) else "Unknown"


def meters(a, b):
    lon1, lat1, lon2, lat2 = map(radians, (*a[:2], *b[:2]))
    h = sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2
    return 12742000 * asin(min(1, sqrt(h)))


def checkpoints(geometry, distance, duration, spacing, departure, steps=()):
    if distance <= 0 or len(geometry) < 2:
        raise ValueError("Invalid route geometry")
    cumulative = [0.0]
    for a, b in zip(geometry, geometry[1:], strict=False):
        cumulative.append(cumulative[-1] + meters(a, b))
    if cumulative[-1] == 0:
        raise ValueError("Degenerate geometry")
    positions = [i * spacing * MILE for i in range(int(distance // (spacing * MILE)) + 1)]
    if distance - positions[-1] > 1e-6:
        positions.append(distance)
    else:
        positions[-1] = distance
    anchors = {0: 0.0, len(geometry) - 1: duration}
    elapsed = 0.0
    for step in steps:
        elapsed += step["duration"]
        anchors[step["way_points"][1]] = elapsed
    timing = sorted((cumulative[i], t) for i, t in anchors.items() if 0 <= i < len(geometry))
    output = []
    for d in positions:
        target = d / distance * cumulative[-1]
        j = min(max(bisect_left(cumulative, target), 1), len(geometry) - 1)
        span = cumulative[j] - cumulative[j - 1]
        f = (target - cumulative[j - 1]) / span if span else 0
        point = [geometry[j - 1][k] + f * (geometry[j][k] - geometry[j - 1][k]) for k in (0, 1)]
        tj = min(max(bisect_left([x[0] for x in timing], target), 1), len(timing) - 1)
        left, right = timing[tj - 1], timing[tj]
        fraction = (target - left[0]) / (right[0] - left[0]) if right[0] != left[0] else 0
        seconds = left[1] + fraction * (right[1] - left[1])
        output.append(
            {
                "mile": d / MILE,
                "position": point,
                "eta": (departure + timedelta(seconds=seconds)).isoformat(),
            }
        )
    return output


def exposure(points, miles):
    totals = dict.fromkeys(LEVELS, 0.0)
    for i, p in enumerate(points):
        left = 0 if i == 0 else (points[i - 1]["mile"] + p["mile"]) / 2
        right = miles if i == len(points) - 1 else (p["mile"] + points[i + 1]["mile"]) / 2
        totals[p["risk"]] += right - left
    classified = miles - totals["Unknown"]
    average = (
        sum(totals[level] * i for i, level in enumerate(LEVELS[:5])) / classified
        if classified > 0
        else None
    )
    return {"miles": totals, "coverage": classified / miles, "average": average}


def recommend(routes):
    eligible = [
        r
        for r in routes
        if all(p["risk"] not in ("No Travel", "Unknown") for p in r["checkpoints"])
    ]
    if not eligible:
        return None
    return min(
        eligible,
        key=lambda r: (
            r["exposure"]["miles"]["Severe"],
            r["exposure"]["miles"]["High"],
            r["exposure"]["average"],
            r["seconds"],
        ),
    )["id"]


def weather_at(series: dict[str, Weather], instant: datetime) -> Weather:
    """Preceding-hour precipitation ending at ceil(ETA); wind at that hour."""
    instant = instant.astimezone(UTC)
    hour = instant.replace(minute=0, second=0, microsecond=0)
    if hour < instant:
        hour += timedelta(hours=1)
    return series.get(hour.isoformat(), Weather(None, None, None))
