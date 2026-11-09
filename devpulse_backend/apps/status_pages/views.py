from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import StatusPage
from apps.monitors.models import Monitor
from apps.incidents.models import Incident

class PublicStatusPageView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, slug):
        page = get_object_or_404(StatusPage.objects.select_related("project"), slug=slug, is_public=True)
        monitors = Monitor.objects.filter(project=page.project, is_active=True).order_by("name")
        monitor_data = [{"name": monitor.name, "status": monitor.status} for monitor in monitors]
        if monitor_data and all(item["status"] == Monitor.Status.UP for item in monitor_data):
            overall_status = "OPERATIONAL"
        elif any(item["status"] == Monitor.Status.DOWN for item in monitor_data):
            overall_status = "DEGRADED"
        else:
            overall_status = "UNKNOWN"

        incidents = Incident.objects.filter(
            monitor__project=page.project,
            status__in=[Incident.Status.OPEN, Incident.Status.ACKNOWLEDGED],
        ).select_related("monitor").order_by("-started_at")
        return Response({
            "title": page.title,
            "overall_status": overall_status,
            "services": monitor_data,
            "active_incidents": [{
                "title": incident.title,
                "service": incident.monitor.name,
                "status": incident.status,
                "started_at": incident.started_at,
            } for incident in incidents],
        })
