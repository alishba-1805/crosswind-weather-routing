# Free deployment preparation

No deployment or GitHub push has been performed. Do not add a card or select a
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
