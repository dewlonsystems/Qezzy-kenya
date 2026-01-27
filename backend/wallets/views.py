# wallets/views.py

from decimal import Decimal
from datetime import datetime, timezone
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils.dateparse import parse_date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from weasyprint import HTML
from weasyprint.text.fonts import FontConfiguration
from .models import WalletTransaction


class WalletOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        main_tx = WalletTransaction.objects.filter(user=user, wallet_type='main').order_by('-created_at').first()
        main_balance = main_tx.running_balance if main_tx else Decimal('0.00')

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
        wallet_type = request.query_params.get('wallet', 'main')

        if wallet_type not in ['main', 'referral']:
            return Response({'error': 'Invalid wallet type'}, status=400)

        transactions = WalletTransaction.objects.filter(
            user=user,
            wallet_type=wallet_type
        ).order_by('-created_at')[:100]

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


class WalletStatementPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        wallet_type = request.query_params.get('wallet', 'main')
        if wallet_type not in ['main', 'referral']:
            return Response({'error': 'Invalid wallet type'}, status=400)

        start_date_str = request.query_params.get('start_date')  # YYYY-MM-DD
        end_date_str = request.query_params.get('end_date')      # YYYY-MM-DD

        transactions_qs = WalletTransaction.objects.filter(
            user=user,
            wallet_type=wallet_type,
            status='completed'
        ).order_by('created_at')

        # Parse and filter by date range
        start_date = parse_date(start_date_str) if start_date_str else None
        end_date = parse_date(end_date_str) if end_date_str else None

        if start_date:
            transactions_qs = transactions_qs.filter(created_at__date__gte=start_date)
        if end_date:
            transactions_qs = transactions_qs.filter(created_at__date__lte=end_date)

        transactions = list(transactions_qs)

        if transactions:
            first_tx = transactions[0]
            prior_tx = WalletTransaction.objects.filter(
                user=user,
                wallet_type=wallet_type,
                status='completed',
                created_at__lt=first_tx.created_at
            ).order_by('-created_at', '-id').first()

            opening_balance = prior_tx.running_balance if prior_tx else Decimal('0.00')
            closing_balance = transactions[-1].running_balance
        else:
            opening_balance = Decimal('0.00')
            closing_balance = Decimal('0.00')

        # Format user's full name
        first_name = getattr(user, 'first_name', '') or ''
        last_name = getattr(user, 'last_name', '') or ''
        user_full_name = f"{first_name} {last_name}".strip()
        if not user_full_name:
            user_full_name = user.email

        # Format display dates
        now_utc = datetime.now(timezone.utc)
        statement_date = now_utc.strftime("%d %b %Y")  # e.g., "27 Jan 2026"

        start_date_display = start_date.strftime("%d %b %Y") if start_date else None
        end_date_display = end_date.strftime("%d %b %Y") if end_date else None

        # Render HTML template
        html_string = render_to_string('wallet/statement.html', {
            'user': user,
            'user_full_name': user_full_name,
            'wallet_type': wallet_type,
            'opening_balance': opening_balance,
            'closing_balance': closing_balance,
            'transactions': transactions,
            'statement_date': statement_date,
            'start_date_display': start_date_display,
            'end_date_display': end_date_display,
        })

        # Generate PDF with metadata and font support
        font_config = FontConfiguration()
        html = HTML(string=html_string)
        pdf_file = html.write_pdf(
            stylesheets=[],  # Add CSS files here if needed, e.g. [CSS(settings.STATICFILES_DIRS[0] + '/css/statement.css')]
            font_config=font_config,
            presentational_hints=True,
            metadata={
                'title': f'Qezzy {wallet_type.title()} Wallet Statement',
                'author': 'Qezzy Kenya',
                'subject': f'Account statement for {user_full_name}',
                'keywords': 'qezzy,kenya,statement,wallet,finance',
                'creator': 'Qezzy Backend System',
                'producer': 'WeasyPrint + Django',
            }
        )

        # Prepare HTTP response
        filename = f"Qezzy_{wallet_type}_statement_{now_utc.strftime('%Y%m%d')}.pdf"
        response = HttpResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response