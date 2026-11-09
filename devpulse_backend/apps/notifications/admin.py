from django.contrib import admin
from .models import NotificationChannel, NotificationLog

@admin.register(NotificationChannel)
class NotificationChannelAdmin(admin.ModelAdmin):
    list_display = ("project", "channel_type", "target", "is_active")
    list_filter = ("channel_type", "is_active")

@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ("id", "event_type", "success", "sent_at")
    list_filter = ("event_type", "success")
