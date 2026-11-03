# Provider verification — 2026-11-03

- [HeiGIT migration announcement](https://ask.openrouteservice.org/t/deprecating-api-openrouteservice-org-in-favour-of-api-heigit-org/7912)
  confirms `/openrouteservice/v2/directions` and `/pelias/v1` on `api.heigit.org`.
- [Published restrictions](https://staging.openrouteservice.org/restrictions/)
  list 100 km for alternative/round-trip routing and count 3. Account dashboard
  quotas are authoritative and unavailable without credentials. No quota value
  is assumed in code. One routing request per analysis; bounded autocomplete.
- [Open-Meteo Generic Forecast](https://open-meteo.com/en/docs) documents hourly
  intervals, rain/showers and snowfall depth. One live request at Frederick
  verified `mp/h`, `inch` rain/showers and **inch snowfall** when requesting inch
  precipitation. No ORS credential is present in `backend/.env` at initial setup.
- [Open-Meteo terms](https://open-meteo.com/en/terms): free non-commercial hosted
  API limits below 10,000/day, 5,000/hour, 600/minute. Multi-location calls may
  count as multiple usage units; batching is not a quota bypass. Assessment
  eligibility needs clarification before publication.
- [OpenFreeMap quick start](https://openfreemap.org/quick_start/) supplies vector
  styles for MapLibre. Map attribution remains visible; no basemap API key used.

Tests never contact providers. Live smoke tests should record date, corridor,
route count, units and status only, keeping credentials out of fixtures and logs.
