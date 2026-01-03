from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ReferralTransaction

class ReferralTransactionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = ReferralTransaction.objects.filter(referrer=request.user).order_by('-created_at')
        data = []
        for t in transactions:
            data.append({
                'referred_user_email': t.referred_user.email,
                'amount': float(t.amount),
                'status': t.status,
                'created_at': t.created_at.isoformat(),
                'completed_at': t.completed_at.isoformat() if t.completed_at else None
            })
        return Response(data)