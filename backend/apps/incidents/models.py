from django.conf import settings
from django.db import models
from apps.monitors.models import Monitor

class Incident(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        ACKNOWLEDGED = "ACKNOWLEDGED", "Acknowledged"
        RESOLVED = "RESOLVED", "Resolved"

    monitor = models.ForeignKey(Monitor, on_delete=models.CASCADE, related_name="incidents")
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    started_at = models.DateTimeField(auto_now_add=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]
        indexes = [models.Index(fields=["monitor", "status", "started_at"])]

    def __str__(self):
        return f"{self.title} ({self.status})"

class IncidentEvent(models.Model):
    class EventType(models.TextChoices):
        DETECTED = "DETECTED", "Detected"
        ACKNOWLEDGED = "ACKNOWLEDGED", "Acknowledged"
        NOTE = "NOTE", "Note"
        RECOVERED = "RECOVERED", "Recovered"

    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name="events")
    event_type = models.CharField(max_length=20, choices=EventType.choices)
    message = models.CharField(max_length=1000)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
