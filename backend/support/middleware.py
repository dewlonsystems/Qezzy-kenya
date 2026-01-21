# support/middleware.py
import urllib.parse
from django.contrib.auth import get_user_model
from django.db import close_old_connections
from channels.db import database_sync_to_sync
from users.authentication import FirebaseAuthentication

User = get_user_model()

@database_sync_to_sync
def get_user_from_firebase_token(token):
    try:
        firebase_auth = FirebaseAuthentication()
        # Mimic the token validation from the REST flow
        # Fetch public keys and decode
        resp = firebase_auth._get_public_keys()
        keys = resp.json()

        from jose import jwt
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')
        if not kid or kid not in keys:
            return None

        public_key = keys[kid]
        decoded_token = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=firebase_auth._get_audience(),
            issuer=firebase_auth._get_issuer()
        )

        if decoded_token['exp'] < time.time():
            return None

        uid = decoded_token['sub']
        email = decoded_token.get('email')
        if not email:
            return None

        user = User.objects.get(email=email)
        if user.firebase_uid != uid:
            return None
        if user.is_closed:
            return None
        return user
    except Exception:
        return None

# Extract helper methods from FirebaseAuthentication to avoid duplication
import time
import requests

def _get_public_keys():
    return requests.get(
        'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
        timeout=10
    )

def _get_audience():
    from django.conf import settings
    return settings.FIREBASE_PROJECT_ID

def _get_issuer():
    from django.conf import settings
    return f'https://securetoken.google.com/{settings.FIREBASE_PROJECT_ID}'

# Patch FirebaseAuthentication to expose helpers (only for this middleware)
FirebaseAuthentication._get_public_keys = staticmethod(_get_public_keys)
FirebaseAuthentication._get_audience = staticmethod(_get_audience)
FirebaseAuthentication._get_issuer = staticmethod(_get_issuer)

class FirebaseTokenAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        close_old_connections()

        # Extract token from query string: ?token=xxxx
        query_string = scope["query_string"].decode()
        params = urllib.parse.parse_qs(query_string)
        token_list = params.get("token", [])
        token = token_list[0] if token_list else None

        if token:
            scope["user"] = await get_user_from_firebase_token(token)
        else:
            scope["user"] = None

        return await self.inner(scope, receive, send)

def FirebaseTokenAuthMiddlewareStack(inner):
    return FirebaseTokenAuthMiddleware(inner)