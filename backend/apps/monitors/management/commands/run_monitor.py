from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.monitors.models import Monitor
from apps.monitors.services import perform_http_check
from apps.incidents.services import record_monitor_check

class Command(BaseCommand):
    help = "Run health checks for monitors whose next_check_at is due. Schedule this command with cron."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=settings.MONITOR_BATCH_SIZE)

    def handle(self, *args, **options):
        now = timezone.now()
        limit = max(1, options["limit"])
        # Row locks plus a lease stop two overlapping cron invocations from
        # claiming the same monitor. PostgreSQL supports skip_locked.
        with transaction.atomic():
            due = list(
                Monitor.objects.select_for_update(skip_locked=True)
                .filter(is_active=True, next_check_at__lte=now)
                .filter(Q(lease_until__isnull=True) | Q(lease_until__lt=now))
                .order_by("next_check_at")[:limit]
            )
            for monitor in due:
                monitor.lease_until = now + timedelta(seconds=monitor.timeout + 45)
                monitor.save(update_fields=["lease_until", "updated_at"])

        self.stdout.write(f"Claimed {len(due)} monitor(s).")
        for monitor in due:
            try:
                result = perform_http_check(monitor)
                record_monitor_check(monitor.id, result)
                self.stdout.write(f"{monitor.id}: {result['status']} ({result.get('response_time_ms')} ms)")
            except Exception as exc:
                # Clear the lease and retry on the next scheduler tick.
                Monitor.objects.filter(pk=monitor.id).update(lease_until=None, next_check_at=timezone.now())
                self.stderr.write(self.style.ERROR(f"Monitor {monitor.id} failed unexpectedly: {exc}"))
