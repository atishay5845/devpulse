
import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv


# ============================================================
# BASE CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

DEBUG = os.getenv("DEBUG", "False").lower() == "true"

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "dev-only-change-me-before-deployment"
)

if not DEBUG and SECRET_KEY == "dev-only-change-me-before-deployment":
    raise RuntimeError(
        "Set a strong SECRET_KEY environment variable before production deployment."
    )


# ============================================================
# HOST CONFIGURATION
# ============================================================

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "ALLOWED_HOSTS",
        "127.0.0.1,localhost"
    ).split(",")
    if host.strip()
]


# ============================================================
# INSTALLED APPLICATIONS
# ============================================================

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "corsheaders",
    "rest_framework",
    "drf_spectacular",

    "apps.accounts.apps.AccountsConfig",
    "apps.projects.apps.ProjectsConfig",
    "apps.monitors.apps.MonitorsConfig",
    "apps.incidents.apps.IncidentsConfig",
    "apps.notifications.apps.NotificationsConfig",
    "apps.analytics.apps.AnalyticsConfig",
    "apps.status_pages.apps.StatusPagesConfig",
]


# ============================================================
# MIDDLEWARE
# ============================================================

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",

    "corsheaders.middleware.CorsMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ============================================================
# URL AND APPLICATION CONFIGURATION
# ============================================================

ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ============================================================
# DATABASE CONFIGURATION
# Neon PostgreSQL on Render
# Local PostgreSQL / SQLite for development
# ============================================================

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=0,
            ssl_require=True,
        )
    }

else:
    DB_ENGINE = os.getenv("DB_ENGINE", "postgresql").lower()

    if DB_ENGINE == "sqlite":
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": BASE_DIR / "db.sqlite3",
            }
        }

    else:
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": os.getenv("DB_NAME", "devpulse"),
                "USER": os.getenv("DB_USER", "postgres"),
                "PASSWORD": os.getenv("DB_PASSWORD", ""),
                "HOST": os.getenv("DB_HOST", "127.0.0.1"),
                "PORT": os.getenv("DB_PORT", "5432"),
                "CONN_MAX_AGE": 0,
                "OPTIONS": {
                    "sslmode": os.getenv("DB_SSLMODE", "prefer"),
                },
            }
        }


# ============================================================
# CUSTOM USER MODEL
# ============================================================

AUTH_USER_MODEL = "accounts.User"


# ============================================================
# PASSWORD VALIDATION
# ============================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 10},
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"
    },
]


# ============================================================
# INTERNATIONALIZATION
# ============================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Kolkata"

USE_I18N = True

USE_TZ = True


# ============================================================
# STATIC FILE CONFIGURATION
# ============================================================

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ============================================================
# CORS CONFIGURATION
# ============================================================

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173"
    ).split(",")
    if origin.strip()
]


# ============================================================
# CSRF CONFIGURATION
# ============================================================

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CSRF_TRUSTED_ORIGINS",
        ""
    ).split(",")
    if origin.strip()
]


# ============================================================
# DJANGO REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],

    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],

    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",

    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),

    "PAGE_SIZE": 20,
}


# ============================================================
# JWT AUTHENTICATION
# ============================================================

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=20),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}


# ============================================================
# API DOCUMENTATION
# ============================================================

SPECTACULAR_SETTINGS = {
    "TITLE": "DevPulse API",
    "DESCRIPTION": "Website monitoring and incident management API",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}


# ============================================================
# EMAIL CONFIGURATION
# ============================================================

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")

EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))

EMAIL_USE_TLS = (
    os.getenv("EMAIL_USE_TLS", "True").lower() == "true"
)

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")

EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")

DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    "DevPulse <no-reply@example.com>"
)


# ============================================================
# MONITORING CONFIGURATION
# ============================================================

MONITOR_BATCH_SIZE = int(
    os.getenv("MONITOR_BATCH_SIZE", "100")
)

MONITOR_FAILURE_THRESHOLD = max(
    1,
    int(os.getenv("MONITOR_FAILURE_THRESHOLD", "2"))
)

MONITOR_RECOVERY_THRESHOLD = max(
    1,
    int(os.getenv("MONITOR_RECOVERY_THRESHOLD", "2"))
)


# ============================================================
# SECURITY CONFIGURATION
# ============================================================

# Render terminates HTTPS at its edge.
SECURE_PROXY_SSL_HEADER = (
    "HTTP_X_FORWARDED_PROTO",
    "https",
)

SECURE_SSL_REDIRECT = (
    os.getenv(
        "SECURE_SSL_REDIRECT",
        "False" if DEBUG else "True"
    ).lower() == "true"
)

SESSION_COOKIE_SECURE = not DEBUG

CSRF_COOKIE_SECURE = not DEBUG

SECURE_CONTENT_TYPE_NOSNIFF = True

X_FRAME_OPTIONS = "DENY"

SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

SECURE_HSTS_SECONDS = int(
    os.getenv("SECURE_HSTS_SECONDS", "0")
)
