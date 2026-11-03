# Delivery continuation

The local application and deterministic checks are implemented. External
acceptance is not complete, and production readiness is not claimed.

1. Put an independently obtained free HeiGIT key in the ignored `backend/.env`.
   Do not send credentials in chat or put them in frontend variables.
2. Start Django and Vite using README. Confirm `/api/health`. Test Pelias by
   searching Frederick and Gaithersburg. From backend run `python live_smoke.py`
   once. It bounds routing and batched weather to one request each.
3. Record actual distinct route count, warnings, weather coverage and unit
   handling. If fewer than three HGV alternatives exist, investigate another
   short US corridor with a small request budget; never fabricate a third route.
4. Confirm Open-Meteo non-commercial eligibility before publication. Review
   exact independent account quotas and public traffic limits.
5. Obtain explicit push/deployment authorization, then create separate Crosswind
   GitHub, free backend and free static services using DEPLOYMENT.md.
6. Run real-provider acceptance and browser checks on the deployed HTTPS origins.
   Capture a genuine live-results screenshot. Record the 5–10 minute Loom using
   LOOM.md and add real repository/app/video links to README.

Local services used in this work: backend `127.0.0.1:8000`, frontend
`127.0.0.1:5173`. No external repository or deployment is connected. Local commits
use `Crosswind Development Tools <crosswind@localhost>` to avoid implying human
authorship through this machine's unrelated default Git identity.
