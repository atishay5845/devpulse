from django.db import models
from apps.projects.models import Project
from apps.incidents.models import Incident

class NotificationChannel(models.Model):
    class ChannelType(models.TextChoices):
        EMAIL = "EMAIL", "Email"
        DISCORD = "DISCORD", "Discord webhook"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="notification_channels")
    channel_type = models.CharField(max_length=10, choices=ChannelType.choices)
    target = models.CharField(max_length=2048)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [models.UniqueConstraint(fields=["project", "channel_type", "target"], name="unique_project_notification_target")]

    def __str__(self):
        return f"{self.project.name} - {self.channel_type}"

class NotificationLog(models.Model):
    channel = models.ForeignKey(NotificationChannel, null=True, blank=True, on_delete=models.SET_NULL, related_name="logs")
    incident = models.ForeignKey(Incident, null=True, blank=True, on_delete=models.SET_NULL, related_name="notification_logs")
    event_type = models.CharField(max_length=20)
    success = models.BooleanField(default=False)
    response_message = models.CharField(max_length=500, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-sent_at"]
