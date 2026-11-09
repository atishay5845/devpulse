from django.contrib import admin
from .models import Incident, IncidentEvent

class IncidentEventInline(admin.TabularInline):
    model = IncidentEvent
    extra = 0

@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "monitor", "status", "started_at", "resolved_at")
    list_filter = ("status",)
    inlines = [IncidentEventInline]
