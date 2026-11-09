from rest_framework import permissions, viewsets
from .models import Project, StatusPage
from .serializers import ProjectSerializer, StatusPageSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class StatusPageViewSet(viewsets.ModelViewSet):
    serializer_class = StatusPageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StatusPage.objects.filter(project__owner=self.request.user).select_related("project")
