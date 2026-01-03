from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from .models import User

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_closed:
            return Response({'error': 'Account closed'}, status=403)
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
        }
        return Response(data)


class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user

        if user.is_closed:
            return Response({'error': 'Account closed'}, status=403)

        data = request.data

        # Only allow editing: phone_number, address fields, skills
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
        immutable = ['first_name', 'last_name', 'email', 'referral_code']
        for field in immutable:
            if field in data:
                return Response({'error': f'Field "{field}" cannot be changed'}, status=400)

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