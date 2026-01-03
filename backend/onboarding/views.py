# backend/onboarding/views.py
import secrets
import string
from django.db import transaction
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from users.models import User
from referrals.models import ReferralTransaction
from .models import OnboardingStep

# 🔥 Firebase token verification helper
from jose import jwt
import requests
from django.conf import settings
import time

def verify_firebase_token(token):
    """Verify Firebase ID token and return email and firebase_uid"""
    try:
        resp = requests.get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')
        keys = resp.json()
        header = jwt.get_unverified_header(token)
        public_key = keys[header['kid']]
        decoded_token = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=settings.FIREBASE_PROJECT_ID,
            issuer=f'https://securetoken.google.com/{settings.FIREBASE_PROJECT_ID}'
        )
        if decoded_token['exp'] < time.time():
            raise ValidationError('Token expired')
        return decoded_token['email'], decoded_token['sub']
    except Exception as e:
        raise ValidationError(f'Invalid token: {str(e)}')


class ProfileCompletionView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authentication required'}, status=401)
        
        token = auth_header.split(' ')[1]
        try:
            email, firebase_uid = verify_firebase_token(token)
        except ValidationError as e:
            return Response({'error': str(e)}, status=401)

        try:
            user = User.objects.get(email=email, firebase_uid=firebase_uid)
        except User.DoesNotExist:
            return Response({'error': 'User not found. Complete authentication first.'}, status=404)

        if user.is_onboarded:
            return Response({'error': 'User already onboarded'}, status=400)

        data = request.data

        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        phone_number = data.get('phone_number', '').strip()
        street = data.get('street', '').strip()
        house_number = data.get('house_number', '').strip()
        zip_code = data.get('zip_code', '').strip()
        town = data.get('town', '').strip()
        skills = data.get('skills', [])
        referral_code_input = data.get('referral_code', '').strip()

        if not first_name or not last_name:
            return Response({'error': 'First name and last name are required'}, status=400)
        if not phone_number:
            return Response({'error': 'Phone number is required'}, status=400)
        if not street or not house_number or not zip_code or not town:
            return Response({'error': 'Complete address is required'}, status=400)
        if not isinstance(skills, list) or not all(isinstance(s, str) for s in skills):
            return Response({'error': 'Skills must be a list of strings'}, status=400)

        try:
            validate_email(email)
        except ValidationError:
            return Response({'error': 'Invalid email'}, status=400)

        referred_by_user = None
        if referral_code_input:
            if len(referral_code_input) != 8:
                return Response({'error': 'Invalid referral code format'}, status=400)
            if user.referral_code == referral_code_input:
                return Response({'error': 'Cannot refer yourself'}, status=400)
            try:
                referred_by_user = User.objects.get(
                    referral_code=referral_code_input,
                    is_active=True
                )
            except User.DoesNotExist:
                return Response({'error': 'Invalid or inactive referral code'}, status=400)

        with transaction.atomic():
            user.first_name = first_name
            user.last_name = last_name
            user.phone_number = phone_number
            user.street = street
            user.house_number = house_number
            user.zip_code = zip_code
            user.town = town
            user.skills = skills
            
            if referred_by_user:
                user.referred_by = referred_by_user

            user.save()

            if referred_by_user:
                ReferralTransaction.objects.get_or_create(
                    referrer=referred_by_user,
                    referred_user=user,
                    defaults={'status': 'pending'}
                )

            step, created = OnboardingStep.objects.get_or_create(user=user)
            step.profile_completed = True
            step.save()

        return Response({
            'message': 'Profile completed successfully',
            'referral_code': user.referral_code
        })


class PaymentDetailsView(APIView):
    authentication_classes = []
    permission_classes = []

    def _get_user_from_token(self, request):
        """Helper to get user from Firebase token"""
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise ValidationError('Authentication required')
        
        token = auth_header.split(' ')[1]
        try:
            email, firebase_uid = verify_firebase_token(token)
            user = User.objects.get(email=email, firebase_uid=firebase_uid)
            return user
        except (ValidationError, User.DoesNotExist):
            raise ValidationError('Invalid token or user not found')

    def _validate_and_save(self, user, data):
        """Shared logic to validate and save payment details"""
        payout_method = data.get('payout_method')

        if payout_method not in ['mobile', 'bank']:
            raise ValidationError('Invalid payout method')

        # Clear both methods to ensure clean state
        user.payout_method = payout_method
        user.payout_phone = ''
        user.payout_bank_name = ''
        user.payout_bank_branch = ''
        user.payout_account_number = ''

        if payout_method == 'mobile':
            phone = data.get('phone_number', '').strip()
            if not phone:
                raise ValidationError('Phone number required for mobile payout')
            user.payout_phone = phone
        elif payout_method == 'bank':
            bank_name = data.get('bank_name', '').strip()
            bank_branch = data.get('bank_branch', '').strip()
            account_number = data.get('account_number', '').strip()
            if not bank_name or not bank_branch or not account_number:
                raise ValidationError('Bank details incomplete')
            user.payout_bank_name = bank_name
            user.payout_bank_branch = bank_branch
            user.payout_account_number = account_number

        user.save()
        return user

    def post(self, request):
        """For initial onboarding payment setup"""
        try:
            user = self._get_user_from_token(request)
        except ValidationError as e:
            return Response({'error': str(e)}, status=401)

        if user.is_onboarded:
            return Response({'error': 'User already onboarded'}, status=400)

        step, created = OnboardingStep.objects.get_or_create(user=user)
        if not step.profile_completed:
            return Response({'error': 'Complete profile first'}, status=400)

        try:
            self._validate_and_save(user, request.data)
        except ValidationError as e:
            return Response({'error': str(e)}, status=400)

        step.payment_completed = True
        step.save()

        if step.is_complete():
            user.is_onboarded = True
            user.save()

        return Response({'message': 'Payment details saved successfully'})

    def patch(self, request):
        """For editing payment details after onboarding"""
        try:
            user = self._get_user_from_token(request)
        except ValidationError as e:
            return Response({'error': str(e)}, status=401)

        try:
            self._validate_and_save(user, request.data)
        except ValidationError as e:
            return Response({'error': str(e)}, status=400)

        return Response({'message': 'Payment details updated successfully'})


class OnboardingStatusView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authentication required'}, status=401)
        
        token = auth_header.split(' ')[1]
        try:
            email, firebase_uid = verify_firebase_token(token)
            user = User.objects.get(email=email, firebase_uid=firebase_uid)
        except (ValidationError, User.DoesNotExist):
            return Response({'error': 'Invalid token or user not found'}, status=401)

        try:
            step = user.onboarding_step
            status = {
                'profile_completed': step.profile_completed,
                'payment_completed': step.payment_completed,
                'onboarding_complete': step.is_complete()
            }
        except OnboardingStep.DoesNotExist:
            status = {
                'profile_completed': False,
                'payment_completed': False,
                'onboarding_complete': False
            }
        return Response(status)