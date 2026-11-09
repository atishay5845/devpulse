from rest_framework import serializers
from core.security import validate_discord_webhook
from apps.projects.models import Project
from .models import NotificationChannel, NotificationLog

class NotificationChannelSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())

    class Meta:
        model = NotificationChannel
        fields = ("id", "project", "channel_type", "target", "is_active", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_project(self, project):
        request = self.context.get("request")
        if request and project.owner_id != request.user.id:
            raise serializers.ValidationError("You do not own this project.")
        return project

    def validate(self, attrs):
        channel_type = attrs.get("channel_type", getattr(self.instance, "channel_type", None))
        target = attrs.get("target", getattr(self.instance, "target", ""))
        if channel_type == NotificationChannel.ChannelType.EMAIL:
            try:
                serializers.EmailField().run_validation(target)
            except serializers.ValidationError:
                raise serializers.ValidationError({"target": "Enter a valid email address."})
        elif channel_type == NotificationChannel.ChannelType.DISCORD:
            try:
                attrs["target"] = validate_discord_webhook(target)
            except ValueError as exc:
                raise serializers.ValidationError({"target": str(exc)}) from exc
        return attrs

class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = ("id", "event_type", "success", "response_message", "sent_at")
