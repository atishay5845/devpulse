from rest_framework.routers import SimpleRouter
from .views import ProjectViewSet, StatusPageViewSet

router = SimpleRouter()
router.register("projects", ProjectViewSet, basename="project")
router.register("status-pages", StatusPageViewSet, basename="status-page")
urlpatterns = router.urls
