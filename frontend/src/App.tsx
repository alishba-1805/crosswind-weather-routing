import { useState } from "react";
import { PlaceSearch } from "./PlaceSearch";
import { RouteMap } from "./RouteMap";
import {
  api,
  colors,
  levels,
  time,
  type Analysis,
  type Checkpoint,
  type Place,
} from "./types";
import s from "./App.module.css";
export default function App() {
  const [origin, setOrigin] = useState<Place | null>(null),
    [destination, setDestination] = useState<Place | null>(null);
  const [data, setData] = useState<Analysis | null>(null);
  const [selected, setSelected] = useState("");
  const [point, setPoint] = useState<Checkpoint | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const route = data?.routes.find((r) => r.id === selected);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const problems: Record<string, string> = {};
    if (!origin) problems.origin = "Choose an origin from the suggestions.";
    if (!destination)
      problems.destination = "Choose a destination from the suggestions.";
    const when = new Date(String(form.get("departure"))).getTime();
    if (!form.get("departure") || Number.isNaN(when))
      problems.departure = "Enter a departure date and time.";
    else if (when < Date.now() - 300000 || when > Date.now() + 5 * 86400000)
      problems.departure =
        "Departure must be from now through five days ahead.";
    const loadText = String(form.get("load")).trim();
    const loadValue = Number(loadText);
    if (
      !loadText ||
      !Number.isFinite(loadValue) ||
      loadValue < 0 ||
      loadValue > 150000
    )
      problems.load = "Enter a load from 0 to 150,000 lb.";
    setFields(problems);
    if (!origin || !destination || Object.keys(problems).length) {
      setError("Fix the highlighted fields to compare routes.");
      return;
    }
    setLoading(true);
    setError("");
    setData(null);
    setPoint(null);
    try {
      const result = await api<Analysis>("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: origin.position,
          destination: destination.position,
          departure: new Date(when).toISOString(),
          load: loadValue,
          spacing: Number(form.get("spacing")),
        }),
      });
      setData(result);
      setSelected(result.preferred || result.routes[0].id);
      setOffset(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }
  function select(id: string) {
    setSelected(id);
    setPoint(null);
  }
  const initial = new Date(Date.now() + 3600000);
  const localDate = new Date(
    initial.getTime() - initial.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);
  return (
    <div className={s.app}>
      <header className={s.header}>
        <a href="/" className={s.brand}>
          <span className={s.mark}>↗</span>CROSSWIND
          <span className={s.edition}>ROUTE INTELLIGENCE</span>
        </a>
      </header>
      <main>
        <details open className={s.planner}>
          <summary>
            Trip planner{" "}
            <span>US truck routes · short corridors up to 100 km</span>
          </summary>
          <form onSubmit={submit} noValidate>
            <PlaceSearch
              label="Origin"
              invalid={fields.origin}
              onSelect={setOrigin}
            />
            <PlaceSearch
              label="Destination"
              invalid={fields.destination}
              onSelect={setDestination}
            />
            <label>
              Departure · local time
              <input
                name="departure"
                type="datetime-local"
                required
                aria-invalid={fields.departure ? true : undefined}
                aria-describedby={
                  fields.departure ? "departure-error" : undefined
                }
                defaultValue={localDate}
              />
              {fields.departure && (
                <small id="departure-error" className={s.fieldError}>
                  {fields.departure}
                </small>
              )}
            </label>
            <label>
              Load · lb
              <input
                name="load"
                type="number"
                min="0"
                max="150000"
                required
                aria-invalid={fields.load ? true : undefined}
                aria-describedby={fields.load ? "load-error" : undefined}
                defaultValue="30000"
              />
              {fields.load && (
                <small id="load-error" className={s.fieldError}>
                  {fields.load}
                </small>
              )}
            </label>
            <label>
              Sampling
              <select name="spacing" defaultValue="10">
                <option value="10">Every 10 mi</option>
                <option value="25">Every 25 mi</option>
                <option value="50">Every 50 mi</option>
              </select>
            </label>
            <button className={s.primary} disabled={loading}>
              {loading ? "Analyzing…" : "Compare routes ↗"}
            </button>
          </form>
        </details>
        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}
        <div className={s.workspace}>
          <section className={s.mapColumn}>
            <RouteMap
              data={data}
              selected={selected}
              offset={offset}
              onSelect={select}
              onCheckpoint={setPoint}
            />
            {data && (
              <section className={s.dock} aria-label="Corridor forecast">
                <div>
                  <span className={s.eyebrow}>CORRIDOR FORECAST</span>
                  <strong>
                    {time(
                      new Date(
                        new Date(data.overlay.base_time).getTime() +
                          offset * 3600000,
                      ).toISOString(),
                    )}
                  </strong>
                  <small>
                    Hourly samples · separate from trip arrival risks
                  </small>
                </div>
                <label className={s.slider}>
                  Forecast offset: +{offset}h
                  <input
                    aria-label="Forecast offset hours"
                    type="range"
                    min="0"
                    max="48"
                    step="1"
                    value={offset}
                    onChange={(e) => setOffset(Number(e.target.value))}
                  />
                  <span>
                    0h <span>24h</span> 48h
                  </span>
                </label>
              </section>
            )}
            <div className={s.legend}>
              {levels.map((l) => (
                <span key={l}>
                  <i style={{ background: colors[l] }} />
                  {l}
                </span>
              ))}
            </div>
          </section>
          <aside className={s.inspector} aria-label="Route comparison">
            <details open className={s.sheet}>
              <summary className={s.sheetToggle}>
                Route comparison · {data?.routes.length ?? 0} routes
              </summary>
              <div className={s.sectionHeading}>
                <span className={s.eyebrow}>EXPOSURE ANALYSIS</span>
                <span>
                  {data ? String(data.routes.length).padStart(2, "0") : "—"}{" "}
                  ROUTES
                </span>
              </div>
              <h1>
                Choose the road
                <br />
                with more clarity.
              </h1>
              {loading ? (
                <div role="status" className={s.empty}>
                  <div className={s.pulse} />
                  <h2>Reading the corridor</h2>
                  <p>
                    Requesting truck alternatives and arrival-hour forecasts.
                  </p>
                </div>
              ) : !data ? (
                <div className={s.empty}>
                  <span className={s.number}>01 / PLAN YOUR TRIP</span>
                  <h2>
                    Weather changes.
                    <br />
                    Your route can, too.
                  </h2>
                  <p>
                    Enter two nearby US locations to compare weather exposure
                    along genuine truck routes.
                  </p>
                  <p>
                    We check wind, rain and snow at estimated checkpoint
                    arrivals, with your cargo load in view.
                  </p>
                </div>
              ) : (
                <>
                  <div className={s.recommendation}>
                    <span className={s.eyebrow}>
                      {data.preferred
                        ? "PREFERRED / " +
                          data.preferred.replace("route-", "ROUTE ")
                        : "NO ELIGIBLE RECOMMENDATION"}
                    </span>
                    <p>{data.explanation}</p>
                  </div>
                  {data.warnings.map((w) => (
                    <p className={s.notice} key={w}>
                      {w}
                    </p>
                  ))}
                  <div
                    className={s.table}
                    role="region"
                    aria-label="Route exposure comparison"
                  >
                    <div className={s.row}>
                      <span>Route / travel</span>
                      <span>Severe</span>
                      <span>High</span>
                      <span>Coverage</span>
                    </div>
                    {data.routes.map((r, i) => (
                      <button
                        className={`${s.row} ${selected === r.id ? s.selected : ""}`}
                        key={r.id}
                        aria-pressed={selected === r.id}
                        onClick={() => select(r.id)}
                      >
                        <span>
                          <b>
                            Route {i + 1} {data.preferred === r.id ? "↗" : ""}
                          </b>
                          <small>
                            {(r.meters / 1609.344).toFixed(1)} mi ·{" "}
                            {Math.round(r.seconds / 60)} min
                          </small>
                        </span>
                        <span>
                          {r.exposure.miles.Severe.toFixed(1)}
                          <small>mi</small>
                        </span>
                        <span>
                          {r.exposure.miles.High.toFixed(1)}
                          <small>mi</small>
                        </span>
                        <span>
                          {Math.round(r.exposure.coverage * 100)}%
                          <small>known</small>
                        </span>
                      </button>
                    ))}
                  </div>
                  {route && (
                    <>
                      <h2 className={s.subheading}>
                        Selected route · checkpoint log
                      </h2>
                      <div className={s.exposure}>
                        {levels
                          .filter((l) => route.exposure.miles[l] > 0)
                          .map((l) => (
                            <div key={l}>
                              <span style={{ color: colors[l] }}>{l}</span>
                              <b>{route.exposure.miles[l].toFixed(1)} mi</b>
                            </div>
                          ))}
                      </div>
                      <p className={s.muted}>
                        Distance-weighted score:{" "}
                        {route.exposure.average?.toFixed(2) ?? "Unknown"} / 4.
                        Provider notices: {route.notices.length}.
                      </p>
                      <div className={s.checkpoints}>
                        {route.checkpoints.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => setPoint(p)}
                            aria-pressed={point === p}
                          >
                            <i style={{ background: colors[p.risk] }} />
                            <span>
                              <b>
                                {i === 0
                                  ? "Origin"
                                  : i === route.checkpoints.length - 1
                                    ? "Destination"
                                    : `Mile ${p.mile.toFixed(1)}`}
                              </b>
                              <small>{time(p.eta)}</small>
                            </span>
                            <span style={{ color: colors[p.risk] }}>
                              {p.risk}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {point && (
                    <section
                      className={s.weather}
                      aria-label="Checkpoint weather"
                    >
                      <h2>
                        Mile {point.mile.toFixed(1)} · {point.risk}
                      </h2>
                      <p>Arrival {time(point.eta)}</p>
                      <dl>
                        {(["wind", "rain", "snow"] as const).map((k, i) => (
                          <div key={k}>
                            <dt>{k}</dt>
                            <dd>
                              {point.weather[k] === null
                                ? "Unknown"
                                : point.weather[k]?.toFixed(2)}{" "}
                              {i === 0 ? "mph" : "in/h"}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      <small>
                        Forecast:{" "}
                        {point.weather.valid_at
                          ? time(point.weather.valid_at)
                          : "Unavailable"}
                        <br />
                        Retrieved:{" "}
                        {point.weather.retrieved_at
                          ? time(point.weather.retrieved_at)
                          : "Unavailable"}
                      </small>
                    </section>
                  )}
                  <p className={s.muted}>
                    {data.source}. Sampled estimates; check official road
                    closures and advisories before travel.
                  </p>
                </>
              )}
            </details>
          </aside>
        </div>
      </main>
      <footer>
        Crosswind{" "}
        <span>Routing © HeiGIT / ORS · Weather © Open-Meteo (CC BY 4.0)</span>
      </footer>
    </div>
  );
}
