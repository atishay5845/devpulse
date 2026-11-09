from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from apps.projects.models import Project
from apps.monitors.models import Monitor
from apps.incidents.models import Incident
from apps.incidents.services import record_monitor_check

User = get_user_model()

class IncidentLifecycleTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="ComplexPass123!")
        self.project = Project.objects.create(owner=self.user, name="Test Project")
        self.monitor = Monitor.objects.create(
            project=self.project,
            name="Test Monitor",
            url="https://example.com",
            check_interval=60,
            next_check_at=timezone.now(),
        )

    def test_incident_opens_after_consecutive_failures_and_resolves_after_recovery(self):
        failed = {"status": "DOWN", "status_code": 502, "response_time_ms": 120.0, "error_message": "Bad Gateway"}
        success = {"status": "UP", "status_code": 200, "response_time_ms": 80.0, "error_message": ""}

        record_monitor_check(self.monitor.id, failed)
        self.assertEqual(Incident.objects.count(), 0)

        record_monitor_check(self.monitor.id, failed)
        incident = Incident.objects.get(monitor=self.monitor)
        self.assertEqual(incident.status, Incident.Status.OPEN)
        self.monitor.refresh_from_db()
        self.assertEqual(self.monitor.status, Monitor.Status.DOWN)

        record_monitor_check(self.monitor.id, success)
        incident.refresh_from_db()
        self.assertEqual(incident.status, Incident.Status.OPEN)

        record_monitor_check(self.monitor.id, success)
        incident.refresh_from_db()
        self.assertEqual(incident.status, Incident.Status.RESOLVED)
        self.monitor.refresh_from_db()
        self.assertEqual(self.monitor.status, Monitor.Status.UP)
