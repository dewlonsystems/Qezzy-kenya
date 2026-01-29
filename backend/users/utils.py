# users/utils.py
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from datetime import datetime


def send_welcome_email(user):
    """
    Sent immediately after onboarding completion.
    Prompts user to activate account with KES 300.
    """
    subject = "Complete Your Qezzy Account Activation"
    context = {
        'first_name': user.first_name.title(),
    }
    
    html_content = render_to_string('emails/welcome_email.html', context)
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
        print(f"Failed to send activation prompt email to {user.email}: {e}")


def send_welcome_aboard_email(user):
    """
    Sent after successful activation payment (account is now active).
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


def send_withdrawal_completed_email(
    user,
    amount,
    method,
    destination,
    processed_at,
    receipt_number=None,
    reference_code=None,
    recipient_name=None
):
    """
    Sent when a withdrawal (mobile or bank) is marked as completed.
    Shows method-specific timing info and includes M-Pesa receipt (if applicable)
    and internal reference code for user records.
    """
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
        # New fields for enhanced transaction transparency
        'receipt_number': receipt_number,
        'reference_code': reference_code,
        'recipient_name': recipient_name or "your account",
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


def send_statement_email(user, wallet_type='main', start_date=None, end_date=None):
    from wallets.utils import generate_statement_pdf
    """
    Generate a password-protected PDF statement and email it as an attachment.
    The password is NOT included in the email — only the logic to derive it.
    """
    try:
        # 🔑 Generate password for PDF encryption (NOT sent in email)
        last_name = (getattr(user, 'last_name', '') or '').strip()
        phone = (getattr(user, 'phone_number', '') or '').strip()

        if not last_name or len(last_name) < 2:
            email_prefix = user.email.split('@')[0] if '@' in user.email else user.email
            last_name_part = email_prefix[:2].upper()
        else:
            last_name_part = last_name[:2].upper()

        digits_only = ''.join(filter(str.isdigit, phone))
        if len(digits_only) < 4:
            raise ValueError("Phone number must contain at least 4 digits")
        phone_part = digits_only[-4:]
        password = f"{last_name_part}{phone_part}"

        # Generate encrypted PDF
        pdf_buffer = generate_statement_pdf(
            user=user,
            wallet_type=wallet_type,
            start_date=start_date,
            end_date=end_date,
            password=password
        )

        # Filename
        date_str = datetime.now().strftime("%Y%m%d")
        filename = f"Qezzy_{wallet_type}_Statement_{date_str}.pdf"

        # ✅ EMAIL BODY — DESCRIBE LOGIC, NEVER REVEAL PASSWORD
        subject = f"Your Qezzy {wallet_type.title()} Wallet Statement"

        plain_body = (
            f"Hi {user.first_name.title()},\n\n"
            "Your account statement is attached as a password-protected PDF for security.\n\n"
            "To open it, use a password formed from:\n"
            "- The first two letters of your last name (in uppercase), and\n"
            "- The last four digits of your registered phone number.\n\n"
            "Example: If your name is Agnes Muma and phone is 0712345678, your password is MU5678.\n\n"
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
            
            <p>Your {wallet_type} wallet statement is attached as a <strong>password-protected PDF</strong> for your security.</p>

            <div style="background-color: #fdf9f0; border: 1px solid #f0e0c0; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <p><strong>How to open the PDF:</strong></p>
              <p>Your password is a combination of:</p>
              <ul style="margin: 12px 0 12px 20px; padding-left: 0;">
                <li>The <strong>first two letters of your last name</strong> (in uppercase)</li>
                <li>The <strong>last four digits of your registered phone number</strong></li>
              </ul>
              <p style="font-style: italic; color: #666; margin-top: 12px;">
                Example: If your name is <em>Agnes Muma</em> and phone is <em>0712345678</em>, your password is <strong>MU5678</strong>.
              </p>
            </div>

            <p>Only you can access this document — keep it secure.</p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
              © {datetime.now().year} Qezzy Kenya. All rights reserved.<br>
              Nairobi, Kenya | www.qezzykenya.company
            </div>
          </div>
        </div>
        """

        # Create and send email with attachment
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


def send_task_assigned_email(user, task_title, reward, deadline):
    print(f"[DEBUG] Preparing email for {user.email} about '{task_title}'")
    """
    Notify user when a new task is assigned.
    """
    subject = f"New Task: {task_title} – Qezzy Kenya"
    context = {
        'first_name': user.first_name.title(),
        'task_title': task_title,
        'reward': f"{reward:.2f}",
        'deadline': deadline.strftime("%d %b %Y at %H:%M") if hasattr(deadline, 'strftime') else str(deadline),
    }

    html_content = render_to_string('emails/task_assigned.html', context)
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
        print(f"[DEBUG] Email sent successfully to {user.email}")
    except Exception as e:
        print(f"Failed to send task email to {user.email}: {e}")