from django.contrib import admin
from .models import Project, StatusPage

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner", "created_at")
    search_fields = ("name", "owner__email")

@admin.register(StatusPage)
class StatusPageAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "slug", "is_public")
    list_filter = ("is_public",)
