"""Bounded server-side HTTP adapters; credentials never enter responses."""

import os
from hashlib import sha256
from datetime import UTC, datetime

import httpx
from django.core.cache import cache

from .domain import Weather


class ProviderError(Exception):
    def __init__(self, code, message, status=502):
        self.code, self.message, self.status = code, message, status


def request(method, url, **kwargs):
    try:
        response = httpx.request(method, url, timeout=httpx.Timeout(25, connect=5), **kwargs)
        if response.status_code == 429:
            raise ProviderError("quota", "Provider quota reached. Try again later.", 503)
        response.raise_for_status()
        return response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise ProviderError(
            "provider_unavailable",
            "Provider request failed. Check inputs or retry later.",
        ) from exc


def key():
    value = os.getenv("ORS_API_KEY")
    if not value:
        raise ProviderError(
            "credentials_missing",
            "Live routing requires ORS_API_KEY in backend/.env.",
            503,
        )
    return value


def geocode(query):
    token = key()
    cache_id = "places:" + sha256(query.encode()).hexdigest()
    cached = cache.get(cache_id)
    if cached is not None:
        return cached
    data = request(
        "GET",
        "https://api.heigit.org/pelias/v1/autocomplete",
        headers={"Authorization": token},
        params={"text": query, "size": 5, "boundary.country": "USA"},
    )
    result = [
        {
            "label": f["properties"]["label"],
            "position": f["geometry"]["coordinates"][:2],
        }
        for f in data.get("features", [])
    ]
    cache.set(cache_id, result, 3600)
    return result


def truck_routes(origin, destination):
    data = request(
        "POST",
        "https://api.heigit.org/openrouteservice/v2/directions/driving-hgv/geojson",
        headers={"Authorization": key()},
        json={
            "coordinates": [origin, destination],
            "alternative_routes": {
                "target_count": 3,
                "weight_factor": 1.6,
                "share_factor": 0.6,
            },
            "instructions": True,
        },
    )
    routes = []
    signatures = set()
    for f in data.get("features", [])[:3]:
        geometry = f["geometry"]["coordinates"]
        signature = tuple(tuple(p[:2]) for p in geometry)
        if signature in signatures:
            continue
        signatures.add(signature)
        props = f["properties"]
        routes.append(
            {
                "geometry": geometry,
                "meters": props["summary"]["distance"],
                "seconds": props["summary"]["duration"],
                "steps": [
                    s for segment in props.get("segments", []) for s in segment.get("steps", [])
                ],
                "notices": props.get("warnings", []),
            }
        )
    if not routes:
        raise ProviderError("no_routes", "No truck routes were returned.", 422)
    return routes


def forecasts(positions):
    """At most 48 unique spatial samples per analysis; one batched HTTP request."""
    if not positions:
        return []
    cache_key = "weather:" + sha256(repr(positions).encode()).hexdigest()
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    data = request(
        "GET",
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": ",".join(str(p[1]) for p in positions),
            "longitude": ",".join(str(p[0]) for p in positions),
            "hourly": "wind_speed_10m,rain,showers,snowfall",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "timezone": "GMT",
            "forecast_days": 7,
        },
    )
    records = data if isinstance(data, list) else [data]
    if len(records) != len(positions):
        raise ProviderError("weather_shape", "Weather coverage response was incomplete.")
    retrieved = datetime.now(UTC).isoformat()
    output = []
    for record in records:
        hourly = record["hourly"]
        series = {}
        units = record.get("hourly_units", {})
        for i, t in enumerate(hourly["time"]):

            def value(field, expected, hourly=hourly, units=units, i=i):
                values = hourly.get(field, [])
                return values[i] if i < len(values) and units.get(field) == expected else None

            rain, showers = value("rain", "inch"), value("showers", "inch")
            # Generic Forecast rain and convective showers are disjoint components.
            liquid = rain + showers if rain is not None and showers is not None else None
            snow = value("snowfall", "inch")
            stamp = datetime.fromisoformat(t).replace(tzinfo=UTC).isoformat()
            series[stamp] = Weather(value("wind_speed_10m", "mp/h"), liquid, snow, stamp, retrieved)
        output.append(series)
    cache.set(cache_key, output, 900)
    return output
