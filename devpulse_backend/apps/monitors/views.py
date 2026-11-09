from django.conf import settings
from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.incidents.services import record_monitor_check
from .models import Monitor
from .serializers import MonitorSerializer, MonitorCheckSerializer
from .services import perform_http_check

class MonitorViewSet(viewsets.ModelViewSet):
    serializer_class = MonitorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Monitor.objects.filter(project__owner=self.request.user).select_related("project")

    @action(detail=True, methods=["get"], url_path="checks")
    def checks(self, request, pk=None):
        monitor = self.get_object()
        checks = monitor.checks.all()[:100]
        return Response(MonitorCheckSerializer(checks, many=True).data)

    @action(detail=True, methods=["post"], url_path="check-now")
    def check_now(self, request, pk=None):
        monitor = self.get_object()
        if not monitor.is_active:
            return Response({"detail": "This monitor is paused."}, status=status.HTTP_400_BAD_REQUEST)
        result = perform_http_check(monitor)
        check = record_monitor_check(monitor.id, result)
        if check is None:
            return Response({"detail": "The monitor is no longer active."}, status=status.HTTP_409_CONFLICT)
        return Response(MonitorCheckSerializer(check).data, status=status.HTTP_201_CREATED)
