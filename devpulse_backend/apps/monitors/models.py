from django.db import models
from django.utils import timezone
from apps.projects.models import Project

class Monitor(models.Model):
    class Status(models.TextChoices):
        UP = "UP", "Up"
        DOWN = "DOWN", "Down"
        UNKNOWN = "UNKNOWN", "Unknown"

    INTERVAL_CHOICES = [
        (60, "Every 1 minute"),
        (300, "Every 5 minutes"),
        (600, "Every 10 minutes"),
        (1800, "Every 30 minutes"),
        (3600, "Every 1 hour"),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="monitors")
    name = models.CharField(max_length=120)
    url = models.URLField(max_length=2048)
    check_interval = models.PositiveIntegerField(choices=INTERVAL_CHOICES, default=300)
    timeout = models.PositiveSmallIntegerField(default=10)
    expected_status_code = models.PositiveSmallIntegerField(default=200)
    expected_keyword = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.UNKNOWN)
    consecutive_failures = models.PositiveSmallIntegerField(default=0)
    consecutive_successes = models.PositiveSmallIntegerField(default=0)
    last_checked_at = models.DateTimeField(null=True, blank=True)
    next_check_at = models.DateTimeField(default=timezone.now, db_index=True)
    lease_until = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["is_active", "next_check_at"])]

    def __str__(self):
        return f"{self.name} ({self.url})"

class MonitorCheck(models.Model):
    class Status(models.TextChoices):
        UP = "UP", "Up"
        DOWN = "DOWN", "Down"

    monitor = models.ForeignKey(Monitor, on_delete=models.CASCADE, related_name="checks")
    status = models.CharField(max_length=10, choices=Status.choices)
    status_code = models.PositiveSmallIntegerField(null=True, blank=True)
    response_time_ms = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    error_message = models.CharField(max_length=500, blank=True)
    checked_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["-checked_at"]
        indexes = [models.Index(fields=["monitor", "checked_at"])]

    def __str__(self):
        return f"{self.monitor_id} {self.status} {self.checked_at}"
