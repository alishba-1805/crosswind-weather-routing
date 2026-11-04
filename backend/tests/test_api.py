from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import httpx
import pytest
from rest_framework.test import APIClient
from django.conf import settings
from django.test import override_settings

from crosswind.providers import ProviderError, forecasts, request


@pytest.fixture
def client():
    from django.core.cache import cache

    cache.clear()
    return APIClient()


def payload():
    return {
        "origin": [-77.41, 39.41],
        "destination": [-77.15, 39.08],
        "departure": (datetime.now(UTC) + timedelta(hours=1)).isoformat(),
        "load": 30000,
        "spacing": 10,
    }


def test_health_and_validation(client):
    assert client.get("/api/health").json()["status"] == "ok"
    response = client.post("/api/analysis", {}, format="json")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation"
    for change in (
        {"spacing": 20},
        {"origin": [999, 1]},
        {"load": -1},
        {"departure": "2026-01-01T00:00"},
    ):
        assert client.post("/api/analysis", payload() | change, format="json").status_code == 400


def load_settings(monkeypatch, allowed, render):
    import importlib

    import crosswind.settings as module

    for name, value in (("ALLOWED_HOSTS", allowed), ("RENDER_EXTERNAL_HOSTNAME", render)):
        if value is None:
            monkeypatch.delenv(name, raising=False)
        else:
            monkeypatch.setenv(name, value)
    return importlib.reload(module)


@pytest.fixture
def reload_settings_after(monkeypatch):
    yield
    monkeypatch.undo()
    import importlib

    import crosswind.settings as module

    importlib.reload(module)


@pytest.mark.parametrize("method", ["get", "head"])
def test_health_with_env_configured_render_host(client, monkeypatch, reload_settings_after, method):
    configured = load_settings(
        monkeypatch, " localhost, ,127.0.0.1 ", " crosswind-api.onrender.com "
    )
    monkeypatch.delenv("ORS_API_KEY", raising=False)
    with (
        override_settings(ALLOWED_HOSTS=configured.ALLOWED_HOSTS),
        patch("crosswind.api.geocode", side_effect=AssertionError),
        patch("crosswind.api.analyze", side_effect=AssertionError),
        patch("httpx.Client.request", side_effect=AssertionError),
    ):
        response = getattr(client, method)("/api/health", HTTP_HOST="crosswind-api.onrender.com")
        unknown = client.get("/api/health", HTTP_HOST="attacker.example")
    assert configured.ALLOWED_HOSTS == ["localhost", "127.0.0.1", "crosswind-api.onrender.com"]
    assert "*" not in configured.ALLOWED_HOSTS
    assert response.status_code == 200
    assert unknown.status_code == 400
    if method == "get":
        assert response.json() == {"status": "ok", "service": "crosswind"}
    else:
        assert response.content == b""


def test_active_settings_reject_unknown_host(client):
    assert "*" not in settings.ALLOWED_HOSTS
    assert client.get("/api/health", HTTP_HOST="attacker.example").status_code == 400


def test_defaults_keep_local_hosts(monkeypatch, reload_settings_after):
    configured = load_settings(monkeypatch, "", None)
    assert configured.ALLOWED_HOSTS == ["localhost", "127.0.0.1", "testserver"]


def test_render_and_explicit_hosts_are_normalized():
    from crosswind.settings import parse_allowed_hosts

    assert parse_allowed_hosts(" app.example, api.example ", " service.onrender.com ") == [
        "app.example",
        "api.example",
        "service.onrender.com",
    ]
    assert parse_allowed_hosts(" app.example, app.example ", None) == ["app.example"]
    with pytest.raises(RuntimeError, match="hostnames only"):
        parse_allowed_hosts("https://api.example", None)


def test_credential_error(client):
    with patch(
        "crosswind.providers.key",
        side_effect=ProviderError("credentials_missing", "Set key", 503),
    ):
        response = client.post("/api/analysis", payload(), format="json")
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "credentials_missing"


def test_provider_quota():
    with patch("crosswind.providers.httpx.request", return_value=httpx.Response(429)):
        with pytest.raises(ProviderError) as exc:
            request("GET", "https://example.invalid")
    assert exc.value.code == "quota"


def test_weather_units_and_missing():
    from django.core.cache import cache

    cache.clear()
    record = {
        "hourly_units": {
            "wind_speed_10m": "mp/h",
            "rain": "inch",
            "showers": "inch",
            "snowfall": "inch",
        },
        "hourly": {
            "time": ["2026-01-01T00:00", "2026-01-01T01:00"],
            "wind_speed_10m": [25, None],
            "rain": [0.1, None],
            "showers": [0.2, 0],
            "snowfall": [1, None],
        },
    }
    with patch("crosswind.providers.request", return_value=record):
        series = forecasts([[1, 2]])[0]
    assert series["2026-01-01T00:00:00+00:00"].rain == pytest.approx(0.3)
    assert series["2026-01-01T00:00:00+00:00"].snow == 1
    assert series["2026-01-01T01:00:00+00:00"].rain is None


def test_missing_alternatives_and_forecast_failure(client):
    synthetic = [
        {
            "geometry": [[-77.41, 39.41], [-77.15, 39.08]],
            "meters": 50000,
            "seconds": 3600,
            "steps": [],
            "notices": [],
        }
    ]
    with (
        patch("crosswind.providers.truck_routes", return_value=synthetic),
        patch(
            "crosswind.providers.forecasts",
            side_effect=ProviderError("quota", "Unavailable"),
        ),
    ):
        response = client.post("/api/analysis", payload(), format="json")
    assert response.status_code == 200
    data = response.json()
    assert len(data["routes"]) == 1
    assert data["preferred"] is None
    assert data["routes"][0]["exposure"]["coverage"] == 0
    assert len(data["overlay"]["samples"][0]["frames"]) == 49
    assert len(data["warnings"]) == 2


def test_geometry_deduplication():
    from crosswind.providers import truck_routes

    feature = {
        "geometry": {"coordinates": [[0, 0], [1, 1]]},
        "properties": {"summary": {"distance": 100, "duration": 10}},
    }
    with (
        patch("crosswind.providers.key", return_value="synthetic-test-key"),
        patch("crosswind.providers.request", return_value={"features": [feature, feature]}),
    ):
        assert len(truck_routes([0, 0], [1, 1])) == 1
