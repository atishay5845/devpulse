from rest_framework import serializers
from core.security import validate_public_http_url
from apps.projects.models import Project
from .models import Monitor, MonitorCheck

class MonitorSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())

    class Meta:
        model = Monitor
        fields = (
            "id", "project", "name", "url", "check_interval", "timeout",
            "expected_status_code", "expected_keyword", "is_active", "status",
            "consecutive_failures", "last_checked_at", "next_check_at", "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "status", "consecutive_failures", "last_checked_at",
            "next_check_at", "created_at", "updated_at",
        )

    def validate_project(self, project):
        request = self.context.get("request")
        if request and project.owner_id != request.user.id:
            raise serializers.ValidationError("You do not own this project.")
        return project

    def validate_url(self, value):
        try:
            return validate_public_http_url(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc

    def validate_timeout(self, value):
        if value < 2 or value > 30:
            raise serializers.ValidationError("Timeout must be between 2 and 30 seconds.")
        return value

    def validate_expected_status_code(self, value):
        if value < 100 or value > 599:
            raise serializers.ValidationError("Enter a valid HTTP status code.")
        return value

class MonitorCheckSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonitorCheck
        fields = ("id", "status", "status_code", "response_time_ms", "error_message", "checked_at")
