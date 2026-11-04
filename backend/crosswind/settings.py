import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def parse_allowed_hosts(configured: str | None, render_hostname: str | None) -> list[str]:
    """Combine exact hostnames from deployment configuration; reject URL input."""
    hosts = [host.strip().rstrip(".") for host in (configured or "").split(",")]
    if render_hostname and render_hostname.strip():
        hosts.append(render_hostname.strip().rstrip("."))
    hosts = [host for host in hosts if host]
    if any("://" in host or "/" in host for host in hosts):
        raise RuntimeError("ALLOWED_HOSTS and RENDER_EXTERNAL_HOSTNAME must contain hostnames only")
    return list(dict.fromkeys(hosts)) or ["localhost", "127.0.0.1", "testserver"]


DEBUG = os.getenv("DEBUG", "false").lower() == "true"
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "local-development-only-crosswind")
if not DEBUG and SECRET_KEY == "local-development-only-crosswind":
    raise RuntimeError("Set DJANGO_SECRET_KEY for production")
ALLOWED_HOSTS = parse_allowed_hosts(
    os.getenv("ALLOWED_HOSTS"), os.getenv("RENDER_EXTERNAL_HOSTNAME")
)
ROOT_URLCONF = "crosswind.api"
INSTALLED_APPS = ["rest_framework", "corsheaders"]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]
CORS_ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
REST_FRAMEWORK = {
    "UNAUTHENTICATED_USER": None,
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.AnonRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {"anon": "20/min"},
}
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "crosswind",
        "OPTIONS": {"MAX_ENTRIES": 256},
    }
}
USE_TZ = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
