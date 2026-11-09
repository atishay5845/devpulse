from django.urls import path
from .views import PublicStatusPageView

urlpatterns = [
    path("public/status/<slug:slug>/", PublicStatusPageView.as_view(), name="public-status-page"),
]
