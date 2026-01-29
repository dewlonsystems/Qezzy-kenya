# support/middleware.py
import urllib.parse
from asgiref.sync import sync_to_async
from django.db import close_old_connections

@sync_to_async
def get_user_from_firebase_token(token):
    try:
        from django.contrib.auth import get_user_model
        from users.authentication import FirebaseAuthentication
        from django.http import HttpRequest

        fake_request = HttpRequest()
        fake_request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
        
        result = FirebaseAuthentication().authenticate(fake_request)
        if result is None:
            print("Auth failed: FirebaseAuthentication returned None")
            return None
            
        user, _ = result
        if user and not getattr(user, 'is_closed', False):
            print(f"Auth success: {user.email}")
            return user
        else:
            print("Auth failed: user is closed or invalid")
            return None
            
    except Exception as e:
        print(f"Auth exception: {e}")
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

        # If no user, close connection
        if scope["user"] is None:
            print("No user — closing WebSocket")
            from channels.exceptions import DenyConnection
            raise DenyConnection("Authentication failed")

        return await self.inner(scope, receive, send)

def FirebaseTokenAuthMiddlewareStack(inner):
    return FirebaseTokenAuthMiddleware(inner)