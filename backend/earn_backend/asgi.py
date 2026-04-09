# earn_backend/asgi.py
import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "earn_backend.settings")
django.setup()

from django.core.asgi import get_asgi_application
from support.middleware import FirebaseTokenAuthMiddleware
import support.routing

application = ProtocolTypeRouter({
    "HTTP": get_asgi_application(),
    "websocket": FirebaseTokenAuthMiddleware(
        URLRouter(support.routing.websocket_urlpatterns)
    ),
})
