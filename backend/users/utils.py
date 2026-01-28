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