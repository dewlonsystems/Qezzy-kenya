# support/middleware.py
import urllib.parse
from asgiref.sync import sync_to_async
from django.db import close_old_connections

# ❌ DO NOT call get_user_model() at module level
# User = get_user_model()  # ← REMOVE THIS

@sync_to_async
def get_user_from_firebase_token(token):
    from django.contrib.auth import get_user_model  # ✅ Import inside function
    from users.authentication import FirebaseAuthentication
    from django.http import HttpRequest
    try:
        fake_request = HttpRequest()
        fake_request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
        user_auth_tuple = FirebaseAuthentication().authenticate(fake_request)
        if user_auth_tuple is None:
            return None
        User = get_user_model()  # ✅ Safe: Django is initialized by now
        user, _ = user_auth_tuple
        if user and not getattr(user, 'is_closed', False):
            return user
        return None
    except Exception:
        return None

class FirebaseTokenAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        close_old_connections()

        query_string = scope["query_string"].decode()
        params = urllib.parse.parse_qs(query_string)
        token = params.get("token", [None])[0]

        if token:
            scope["user"] = await get_user_from_firebase_token(token)
        else:
            scope["user"] = None

        return await self.inner(scope, receive, send)

def FirebaseTokenAuthMiddlewareStack(inner):
    return FirebaseTokenAuthMiddleware(inner)