import time
import secrets
import string
from jose import jwt, JWTError
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
import requests

User = get_user_model()


def generate_unique_referral_code(max_attempts=10):
    alphabet = string.ascii_uppercase + string.digits
    for _ in range(max_attempts):
        code = ''.join(secrets.choice(alphabet) for _ in range(8))
        if not User.objects.filter(referral_code=code).exists():
            return code
    
    timestamp_part = str(int(time.time()))[-4:]
    random_part = ''.join(secrets.choice(string.ascii_uppercase) for _ in range(4))
    fallback = (timestamp_part + random_part)[-8:]
    return fallback


class FirebaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        try:
            resp = requests.get(
                'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
                timeout=10
            )
            resp.raise_for_status()
            keys = resp.json()

            header = jwt.get_unverified_header(token)
            kid = header.get('kid')
            if not kid or kid not in keys:
                raise AuthenticationFailed('Invalid token key ID')

            public_key = keys[kid]

            decoded_token = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                audience=settings.FIREBASE_PROJECT_ID,
                issuer=f'https://securetoken.google.com/{settings.FIREBASE_PROJECT_ID}'
            )

            if decoded_token['exp'] < time.time():
                raise AuthenticationFailed('Token expired')

            uid = decoded_token['sub']
            email = decoded_token.get('email')
            name = decoded_token.get('name', '')

            if not email:
                raise AuthenticationFailed('Email missing in token')

            name_parts = name.split(' ') if name else []
            first_name = name_parts[0] if name_parts else ''
            last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'firebase_uid': uid,
                    'first_name': first_name,
                    'last_name': last_name,
                    'referral_code': generate_unique_referral_code(),
                    'is_onboarded': False,
                    'is_active': False,
                }
            )

            if not created:
                if user.firebase_uid != uid:
                    raise AuthenticationFailed('Firebase UID mismatch')
                updated = False
                if first_name and user.first_name != first_name:
                    user.first_name = first_name
                    updated = True
                if last_name and user.last_name != last_name:
                    user.last_name = last_name
                    updated = True
                if updated:
                    user.save(update_fields=['first_name', 'last_name'])

            return (user, None)

        except (JWTError, KeyError, ValueError) as e:
            raise AuthenticationFailed(f'Invalid token: {str(e)}')
        except requests.RequestException as e:
            raise AuthenticationFailed(f'Failed to verify token: {str(e)}')