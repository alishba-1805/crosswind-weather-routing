# Assessment traceability

| Requirement | Implementation / evidence |
|---|---|
| React + Django, independent repository | frontend, backend; new local Git history |
| Origin, destination, departure, load | App trip form and server validation |
| Three HGV routes | genuine ORS alternatives requested; count may be smaller; live verification blocked by absent key |
| 10/25/50 miles and arrival weather | domain checkpoints + provider hourly lookup |
| Exact hazards and load overrides | domain risk; deterministic boundary tests |
| Exact recommendation priority | domain recommend; lexicographic tests |
| Map, checkpoints, ETA, summaries | stable MapLibre sources + right inspector |
| Corridor heatmap + 0–48 hours | batched point series, categorical circles, slider |
| Responsive and accessibility | automated viewport and Axe checks; see TESTING |
| Deployment, GitHub, Loom | prepared instructions; external deliveries pending authorization/recording |

Candidate live demonstration corridor: Frederick, Maryland to Gaithersburg,
Maryland. Chosen for a short US road corridor with several regional connections;
three distinct HGV alternatives are **not yet verified**. Do not present this as
a proven demo until an independent key is supplied and a bounded smoke check
returns three distinct road geometries. Tests use invented geometry and forecast
records explicitly; they are not captured provider responses.
