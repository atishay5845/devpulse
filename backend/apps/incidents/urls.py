from rest_framework.routers import SimpleRouter
from .views import IncidentViewSet

router = SimpleRouter()
router.register("incidents", IncidentViewSet, basename="incident")
urlpatterns = router.urls
