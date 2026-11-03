from dataclasses import asdict
from datetime import datetime, timedelta

from . import providers
from .domain import MILE, Weather, checkpoints, exposure, recommend, risk, weather_at, meters


def analyze(data):
    if meters(data["origin"], data["destination"]) > 100000:
        raise providers.ProviderError(
            "corridor_limit",
            "Public truck alternatives are limited to 100 km. Choose a shorter corridor.",
            422,
        )
    departure = datetime.fromisoformat(data["departure"])
    routes = providers.truck_routes(data["origin"], data["destination"])
    positions = []
    for i, r in enumerate(routes):
        r["id"] = f"route-{i + 1}"
        r["checkpoints"] = checkpoints(
            r["geometry"],
            r["meters"],
            r["seconds"],
            data["spacing"],
            departure,
            r.pop("steps"),
        )
        for p in r["checkpoints"]:
            if p["position"] not in positions:
                positions.append(p["position"])
    if len(positions) > 36:
        raise providers.ProviderError(
            "sample_limit",
            "Trip exceeds the bounded 36-checkpoint weather budget. Choose a shorter corridor.",
            422,
        )
    # Include lateral corridor samples; points are actual forecast locations, not random fields.
    corridor = positions[:]
    for p in positions[:: max(1, len(positions) // 6)][:6]:
        corridor.extend([[p[0] - 0.025, p[1]], [p[0] + 0.025, p[1]]])
    warnings = []
    try:
        series = providers.forecasts(corridor)
    except providers.ProviderError as exc:
        series = [{} for _ in corridor]
        warnings.append(exc.message + " All unavailable weather is Unknown.")
    for r in routes:
        for p in r["checkpoints"]:
            w = weather_at(series[positions.index(p["position"])], datetime.fromisoformat(p["eta"]))
            p.update(weather=asdict(w), risk=risk(w, data["load"]))
        r["exposure"] = exposure(r["checkpoints"], r["meters"] / MILE)
    base = departure.replace(minute=0, second=0, microsecond=0)
    overlay = []
    for p, s in zip(corridor, series, strict=True):
        frames = []
        for hour in range(49):
            w = s.get((base + timedelta(hours=hour)).isoformat(), Weather(None, None, None))
            frames.append({**asdict(w), "risk": risk(w, data["load"])})
        overlay.append({"position": p, "frames": frames})
    preferred = recommend(routes)
    if len(routes) < 3:
        warnings.append(
            f"Provider returned {len(routes)} distinct truck routes; three are not guaranteed."
        )
    return {
        "routes": routes,
        "preferred": preferred,
        "explanation": "Eligible routes ordered by Severe miles, High miles, average risk, then travel time."
        if preferred
        else "No fully forecast-covered route without a No Travel checkpoint is available.",
        "overlay": {"base_time": base.isoformat(), "samples": overlay},
        "warnings": warnings,
        "source": "Live ORS driving-hgv + Open-Meteo",
    }
