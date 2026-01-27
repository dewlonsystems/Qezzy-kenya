# users/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from .models import User

# Optional: for better device parsing
try:
    from ua_parser import user_agent_parser
    UA_PARSER_AVAILABLE = True
except ImportError:
    UA_PARSER_AVAILABLE = False
    import re


def get_client_ip(request):
    """Extract real IP from request, handling proxies (Render, AWS, etc.)"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # X-Forwarded-For may contain multiple IPs; first is original client
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '')
    return ip if ip else None


def parse_device_info(user_agent):
    """Return human-readable device info like 'Chrome on Windows' or 'Safari on iPhone'"""
    if not user_agent:
        return "Unknown device"

    if UA_PARSER_AVAILABLE:
        parsed = user_agent_parser.Parse(user_agent)
        os = parsed['os']['family']
        browser = parsed['user_agent']['family']
        device = parsed['device']['family']

        # Prioritize mobile device name if available
        if device and device not in ('Other', 'Generic Smartphone'):
            return f"{browser} on {device}"
        else:
            return f"{browser} on {os}"
    else:
        # Fallback: basic detection
        ua = user_agent.lower()
        if 'iphone' in ua:
            device = 'iPhone'
        elif 'ipad' in ua:
            device = 'iPad'
        elif 'android' in ua:
            device = 'Android'
        elif 'windows' in ua:
            device = 'Windows'
        elif 'mac' in ua:
            device = 'macOS'
        elif 'linux' in ua:
            device = 'Linux'
        else:
            device = 'Unknown OS'

        if 'chrome' in ua:
            browser = 'Chrome'
        elif 'safari' in ua:
            browser = 'Safari'
        elif 'firefox' in ua:
            browser = 'Firefox'
        elif 'edge' in ua:
            browser = 'Edge'
        else:
            browser = 'Browser'

        return f"{browser} on {device}"


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_closed:
            return Response({'error': 'Account closed'}, status=403)

        # ✅ Capture IP and device info on profile view
        ip = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        device = parse_device_info(user_agent)

        # Only save if changed (reduce DB writes)
        if user.last_seen_ip != ip or user.device_info != device:
            user.last_seen_ip = ip
            user.device_info = device
            user.save(update_fields=['last_seen_ip', 'device_info', 'updated_at'])

        data = {
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone_number': user.phone_number,
            'address': {
                'street': user.street,
                'house_number': user.house_number,
                'zip_code': user.zip_code,
                'town': user.town,
            },
            'skills': user.skills,
            'referral_code': user.referral_code,
            'is_onboarded': user.is_onboarded,
            'is_active': user.is_active,
            'is_closed': user.is_closed,
            'payout_method': user.payout_method,
            'payout_phone': user.payout_phone,
            'payout_bank_name': user.payout_bank_name,
            'payout_bank_branch': user.payout_bank_branch,
            'payout_account_number': user.payout_account_number,
            'created_at': user.created_at,
            # 👇 Optionally include in response for debugging
            # 'last_seen_ip': user.last_seen_ip,
            # 'device_info': user.device_info,
        }
        return Response(data)


class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user

        if user.is_closed:
            return Response({'error': 'Account closed'}, status=403)

        data = request.data

        # ✅ Also capture IP/device on profile update
        ip = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        device = parse_device_info(user_agent)

        # Update profile fields
        if 'phone_number' in data:
            user.phone_number = data['phone_number'].strip()

        if 'address' in data:
            addr = data['address']
            user.street = addr.get('street', user.street).strip()
            user.house_number = addr.get('house_number', user.house_number).strip()
            user.zip_code = addr.get('zip_code', user.zip_code).strip()
            user.town = addr.get('town', user.town).strip()

        if 'skills' in data:
            skills = data['skills']
            if not isinstance(skills, list) or not all(isinstance(s, str) for s in skills):
                return Response({'error': 'Skills must be a list of strings'}, status=400)
            user.skills = skills

        # Prevent editing immutable fields
        immutable = ['first_name', 'last_name', 'email', 'referral_code', 'profile_picture_url']
        for field in immutable:
            if field in data:
                return Response({'error': f'Field "{field}" cannot be changed'}, status=400)

        # Always update IP and device
        user.last_seen_ip = ip
        user.device_info = device
        user.save()

        return Response({'message': 'Profile updated successfully'})


class CloseAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.is_closed:
            return Response({'error': 'Account already closed'}, status=400)

        user.close_account()
        return Response({'message': 'Account closed successfully. All data retained.'})