from django.contrib import admin
from .models import Monitor, MonitorCheck

@admin.register(Monitor)
class MonitorAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "url", "status", "is_active", "next_check_at")
    list_filter = ("status", "is_active", "check_interval")
    search_fields = ("name", "url", "project__name")

@admin.register(MonitorCheck)
class MonitorCheckAdmin(admin.ModelAdmin):
    list_display = ("monitor", "status", "status_code", "response_time_ms", "checked_at")
    list_filter = ("status",)
