# earn_backend/asgi.py
import os
import django
from channels.routing import ProtocolTypeRouter

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "earn_backend.settings")
django.setup()

# 👇 Import ONLY AFTER django.setup()
from django.core.asgi import get_asgi_application
from support.middleware import FirebaseTokenAuthMiddlewareStack
import support.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": FirebaseTokenAuthMiddlewareStack(
        support.routing.websocket_urlpatterns
    ),
})