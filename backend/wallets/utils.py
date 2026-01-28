# wallets/utils.py
from decimal import Decimal
from datetime import datetime, timezone
from django.db import transaction as db_transaction
from django.template.loader import render_to_string
from weasyprint import HTML
from weasyprint.text.fonts import FontConfiguration
from io import BytesIO
from .models import WalletTransaction


def create_transaction(user, wallet_type, transaction_type, amount, description='', source='system', status='pending'):
    """
    Create a wallet transaction (pending or completed).
    For debits (withdrawal, activation), ensures sufficient balance.
    """
    amount = Decimal(str(amount))
    if amount <= 0:
        raise ValueError("Amount must be a positive number.")

    with db_transaction.atomic():
        # Lock the latest completed transaction to prevent race conditions
        last_tx = WalletTransaction.objects.filter(
            user=user,
            wallet_type=wallet_type,
            status='completed'
        ).select_for_update().order_by('-created_at', '-id').first()

        current_balance = last_tx.running_balance if last_tx else Decimal('0.00')

        # Enforce balance check for debit transactions
        if transaction_type in ['withdrawal', 'activation_payment']:
            if amount > current_balance:
                raise ValueError("Insufficient balance.")

        # For pending transactions, running_balance remains unchanged
        running_balance = current_balance

        return WalletTransaction.objects.create(
            user=user,
            wallet_type=wallet_type,
            transaction_type=transaction_type,
            source=source,
            amount=amount,
            running_balance=running_balance,
            status=status,
            description=description
        )


def generate_statement_pdf(user, wallet_type='main', start_date=None, end_date=None):
    """
    Generate a branded PDF account statement for the user.
    
    Args:
        user: User instance
        wallet_type: 'main' or 'referral'
        start_date: date object or None
        end_date: date object or None
    
    Returns:
        BytesIO: PDF content as an in-memory byte stream
    """
    from django.utils.dateparse import parse_date

    # Handle string dates if passed
    if isinstance(start_date, str):
        start_date = parse_date(start_date)
    if isinstance(end_date, str):
        end_date = parse_date(end_date)

    # Fetch completed transactions in range
    transactions_qs = WalletTransaction.objects.filter(
        user=user,
        wallet_type=wallet_type,
        status='completed'
    ).order_by('created_at')

    if start_date:
        transactions_qs = transactions_qs.filter(created_at__date__gte=start_date)
    if end_date:
        transactions_qs = transactions_qs.filter(created_at__date__lte=end_date)

    transactions = list(transactions_qs)

    # Calculate opening and closing balances
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

    # Format dates for display
    now_utc = datetime.now(timezone.utc)
    statement_date = now_utc.strftime("%d %b %Y")  # e.g., "28 Jan 2026"
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

    # Generate PDF
    font_config = FontConfiguration()
    pdf_bytes = HTML(string=html_string).write_pdf(
        font_config=font_config,
        presentational_hints=True,
        metadata={
            'title': f'Qezzy {wallet_type.title()} Wallet Statement',
            'author': 'Qezzy Kenya',
            'subject': f'Account statement for {user_full_name}',
            'creator': 'Qezzy Backend System',
        }
    )

    return BytesIO(pdf_bytes)