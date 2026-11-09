from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.monitors.models import Monitor, MonitorCheck
from .models import Incident, IncidentEvent


def record_monitor_check(monitor_id: int, result: dict):
    """Persist a check and apply consecutive-failure/recovery incident rules."""
    notification_jobs = []
    with transaction.atomic():
        try:
            monitor = Monitor.objects.select_for_update().select_related("project").get(pk=monitor_id)
        except Monitor.DoesNotExist:
            return None

        if not monitor.is_active:
            monitor.lease_until = None
            monitor.save(update_fields=["lease_until", "updated_at"])
            return None

        now = timezone.now()
        check = MonitorCheck.objects.create(
            monitor=monitor,
            status=result["status"],
            status_code=result.get("status_code"),
            response_time_ms=result.get("response_time_ms"),
            error_message=result.get("error_message", "")[:500],
            checked_at=now,
        )

        if result["status"] == MonitorCheck.Status.DOWN:
            monitor.consecutive_failures += 1
            monitor.consecutive_successes = 0
            if monitor.consecutive_failures >= settings.MONITOR_FAILURE_THRESHOLD and monitor.status != Monitor.Status.DOWN:
                monitor.status = Monitor.Status.DOWN
                incident = Incident.objects.create(
                    monitor=monitor,
                    title=f"{monitor.name} is down",
                    description=result.get("error_message", "The monitor failed its health check."),
                )
                IncidentEvent.objects.create(
                    incident=incident,
                    event_type=IncidentEvent.EventType.DETECTED,
                    message=f"Incident opened after {monitor.consecutive_failures} consecutive failed checks.",
                )
                notification_jobs.append((incident.id, "DOWN"))
        else:
            monitor.consecutive_successes += 1
            monitor.consecutive_failures = 0
            if monitor.status == Monitor.Status.UNKNOWN:
                monitor.status = Monitor.Status.UP
            elif monitor.status == Monitor.Status.DOWN and monitor.consecutive_successes >= settings.MONITOR_RECOVERY_THRESHOLD:
                monitor.status = Monitor.Status.UP
                incident = Incident.objects.select_for_update().filter(
                    monitor=monitor,
                    status__in=[Incident.Status.OPEN, Incident.Status.ACKNOWLEDGED],
                ).order_by("-started_at").first()
                if incident:
                    incident.status = Incident.Status.RESOLVED
                    incident.resolved_at = now
                    incident.save(update_fields=["status", "resolved_at"])
                    IncidentEvent.objects.create(
                        incident=incident,
                        event_type=IncidentEvent.EventType.RECOVERED,
                        message=f"Service recovered after {monitor.consecutive_successes} consecutive successful checks.",
                    )
                    notification_jobs.append((incident.id, "RECOVERED"))

        monitor.last_checked_at = now
        monitor.next_check_at = now + timedelta(seconds=monitor.check_interval)
        monitor.lease_until = None
        monitor.save(update_fields=[
            "status", "consecutive_failures", "consecutive_successes",
            "last_checked_at", "next_check_at", "lease_until", "updated_at",
        ])

        for incident_id, event_type in notification_jobs:
            transaction.on_commit(
                lambda incident_id=incident_id, event_type=event_type: _send_notification_safely(incident_id, event_type)
            )

        return check


def _send_notification_safely(incident_id, event_type):
    # Import lazily to avoid an incidents <-> notifications import cycle.
    from apps.notifications.services import send_incident_notifications
    send_incident_notifications(incident_id, event_type)
