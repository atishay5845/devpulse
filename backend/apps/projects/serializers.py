from rest_framework import serializers
from .models import Project, StatusPage

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name", "description", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

class StatusPageSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    public_url_path = serializers.SerializerMethodField()

    class Meta:
        model = StatusPage
        fields = ("id", "project", "title", "slug", "is_public", "public_url_path", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at", "public_url_path")

    def get_public_url_path(self, obj):
        return f"/api/public/status/{obj.slug}/"

    def validate_project(self, project):
        request = self.context.get("request")
        if request and project.owner_id != request.user.id:
            raise serializers.ValidationError("You do not own this project.")
        existing = StatusPage.objects.filter(project=project)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("This project already has a status page.")
        return project

    def validate_slug(self, value):
        return value.lower().strip()
