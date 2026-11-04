# Delivery continuation

Deployed and live-audited on 2026-11-04: frontend https://crosswind-web.onrender.com,
backend https://crosswind-routing-api.onrender.com. Backend suite 36 passed. Frederick, MD to
Gaithersburg, MD returned 3 routes (24.9/24.2/24.5 mi) with 100% weather coverage.
Not production-final: the items below remain open.

Remaining work: (1) record the 5-10 minute Loom and add its real link (none exists);
(2) verify 25/50-mile sampling on a corridor longer than 50 miles; (3) obtain
assessor confirmation that rain/snow shared endpoints take the higher class;
(4) resolve Open-Meteo/HeiGIT licensing and eligibility. Live Severe/No Travel
weather has not been observed; tests cover it. The numbered steps below are the
original local checklist, kept for reference.

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
