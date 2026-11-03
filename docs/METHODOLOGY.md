# Risk and exposure

Wind mph: `<25 Low`, `[25,35) Moderate`, `[35,45) High`, `[45,55) Severe`,
`>=55 No Travel`. Rain in/h: `<.10 Low`, `[.10,.25) Moderate`, `[.25,.50) High`,
`[.50,1] Severe`, `>1 No Travel`. Snow depth in/h: `<.5 Low`, `[.5,1) Moderate`,
`[1,2) High`, `[2,3] Severe`, `>3 No Travel`. Shared endpoints use the higher
class except explicitly strict No Travel rain/snow cutoffs.

Use the maximum hazard class. Wind >=45 and <55 with load >30000 lb becomes
No Travel; wind >=35 and <45 with load >40000 becomes Severe. Equal loads do
not trigger overrides. Known No Travel dominates incomplete weather; other
incomplete checkpoints remain Unknown, never Low.

Sample at mile zero, each 10/25/50 road miles and the exact final remainder.
Scale cumulative great-circle geometry lengths to official provider road length.
Interpolate coordinates along geometry edges. Use cumulative ORS instruction
step durations at geometry endpoints for ETA anchors, interpolating by geometry
length inside each step; absent step timing falls back to route distance fraction.
ORS timing is an estimate, not hours-of-service scheduling, traffic prediction,
or a guarantee of truck speed. Long/antimeridian corridors are outside this
bounded short US corridor product scope.

Each checkpoint owns the distance between neighboring midpoints. First and last
cells end at actual route endpoints. Every mile belongs to one cell; aggregate
all six classes and conserve total distance. This is a sampled approximation,
not a continuous measured road-weather field. Average risk uses scores 0–4 over
known distance, accompanied by coverage; Unknown has no numeric risk score.

Exclude any route containing No Travel or Unknown checkpoints, even a zero-width
endpoint cell. Rank remaining routes lexicographically by Severe miles, High
miles, distance-weighted average risk, then duration. Stable provider order breaks
complete ties. Eligibility does not imply a road is legally open or safe.

Open-Meteo hourly precipitation is the preceding hour's accumulation. Use the
interval ending at ceiling(ETA), exact hour included, with wind at that interval
end. This wind lookup can differ from arrival by up to one hour; no interpolation
or extrapolation is claimed. Forecast keys and ETA comparisons use UTC. Generic
Forecast rain (large-scale) plus showers (convective) form liquid rainfall;
never add total precipitation. Requested units are mph and inches, including
new-snow depth, not snow-water equivalent. Unit mismatch becomes missing data.

Overlay base time is departure rounded down to the hour, with offsets 0–48
inclusive. Checkpoint and lateral samples form a bounded corridor point surface.
Each non-interpolated circle carries one categorical class. Gray means Unknown.
The overlay uses the submitted load, is fetched once, and cannot mutate ranking.
Outside the provider's seven-day response, frames remain Unknown.
