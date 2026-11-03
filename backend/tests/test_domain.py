from datetime import UTC, datetime, timedelta

import pytest

from crosswind.domain import (
    MILE,
    Weather,
    checkpoints,
    exposure,
    recommend,
    risk,
    weather_at,
)


@pytest.mark.parametrize(
    "field,values",
    [
        (
            "wind",
            [
                (24.99, "Low"),
                (25, "Moderate"),
                (35, "High"),
                (45, "Severe"),
                (55, "No Travel"),
            ],
        ),
        (
            "rain",
            [
                (0.099, "Low"),
                (0.1, "Moderate"),
                (0.25, "High"),
                (0.5, "Severe"),
                (1, "Severe"),
                (1.001, "No Travel"),
            ],
        ),
        (
            "snow",
            [
                (0.499, "Low"),
                (0.5, "Moderate"),
                (1, "High"),
                (2, "Severe"),
                (3, "Severe"),
                (3.001, "No Travel"),
            ],
        ),
    ],
)
def test_boundaries(field, values):
    for value, expected in values:
        data = dict(wind=0, rain=0, snow=0)
        data[field] = value
        assert risk(Weather(**data), 0) == expected


@pytest.mark.parametrize(
    "wind,load,expected",
    [
        (45, 30000, "Severe"),
        (45, 30001, "No Travel"),
        (35, 40000, "High"),
        (35, 40001, "Severe"),
        (55, 0, "No Travel"),
        (44.9, 30001, "High"),
        (54.9, 30000, "Severe"),
    ],
)
def test_load(wind, load, expected):
    assert risk(Weather(wind, 0, 0), load) == expected


def test_unknown_and_mixed():
    assert risk(Weather(0, None, 0), 0) == "Unknown"
    assert risk(Weather(55, None, 0), 0) == "No Travel"
    assert risk(Weather(25, 0.5, 1), 0) == "Severe"
    assert risk(Weather(float("nan"), 0, 0), 0) == "Unknown"


@pytest.mark.parametrize("spacing", [10, 25, 50])
@pytest.mark.parametrize("distance", [5, 50, 63])
def test_sampling_conservation(spacing, distance):
    start = datetime(2026, 1, 1, tzinfo=UTC)
    points = checkpoints([[0, 0], [0.3, 0], [1, 0]], distance * MILE, 3600, spacing, start)
    assert points[0]["mile"] == 0
    assert points[-1]["mile"] == pytest.approx(distance)
    assert points[-1]["position"] == pytest.approx([1, 0])
    assert datetime.fromisoformat(points[-1]["eta"]) == start + timedelta(hours=1)
    assert len({p["mile"] for p in points}) == len(points)
    for p in points:
        p["risk"] = "High"
    assert sum(exposure(points, distance)["miles"].values()) == pytest.approx(distance)


def test_midpoint_cells():
    points = [
        {"mile": 0, "risk": "Low"},
        {"mile": 10, "risk": "Severe"},
        {"mile": 15, "risk": "Unknown"},
    ]
    result = exposure(points, 15)
    assert result["miles"]["Low"] == 5
    assert result["miles"]["Severe"] == 7.5
    assert result["miles"]["Unknown"] == 2.5
    assert result["coverage"] == pytest.approx(12.5 / 15)
    assert result["average"] == pytest.approx(1.8)


def test_provider_step_timing():
    start = datetime(2026, 1, 1, tzinfo=UTC)
    p = checkpoints(
        [[0, 0], [1, 0], [2, 0]],
        20 * MILE,
        3600,
        10,
        start,
        [
            {"duration": 3000, "way_points": [0, 1]},
            {"duration": 600, "way_points": [1, 2]},
        ],
    )
    assert datetime.fromisoformat(p[1]["eta"]) == start + timedelta(seconds=3000)


def test_hour_alignment_and_midnight():
    stamp = datetime(2026, 1, 2, tzinfo=UTC)
    w = Weather(25, 0.2, 0)
    series = {stamp.isoformat(): w}
    assert weather_at(series, stamp - timedelta(minutes=1)) == w
    assert weather_at(series, stamp) == w
    assert weather_at(series, stamp + timedelta(seconds=1)).wind is None
    assert weather_at(series, datetime.fromisoformat("2026-01-02T05:00:00+05:00")) == w


def route(id, severe, high, average, seconds, level="Low"):
    return {
        "id": id,
        "seconds": seconds,
        "checkpoints": [{"risk": level}],
        "exposure": {"miles": {"Severe": severe, "High": high}, "average": average},
    }


def test_lexicographic_ranking():
    assert recommend([route("a", 0, 100, 2, 999), route("b", 0.01, 0, 0, 1)]) == "a"
    assert recommend([route("a", 0, 1, 2, 999), route("b", 0, 2, 0, 1)]) == "a"
    assert recommend([route("a", 0, 0, 1, 999), route("b", 0, 0, 2, 1)]) == "a"
    assert recommend([route("a", 0, 0, 1, 999), route("b", 0, 0, 1, 1)]) == "b"
    assert (
        recommend([route("a", 0, 0, 0, 1, "Unknown"), route("b", 0, 0, 0, 1, "No Travel")]) is None
    )
