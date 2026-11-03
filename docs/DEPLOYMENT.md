# Free deployment preparation

Source is published at https://github.com/alishba-1805/crosswind-weather-routing
on main. No deployment has been performed. Do not add a card or select a
paid tier. Provider account requirements may change; stop if a signup requires
payment. No database, background worker or paid resource is required.

1. After review and authorization, create a NEW Crosswind GitHub repository and
   add its remote here; never reuse another repository or deployment.
2. Create `crosswind-api` as a Render **Free** Python web service, root `backend`,
   install `pip install -r requirements.txt`, start
   `gunicorn crosswind.wsgi:application --bind 0.0.0.0:$PORT --workers 1 --timeout 90`.
   Select free explicitly. Health path `/api/health`. Free services sleep after
   inactivity; expect cold starts. See [Render free services](https://render.com/docs/free)
   and [first deployment](https://render.com/docs/your-first-deploy).
3. Set independent `ORS_API_KEY`, a generated `DJANGO_SECRET_KEY`, `DEBUG=false`,
   exact `ALLOWED_HOSTS=crosswind-api.onrender.com` (use actual assigned hostname)
   and `CORS_ORIGINS=https://your-actual-crosswind-site.netlify.app`.
4. Create an independent Netlify **Free** static site, base `frontend`, command
   `npm ci && npm run build`, publish `dist`. Set `VITE_API_URL` to the actual
   HTTPS backend origin, with no trailing slash. Rebuild when changing it.
   [Netlify plans](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)
   explain free credit limits; do not enable paid upgrades or auto recharge.
5. Verify HTTPS, exact CORS, public health, real autocomplete, three distinct HGV
   alternatives, timestamps and live weather units. Confirm errors and 0/48h.
   Run browser checks against the public origins and inspect cold-start behavior.

Publication gate: Open-Meteo's [terms](https://open-meteo.com/en/terms) restrict
the hosted free API to non-commercial use. A hiring portfolio could be viewed as
promotional. Eligibility is uncertain; obtain provider clarification before
public production use. Do not silently switch to a paid plan.

The process-local quota limiter resets on restart and is not a global upstream
quota guarantee. Review actual HeiGIT dashboard limits before exposing traffic.
Use the free service's platform logs without logging request authorization headers.


## Independent Render frontend handoff

Connect Alishba's GitHub account and select only `alishba-1805/crosswind-weather-routing`,
branch `main`. Create a new Static Site named `crosswind-web`, root `frontend`,
build `npm ci && npm run build`, publish directory `dist`. There is no start command.
Set `NODE_VERSION=24` and `VITE_API_URL=https://<actual-backend-host>` with no trailing slash.
Do not put provider credentials in frontend variables.

For the backend Web Service use the existing root/build/start settings above,
Free plan, and `PYTHON_VERSION=3.13.17`. Generate a unique DJANGO_SECRET_KEY and
set an independent ORS_API_KEY. Set DEBUG=false, ALLOWED_HOSTS to the exact
backend hostname (no scheme), and CORS_ORIGINS to the exact frontend HTTPS
origin (no trailing slash). Use the actual assigned hostnames rather than
assuming the requested service names will be available. After changing the
frontend API URL, rebuild the static site. Verify /api/health, exact CORS and
live-provider acceptance. Neither service requires a database.

[Render static-site setup](https://render.com/docs/static-sites) and
[Vite build settings](https://render.com/tutorials/web-service-vs-static-site/static-sites)
confirm the static-site deployment model. Do not create services until deployment
is explicitly authorized; stop if payment information is required.
