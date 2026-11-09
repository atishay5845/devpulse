from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework import permissions

from apps.accounts.views import RegisterView, MeView, DevPulseTokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/token/", DevPulseTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/", include("apps.projects.urls")),
    path("api/", include("apps.monitors.urls")),
    path("api/", include("apps.incidents.urls")),
    path("api/", include("apps.notifications.urls")),
    path("api/", include("apps.analytics.urls")),
    path("api/", include("apps.status_pages.urls")),
    path("api/schema/", SpectacularAPIView.as_view(permission_classes=[permissions.AllowAny]), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema", permission_classes=[permissions.AllowAny]), name="swagger-ui"),
]
