from rest_framework.routers import SimpleRouter
from .views import NotificationChannelViewSet, NotificationLogViewSet

router = SimpleRouter()
router.register("notification-channels", NotificationChannelViewSet, basename="notification-channel")
router.register("notification-logs", NotificationLogViewSet, basename="notification-log")
urlpatterns = router.urls
