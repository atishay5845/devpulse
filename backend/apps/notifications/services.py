import requests
from django.conf import settings
from django.core.mail import send_mail

from core.security import validate_discord_webhook
from apps.incidents.models import Incident
from .models import NotificationChannel, NotificationLog


def send_incident_notifications(incident_id: int, event_type: str) -> None:
    """Send configured project notifications synchronously and record every attempt."""
    try:
        incident = Incident.objects.select_related("monitor", "monitor__project").get(pk=incident_id)
    except Incident.DoesNotExist:
        return

    project = incident.monitor.project
    monitor = incident.monitor
    is_recovery = event_type == "RECOVERED"
    subject = f"[DevPulse] {'Recovered' if is_recovery else 'Service down'}: {monitor.name}"
    message = (
        f"Project: {project.name}\nMonitor: {monitor.name}\nURL: {monitor.url}\n"
        f"Event: {event_type}\nIncident ID: {incident.id}\nStatus: {incident.status}"
    )

    for channel in NotificationChannel.objects.filter(project=project, is_active=True):
        success = False
        response_message = ""
        try:
            if channel.channel_type == NotificationChannel.ChannelType.EMAIL:
                sent_count = send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[channel.target],
                    fail_silently=False,
                )
                success = sent_count == 1
                response_message = "Email accepted by configured email backend." if success else "Email backend did not send a message."
            elif channel.channel_type == NotificationChannel.ChannelType.DISCORD:
                webhook = validate_discord_webhook(channel.target)
                response = requests.post(
                    webhook,
                    json={"content": f"**{subject}**\n{message}"[:1900]},
                    timeout=5,
                    allow_redirects=False,
                )
                success = 200 <= response.status_code < 300
                response_message = f"Discord returned HTTP {response.status_code}."
        except Exception as exc:  # A notification failure must not break monitoring.
            response_message = str(exc)[:500]

        NotificationLog.objects.create(
            channel=channel,
            incident=incident,
            event_type=event_type,
            success=success,
            response_message=response_message,
        )
