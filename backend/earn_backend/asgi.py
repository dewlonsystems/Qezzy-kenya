# earn_backend/asgi.py
"""
ASGI config for earn_backend project.
"""

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from support.middleware import FirebaseTokenAuthMiddlewareStack
import support.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'earn_backend.settings')

# 👇 ADD THIS: Initialize Django ASGI application early
django.setup()

from django.core.asgi import get_asgi_application

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": FirebaseTokenAuthMiddlewareStack(
        URLRouter(
            support.routing.websocket_urlpatterns
        )
    ),
})