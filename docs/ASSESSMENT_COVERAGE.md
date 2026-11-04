# Assessment traceability

| Requirement | Implementation / evidence |
|---|---|
| React + Django, independent repository | frontend, backend; new local Git history |
| Origin, destination, departure, load | App trip form and server validation |
| Three HGV routes | Verified live 2026-11-04: Frederick, MD to Gaithersburg, MD returned 3 distinct ORS routes (24.9, 24.2, 24.5 mi), 100% weather coverage |
| 10/25/50 miles and arrival weather | domain checkpoints + provider hourly lookup |
| Exact hazards and load overrides | domain risk; deterministic boundary tests |
| Exact recommendation priority | domain recommend; lexicographic tests |
| Map, checkpoints, ETA, summaries | stable MapLibre sources + right inspector |
| Corridor heatmap + 0–48 hours | batched point series, categorical circles, slider |
| Responsive and accessibility | automated viewport and Axe checks; see TESTING |
| Deployment, GitHub, Loom | Deployed: https://crosswind-web.onrender.com (API https://crosswind-routing-api.onrender.com); GitHub published; Loom recording pending, no link |

Live demonstration corridor: Frederick, Maryland to Gaithersburg, Maryland.
Verified live on 2026-11-04: three distinct HGV routes (24.9, 24.2, 24.5 mi), 100%
weather coverage. 25/50-mile sampling on a corridor longer than 50 miles is
unverified (this route is 24.9 mi). Live weather was Low only; Severe/No Travel
are covered by deterministic tests, not live observation. Rain/snow shared
endpoints use the higher class; assessor confirmation pending. Tests use invented geometry and forecast
records explicitly; they are not captured provider responses.
