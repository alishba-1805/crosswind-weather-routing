"""Opt-in bounded real-provider acceptance. Never prints credentials."""

import json
import os
from datetime import UTC, datetime, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "crosswind.settings")
import django

django.setup()

from crosswind.providers import ProviderError  # noqa: E402 -- Django must initialize first
from crosswind.service import analyze  # noqa: E402

try:
    result = analyze(
        {
            "origin": [-77.4105, 39.4143],
            "destination": [-77.2014, 39.1434],
            "departure": (datetime.now(UTC) + timedelta(hours=1)).isoformat(),
            "load": 30000,
            "spacing": 10,
        }
    )
except ProviderError as exc:
    print(json.dumps({"status": "blocked", "code": exc.code, "message": exc.message}))
    raise SystemExit(1) from exc

print(
    json.dumps(
        {
            "checked_at": datetime.now(UTC).isoformat(),
            "source": result["source"],
            "route_count": len(result["routes"]),
            "coverage": [r["exposure"]["coverage"] for r in result["routes"]],
            "preferred": result["preferred"],
            "warnings": result["warnings"],
        },
        indent=2,
    )
)
if len(result["routes"]) != 3 or any(r["exposure"]["coverage"] < 1 for r in result["routes"]):
    raise SystemExit("Acceptance incomplete: need three distinct fully covered HGV alternatives.")
