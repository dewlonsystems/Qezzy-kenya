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