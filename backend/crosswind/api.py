from datetime import UTC, datetime, timedelta
from math import isfinite

from django.urls import path
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .providers import ProviderError, geocode
from .service import analyze


class Trip(serializers.Serializer):
    origin = serializers.ListField(child=serializers.FloatField(), min_length=2, max_length=2)
    destination = serializers.ListField(child=serializers.FloatField(), min_length=2, max_length=2)
    departure = serializers.CharField()
    load = serializers.FloatField(min_value=0, max_value=150000)
    spacing = serializers.ChoiceField(choices=[10, 25, 50])

    def validate(self, data):
        if not isfinite(data["load"]):
            raise serializers.ValidationError({"load": "Use a finite load weight."})
        for field in ("origin", "destination"):
            lon, lat = data[field]
            if not (-180 <= lon <= 180 and -85 <= lat <= 85):
                raise serializers.ValidationError({field: "Invalid longitude/latitude."})
        if data["origin"] == data["destination"]:
            raise serializers.ValidationError("Choose different endpoints.")
        try:
            departure = datetime.fromisoformat(data["departure"])
            if departure.tzinfo is None:
                raise ValueError()
            departure = departure.astimezone(UTC)
            if (
                not datetime.now(UTC) - timedelta(minutes=5)
                <= departure
                <= datetime.now(UTC) + timedelta(days=5)
            ):
                raise ValueError()
            data["departure"] = departure.isoformat()
        except ValueError as exc:
            raise serializers.ValidationError(
                {"departure": "Use an offset-aware time from now through five days ahead."}
            ) from exc
        return data


def failure(exc):
    return Response({"error": {"code": exc.code, "message": exc.message}}, status=exc.status)


@api_view(["GET", "HEAD"])
def health(request):
    return Response({"status": "ok", "service": "crosswind"})


@api_view(["GET"])
def places(request):
    query = request.query_params.get("q", "").strip()
    if not 3 <= len(query) <= 160:
        return Response(
            {
                "error": {
                    "code": "validation",
                    "message": "Search must contain 3–160 characters.",
                }
            },
            status=400,
        )
    try:
        return Response({"places": geocode(query)})
    except ProviderError as exc:
        return failure(exc)


@api_view(["POST"])
def trip(request):
    serializer = Trip(data=request.data)
    if not serializer.is_valid():
        return Response(
            {
                "error": {
                    "code": "validation",
                    "message": "Check trip inputs.",
                    "fields": serializer.errors,
                }
            },
            status=400,
        )
    try:
        return Response(analyze(serializer.validated_data))
    except ProviderError as exc:
        return failure(exc)
    except (KeyError, TypeError, ValueError, IndexError):
        return Response(
            {
                "error": {
                    "code": "invalid_provider_data",
                    "message": "Provider returned unusable route or forecast data.",
                }
            },
            status=502,
        )


urlpatterns = [
    path("api/health", health),
    path("api/places", places),
    path("api/analysis", trip),
]
