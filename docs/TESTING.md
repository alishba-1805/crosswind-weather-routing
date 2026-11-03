# Verification record

Local verification on 2026-11-03, Windows, standard CPython 3.13 and Node 24.
No deterministic test sends routing or weather requests.

| Check | Actual result |
|---|---|
| Pytest | 31 passed, including service orchestration and API errors |
| Django system check | no issues |
| Ruff lint and formatting | passed after fixes |
| Vitest + Testing Library | 4 passed: keyboard autocomplete/submission, route and slider selection, empty validation, loading/error and missing weather |
| TypeScript + Vite production build | passed; large MapLibre bundle warning remains |
| ESLint | passed |
| Prettier | check passed |
| Playwright / Chromium | 8 passed across 1440×900, 1280×800, 768×1024, 390×844; two scenarios each |
| Axe | populated views checked at all four sizes; not a complete accessibility certification |
| Dependency audits | npm reports zero vulnerabilities after MapLibre upgrade and minimatch override; pip-audit reports no known production dependency vulnerabilities |
| Live Open-Meteo | one actual request succeeded, confirming mph/inch response units |
| Live ORS HGV / Pelias | blocked: backend/.env and ORS_API_KEY absent |

Browser tests use explicitly labeled invented route/forecast data and live
OpenFreeMap tiles. They exercise the form, real WebGL map, bounds button,
selection, inspector, 0/24/48 slider, errors, overflow and Axe. Canvas height and
loaded state are checked. JavaScript exceptions, console errors and failed
requests are collected. Only canceled OpenFreeMap tile requests (`ERR_ABORTED`)
are excluded: MapLibre cancels obsolete tiles during fitBounds. A provider style
warning about a missing `circle-11` sprite was observed during manual console
inspection; it did not prevent route rendering. No live weather recommendation
is claimed from these synthetic scenarios.

Actual screenshots are `empty-{desktop,laptop,tablet,mobile}.png` and
`populated-synthetic-{desktop,laptop,tablet,mobile}.png`. Synthetic straight test
geometry is deliberately not presented as real road routing. Reviewed all four
empty and populated viewport captures, including visible basemap and legible
mobile controls. The mobile comparison is an expandable, scrollable sheet.

Confirmed defects fixed during verification: non-UTC hourly lookup, snowfall
unit handling, MapLibre v6 import/worker migration, route button accessible naming,
and a CSS specificity collision that made the canvas visually zero-height.
Earlier test failures were used to correct implementation or test assertions;
final outcomes are recorded separately, not inferred from expected behavior.

Final Chromium run: **8 passed**, with default Axe rules enabled, JavaScript and
console errors checked, real basemap loaded, and canvas height above 300 px.
The final regex credential scan checked 53 tracked text files with zero findings;
this limited scan is not a comprehensive secret detection guarantee.

## Reproduction

Use the commands in README. Set DEBUG=true for local backend tests. Run
`python live_smoke.py` from backend only when an independent ORS key is available.
It performs one bounded routing request and one batched weather request, reports
counts/coverage and fails acceptance if fewer than three distinct routes or
incomplete weather are returned. Check Pelias separately with two location
searches. Never copy a credential into a fixture or test output.

Remaining QA: real HGV corridor verification, real geocoding credentials, hosted
CORS/cold start acceptance, broader keyboard/screen-reader testing, and manual
loading/error review on a deployed environment. Chromium coverage does not
establish Safari/Firefox support. Live basemap tests need network connectivity.
