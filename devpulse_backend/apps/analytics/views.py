from datetime import timedelta
from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.monitors.models import Monitor, MonitorCheck

PERIODS = {"24h": timedelta(hours=24), "7d": timedelta(days=7), "30d": timedelta(days=30)}

class OverviewAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        monitors = Monitor.objects.filter(project__owner=request.user)
        project_id = request.query_params.get("project_id")
        if project_id:
            try:
                project_id = int(project_id)
            except ValueError:
                return Response({"detail": "project_id must be an integer."}, status=400)
            monitors = monitors.filter(project_id=project_id)
        counts = monitors.aggregate(
            total=Count("id"),
            up=Count("id", filter=Q(status=Monitor.Status.UP)),
            down=Count("id", filter=Q(status=Monitor.Status.DOWN)),
            unknown=Count("id", filter=Q(status=Monitor.Status.UNKNOWN)),
        )
        from apps.incidents.models import Incident
        incident_qs = Incident.objects.filter(monitor__project__owner=request.user, status__in=[Incident.Status.OPEN, Incident.Status.ACKNOWLEDGED])
        if project_id:
            incident_qs = incident_qs.filter(monitor__project_id=project_id)
        return Response({**counts, "active_incidents": incident_qs.count()})

class MonitorAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, monitor_id):
        monitor = get_object_or_404(Monitor, pk=monitor_id, project__owner=request.user)
        period_key = request.query_params.get("period", "7d")
        if period_key not in PERIODS:
            return Response({"detail": "period must be one of: 24h, 7d, 30d."}, status=400)
        since = timezone.now() - PERIODS[period_key]
        checks = MonitorCheck.objects.filter(monitor=monitor, checked_at__gte=since)
        stats = checks.aggregate(
            total=Count("id"),
            successful=Count("id", filter=Q(status=MonitorCheck.Status.UP)),
            failed=Count("id", filter=Q(status=MonitorCheck.Status.DOWN)),
            average_response_time_ms=Avg("response_time_ms"),
        )
        total = stats["total"] or 0
        successful = stats["successful"] or 0
        stats["uptime_percentage"] = round((successful / total) * 100, 2) if total else None
        stats["period"] = period_key
        stats["measurement_note"] = "Uptime is a sample-based estimate: successful checks divided by all recorded checks in this period."
        return Response({"monitor_id": monitor.id, "monitor_name": monitor.name, **stats})
