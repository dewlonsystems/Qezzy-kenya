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

# users/utils.py — inside send_statement_email

def send_statement_email(user, wallet_type='main', start_date=None, end_date=None):
    try:
        # 🔑 GENERATE PASSWORD: First 2 of last name (uppercase) + last 4 of phone
        last_name = (getattr(user, 'last_name', '') or '').strip()
        phone = (getattr(user, 'phone_number', '') or '').strip()

        if not last_name or len(last_name) < 2:
            # Fallback: use first 2 of email prefix
            email_prefix = user.email.split('@')[0] if '@' in user.email else user.email
            last_name_part = email_prefix[:2].upper()
        else:
            last_name_part = last_name[:2].upper()

        if not phone or len(phone) < 4:
            raise ValueError("User must have a valid phone number for statement password")

        # Normalize phone: remove non-digits, ensure it ends with digits
        digits_only = ''.join(filter(str.isdigit, phone))
        if len(digits_only) < 4:
            raise ValueError("Phone number must contain at least 4 digits")

        phone_part = digits_only[-4:]
        password = f"{last_name_part}{phone_part}"  # e.g., MU5678

        # Generate ENCRYPTED PDF
        pdf_buffer = generate_statement_pdf(
            user=user,
            wallet_type=wallet_type,
            start_date=start_date,
            end_date=end_date,
            password=password  # 👈 PASS PASSWORD HERE
        )

        # Filename
        date_str = datetime.now().strftime("%Y%m%d")
        filename = f"Qezzy_{wallet_type}_Statement_{date_str}.pdf"

        # Email body (now includes password instructions!)
        subject = f"Your Qezzy {wallet_type.title()} Wallet Statement"
        
        plain_body = (
            f"Hi {user.first_name.title()},\n\n"
            "Your account statement is attached as a password-protected PDF.\n\n"
            f"Password: {password}\n"
            "(First 2 letters of your last name + last 4 digits of your phone number)\n\n"
            "Thank you for using Qezzy!\n\n"
            "— The Qezzy Team"
        )

        html_body = f"""
        <div style="font-family: Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); border-top: 4px solid #d4a017;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="font-weight: bold; font-size: 28px; color: #8B5E00; letter-spacing: -0.5px;">Qezzy Kenya</div>
              <h1 style="color: #8B5E00; font-size: 22px;">Your Account Statement</h1>
            </div>
            
            <p>Hi {user.first_name.title()},</p>
            
            <p>Your {wallet_type} wallet statement is attached as a <strong>password-protected PDF</strong>.</p>

            <div style="background-color: #fdf9f0; border: 1px solid #f0e0c0; border-radius: 6px; padding: 16px; margin: 20px 0; text-align: center;">
              <div style="font-size: 18px; font-weight: bold; color: #8B5E00; margin-bottom: 8px;">PDF Password</div>
              <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #c62828;">{password}</div>
              <div style="color: #666; font-size: 14px; margin-top: 8px;">
                (First 2 letters of your last name + last 4 digits of your phone number)
              </div>
            </div>

            <p>This ensures only you can access your financial details.</p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
              © {datetime.now().year} Qezzy Kenya. All rights reserved.<br>
              Nairobi, Kenya | www.qezzykenya.company
            </div>
          </div>
        </div>
        """

        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        msg.attach_alternative(html_body, "text/html")
        msg.attach(filename, pdf_buffer.getvalue(), 'application/pdf')
        msg.send()

    except Exception as e:
        print(f"Failed to send statement email to {user.email}: {e}")