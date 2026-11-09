from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import Incident, IncidentEvent
from .serializers import IncidentSerializer

class IncidentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = IncidentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Incident.objects.filter(monitor__project__owner=self.request.user).select_related(
            "monitor", "monitor__project"
        ).prefetch_related("events", "events__created_by")
        incident_status = self.request.query_params.get("status")
        if incident_status:
            queryset = queryset.filter(status=incident_status.upper())
        return queryset

    @action(detail=True, methods=["post"])
    def acknowledge(self, request, pk=None):
        incident = self.get_object()
        if incident.status == Incident.Status.RESOLVED:
            return Response({"detail": "Resolved incidents cannot be acknowledged."}, status=status.HTTP_400_BAD_REQUEST)
        if incident.status != Incident.Status.ACKNOWLEDGED:
            incident.status = Incident.Status.ACKNOWLEDGED
            incident.acknowledged_at = timezone.now()
            incident.save(update_fields=["status", "acknowledged_at"])
            IncidentEvent.objects.create(
                incident=incident,
                event_type=IncidentEvent.EventType.ACKNOWLEDGED,
                message="Incident acknowledged by a project owner.",
                created_by=request.user,
            )
        return Response(self.get_serializer(incident).data)

    @action(detail=True, methods=["post"], url_path="notes")
    def add_note(self, request, pk=None):
        incident = self.get_object()
        message = str(request.data.get("message", "")).strip()
        if not message or len(message) > 1000:
            raise ValidationError({"message": "Provide a note of 1 to 1000 characters."})
        event = IncidentEvent.objects.create(
            incident=incident,
            event_type=IncidentEvent.EventType.NOTE,
            message=message,
            created_by=request.user,
        )
        return Response({"id": event.id, "message": event.message, "created_at": event.created_at}, status=status.HTTP_201_CREATED)
