"""Invented routes and hourly fields; no network requests."""

from datetime import UTC, datetime, timedelta
from unittest.mock import patch

from crosswind.domain import Weather
from crosswind.service import analyze


def test_arrival_weather_and_overlay_are_independent():
    departure = datetime.now(UTC).replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    route = {
        "geometry": [[-77.4, 39.4], [-77.2, 39.1]],
        "meters": 35000,
        "seconds": 7200,
        "steps": [],
        "notices": [],
    }

    def forecasts(positions):
        series = {
            (departure + timedelta(hours=i)).isoformat(): Weather(20 if i == 0 else 35, 0, 0)
            for i in range(49)
        }
        return [series.copy() for _ in positions]

    with (
        patch("crosswind.providers.truck_routes", return_value=[route]),
        patch("crosswind.providers.forecasts", side_effect=forecasts),
    ):
        result = analyze(
            {
                "origin": [-77.4, 39.4],
                "destination": [-77.2, 39.1],
                "departure": departure.isoformat(),
                "spacing": 10,
                "load": 30000,
            }
        )
    evaluated = result["routes"][0]
    assert evaluated["checkpoints"][0]["risk"] == "Low"
    assert evaluated["checkpoints"][-1]["risk"] == "High"
    assert result["preferred"] == "route-1"
    assert evaluated["exposure"]["miles"]["High"] > 0
    assert result["overlay"]["samples"][0]["frames"][48]["wind"] == 35
    assert sum(evaluated["exposure"]["miles"].values()) == evaluated["meters"] / 1609.344
