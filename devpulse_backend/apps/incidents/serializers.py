from rest_framework import serializers
from .models import Incident, IncidentEvent

class IncidentEventSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True, default=None)

    class Meta:
        model = IncidentEvent
        fields = ("id", "event_type", "message", "created_by_username", "created_at")

class IncidentSerializer(serializers.ModelSerializer):
    monitor_name = serializers.CharField(source="monitor.name", read_only=True)
    monitor_url = serializers.URLField(source="monitor.url", read_only=True)
    project_name = serializers.CharField(source="monitor.project.name", read_only=True)
    events = IncidentEventSerializer(many=True, read_only=True)

    class Meta:
        model = Incident
        fields = (
            "id", "monitor", "monitor_name", "monitor_url", "project_name",
            "title", "description", "status", "started_at", "acknowledged_at",
            "resolved_at", "events",
        )
