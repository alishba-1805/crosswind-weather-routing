# Delivery audit

## Production addendum — 2026-11-04

Deployed at https://crosswind-web.onrender.com (frontend) and
https://crosswind-routing-api.onrender.com (backend). A live Playwright audit found
no application failures: health 200, exact CORS, real autocomplete, real ORS HGV
and Open-Meteo data, map, checkpoint ETAs, 0/24/48 h slider, desktop/390 px layout,
no secrets in the bundle. Frederick, MD to Gaithersburg, MD: three routes of 24.9,
24.2 and 24.5 mi, 100% weather coverage. Backend: 36 passed. Open: Loom pending;
25/50 mi sampling on a >50 mi route unverified; live Severe/No Travel weather not
observed (test-only); rain/snow endpoint interpretation awaits assessor
confirmation; provider licensing unresolved. The sections below are the earlier
2026-11-03 local audit and are historical (rows C, J, K and L are superseded).

# Local delivery audit — 2026-11-03

Working local implementation as of that date.

| Area | Verified status |
|---|---|
| A. Features | Trip inputs, autocomplete adapter, three HGV alternatives requested, checkpoint ETAs, weather risk, recommendation and comparison implemented |
| B. Architecture | Independent domain/provider/service/API split; hook-based frontend; CSS Modules; no database; no access to the other project |
| C. Providers | Actual Open-Meteo unit smoke succeeded; actual OpenFreeMap tiles rendered; ORS/Pelias credentials absent, so live integration acceptance remains blocked |
| D. Methodology | Exact thresholds, strict load overrides, midpoint cells, conserved distance, Unknown exclusion and exact lexicographic ranking covered by deterministic tests |
| E. UI/map | Dark map-left console, right inspector, stable map, distinct route colors, fit bounds, checkpoint weather details, responsive planner/comparison sheet |
| F. Heatmap | Bounded categorical corridor point surface, 49 hourly frames, timestamps and retained meteorological values; slider does not recalculate trip recommendation |
| G. Tests | 31 Pytest, 4 Vitest and 8 Playwright scenarios passed; Django check, Ruff, ESLint, TypeScript and production build passed |
| H. Accessibility | Axe default rules passed on populated views at four sizes; no horizontal overflow; keyboard autocomplete tested; no manual screen-reader certification |
| I. Security | Server-only ignored credentials, bounded HTTP requests and timeouts, exact CORS configuration; npm zero vulnerabilities, pip-audit no known vulnerabilities; limited tracked-file regex scan found none |
| J. Deployment | Separate free Render/Netlify configuration and instructions ready; no resources created, no credit card, no push or deployment |
| K. Git | Independent repository initialized; backend and UI/docs milestones committed locally with transparent tool identity; no remote |
| L. Blockers | Independent ORS key, proven three-alternative corridor, Open-Meteo use eligibility, hosted acceptance and real Loom recording |
| M. Next action | Configure backend/.env, run bounded live_smoke.py, verify Pelias and three distinct fully covered HGV routes; then follow CONTINUATION.md |

Screenshots show the actual UI. Populated captures visibly identify invented
test geometry/forecasts. They do not establish real-road acceptance. The image
`before-map-container-fix.png` records the blank map before its confirmed CSS
defect was corrected; current empty/populated captures show the fixed map.

Known engineering limits: MapLibre main bundle is approximately 1.3 MB minified
(367 kB gzip), plus a separate worker. Build emits a size warning. A provider
style sprite warning was observed without blocking rendering. In-memory caching
and throttling are per-process, not a shared daily quota guarantee. API users
must remain within independent account quotas. Provider notices are retained in
responses; the UI currently reports their count rather than formatting every
provider-specific warning field. The automated suite does not yet exercise every
possible provider response shape or a deployed cross-origin environment.

The secret scan is a transparent set of regex checks against tracked text files,
not a claim that every possible credential format has been detected. Audits are
point-in-time checks, not guarantees against unknown vulnerabilities.
