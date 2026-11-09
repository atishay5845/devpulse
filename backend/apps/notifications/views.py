from rest_framework import permissions, viewsets
from apps.incidents.models import Incident
from .models import NotificationChannel, NotificationLog
from .serializers import NotificationChannelSerializer, NotificationLogSerializer

class NotificationChannelViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationChannelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return NotificationChannel.objects.filter(project__owner=self.request.user).select_related("project")

class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return NotificationLog.objects.filter(
            incident__monitor__project__owner=self.request.user
        ).select_related("incident", "channel")
