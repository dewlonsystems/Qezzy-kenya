from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import WalletTransaction

class WalletOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Compute main wallet balance
        main_tx = WalletTransaction.objects.filter(user=user, wallet_type='main').order_by('-created_at').first()
        main_balance = main_tx.running_balance if main_tx else Decimal('0.00')

        # Compute referral wallet balance
        referral_tx = WalletTransaction.objects.filter(user=user, wallet_type='referral').order_by('-created_at').first()
        referral_balance = referral_tx.running_balance if referral_tx else Decimal('0.00')

        return Response({
            'main_wallet_balance': float(main_balance),
            'referral_wallet_balance': float(referral_balance),
        })

class WalletTransactionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        wallet_type = request.query_params.get('wallet', 'main')  # 'main' or 'referral'

        if wallet_type not in ['main', 'referral']:
            return Response({'error': 'Invalid wallet type'}, status=400)

        transactions = WalletTransaction.objects.filter(
            user=user,
            wallet_type=wallet_type
        ).order_by('-created_at')[:100]  # Limit to last 100

        data = []
        for tx in transactions:
            data.append({
                'id': tx.id,
                'wallet_type': tx.wallet_type,
                'transaction_type': tx.transaction_type,
                'amount': float(tx.amount),
                'running_balance': float(tx.running_balance),
                'status': tx.status,
                'description': tx.description,
                'created_at': tx.created_at.isoformat()
            })

        return Response(data)