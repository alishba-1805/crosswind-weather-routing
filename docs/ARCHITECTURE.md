# Crosswind architecture

`backend/crosswind/domain.py` holds deterministic sampling, hazards, exposure and
ranking. `providers.py` owns HTTP, units, timeouts and process-local TTL caching.
`service.py` orchestrates one routing request and one batched weather request.
`api.py` validates inputs and serializes structured failures. No database is needed.

React uses local hooks. `PlaceSearch` owns debounced, abortable autocomplete;
`RouteMap` creates one MapLibre instance and updates GeoJSON sources; `App` owns
trip results, selection and overlay offset. CSS Modules contain original tokens.

## Contracts

- `GET /api/health`: public liveness; no provider call.
- `GET /api/places?q=...`: US Pelias suggestions `{places:[{label,position}]}`.
- `POST /api/analysis`: `{origin:[lon,lat],destination:[lon,lat],departure:ISO with
  offset,load:lb,spacing:10|25|50}`. Response includes routes, checkpoint weather,
  exposure, preferred route ID or null, warnings, source and overlay.
- Errors: `{error:{code,message,fields?}}`, with appropriate HTTP status.

Geometry is GeoJSON longitude/latitude. Official road meters are authoritative.
Checkpoint records contain road mile, coordinates, UTC ETA, risk and weather.
Overlay records contain spatial position and 49 hourly frames with actual values,
classification, forecast timestamp and retrieval timestamp. Unknown is explicit.

At most three deduplicated provider alternatives, 36 checkpoint locations and 12
lateral corridor locations are evaluated. A 15-minute weather cache and one-hour
place cache reduce calls. There are no automatic retries. The in-memory throttle
and cache are suitable for one worker only; shared quota enforcement is needed
before broader public use. ORS restriction errors are surfaced; routes are never
manufactured to fill a count.
