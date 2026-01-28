# users/utils.py
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

def send_welcome_email(user):
    """
    Send a welcome email using an HTML template.
    """
    subject = "Welcome to Qezzy!"
    context = {
        'first_name': user.first_name.title(),
    }
    
    html_content = render_to_string('emails/welcome_email.html', context)
    text_content = strip_tags(html_content)  # Fallback for plain-text clients

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email]
    )
    msg.attach_alternative(html_content, "text/html")
    
    try:
        msg.send()
    except Exception as e:
        # In production, use logging instead of print
        print(f"Failed to send welcome email to {user.email}: {e}")

def send_welcome_aboard_email(user):
    """
    Send 'Welcome Aboard' email after successful activation.
    """
    subject = "Welcome Aboard! Your Qezzy Account Is Active"
    context = {
        'first_name': user.first_name.title(),
    }
    
    html_content = render_to_string('emails/welcome_aboard.html', context)
    text_content = strip_tags(html_content)

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email]
    )
    msg.attach_alternative(html_content, "text/html")
    
    try:
        msg.send()
    except Exception as e:
        print(f"Failed to send welcome aboard email to {user.email}: {e}")

def send_withdrawal_completed_email(user, amount, method, destination, processed_at):
    from django.core.mail import EmailMultiAlternatives
    from django.template.loader import render_to_string
    from django.utils.html import strip_tags
    from django.conf import settings

    # Determine display values
    is_mobile = (method == 'mobile')
    method_display = 'M-Pesa' if is_mobile else 'Bank Transfer'

    subject = f"Withdrawal of KES {amount:.2f} Processed – Qezzy Kenya"
    context = {
        'first_name': user.first_name.title(),
        'amount': f"{amount:.2f}",
        'method_display': method_display,
        'destination': destination,
        'processed_at': processed_at.strftime("%d %b %Y at %H:%M"),
        'is_mobile': is_mobile,
    }

    html_content = render_to_string('emails/withdrawal_completed.html', context)
    text_content = strip_tags(html_content)

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email]
    )
    msg.attach_alternative(html_content, "text/html")

    try:
        msg.send()
    except Exception as e:
        print(f"Failed to send withdrawal email to {user.email}: {e}")

# users/utils.py — ADD THIS

from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from wallets.utils import generate_statement_pdf
from datetime import datetime

def send_statement_email(user, wallet_type='main', start_date=None, end_date=None):
    """
    Generate a PDF statement and email it as an attachment.
    """
    try:
        # Generate PDF
        pdf_buffer = generate_statement_pdf(user, wallet_type, start_date, end_date)
        
        # Filename
        date_str = datetime.now().strftime("%Y%m%d")
        filename = f"Qezzy_{wallet_type}_Statement_{date_str}.pdf"

        # Email body
        subject = f"Your Qezzy {wallet_type.title()} Wallet Statement"
        body = (
            f"Hi {user.first_name.title()},\n\n"
            "Attached is your account statement from Qezzy Kenya.\n\n"
            "Thank you for using our platform!\n\n"
            "— The Qezzy Team"
        )

        # Create and send email
        msg = EmailMultiAlternatives(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        msg.attach(filename, pdf_buffer.getvalue(), 'application/pdf')
        msg.send()

    except Exception as e:
        print(f"Failed to send statement email to {user.email}: {e}")