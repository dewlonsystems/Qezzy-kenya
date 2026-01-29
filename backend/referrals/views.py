# referrals/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import ReferralTransaction

class ReferralTransactionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):        
        transactions = ReferralTransaction.objects.filter(
            referrer=request.user
        ).select_related('referred_user').order_by('-created_at')
        
        data = []
        for t in transactions:            
            try:
                referred = t.referred_user
                if referred is None:
                    continue
            except Exception:
                continue
            data.append({
                'referred_user_email': referred.email,
                'amount': float(t.amount),
                'status': t.status,
                'created_at': t.created_at.isoformat(),
                'completed_at': t.completed_at.isoformat() if t.completed_at else None,                
                'referred_user_is_active': referred.is_active,
                'referred_user_is_onboarded': referred.is_onboarded,
                'referred_user_is_closed': referred.is_closed,
            })
        return Response(data)