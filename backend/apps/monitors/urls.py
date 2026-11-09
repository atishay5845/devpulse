from rest_framework.routers import SimpleRouter
from .views import MonitorViewSet

router = SimpleRouter()
router.register("monitors", MonitorViewSet, basename="monitor")
urlpatterns = router.urls
