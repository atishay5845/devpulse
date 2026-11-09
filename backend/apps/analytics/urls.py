from django.urls import path
from .views import OverviewAnalyticsView, MonitorAnalyticsView

urlpatterns = [
    path("analytics/overview/", OverviewAnalyticsView.as_view(), name="analytics-overview"),
    path("analytics/monitors/<int:monitor_id>/", MonitorAnalyticsView.as_view(), name="monitor-analytics"),
]
