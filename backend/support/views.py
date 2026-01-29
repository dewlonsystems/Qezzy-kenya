from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.shortcuts import get_object_or_404
from .models import SupportTicket, SupportMessage


class SupportTicketListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        tickets = SupportTicket.objects.filter(user=user).order_by('-created_at')
        
        data = {
            'tickets': [
                {
                    'ticket_id': ticket.id,
                    'subject': ticket.subject,
                    'category': ticket.category,
                    'status': ticket.status,
                    'created_at': ticket.created_at.isoformat(),
                }
                for ticket in tickets
            ]
        }
        return Response(data)


class CreateSupportTicketView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        subject = request.data.get('subject', '').strip()
        category = request.data.get('category', '').strip()
        message_text = request.data.get('message', '').strip()

        if not subject or not category or not message_text:
            return Response({'error': 'Subject, category, and message are required'}, status=400)

        if category not in dict(SupportTicket.CATEGORY_CHOICES):
            return Response({'error': 'Invalid category'}, status=400)

        ticket = SupportTicket.objects.create(
            user=user,
            subject=subject,
            category=category,
            status='open'
        )

        SupportMessage.objects.create(
            ticket=ticket,
            sender=user,
            is_admin=False,
            message=message_text
        )

        return Response({
            'ticket_id': ticket.id,
            'message': 'Support ticket created successfully'
        })


class TicketConversationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id):
        user = request.user
        ticket = get_object_or_404(SupportTicket, id=ticket_id, user=user)
        messages = ticket.messages.order_by('created_at')

        data = {
            'ticket_id': ticket.id,
            'subject': ticket.subject,
            'category': ticket.category,
            'status': ticket.status,
            'created_at': ticket.created_at.isoformat(),
            'messages': [
                {
                    'id': msg.id,
                    'sender': 'Admin' if msg.is_admin else 'You',
                    'message': msg.message,
                    'created_at': msg.created_at.isoformat()
                }
                for msg in messages
            ]
        }
        return Response(data)

    def post(self, request, ticket_id):
        user = request.user
        ticket = get_object_or_404(SupportTicket, id=ticket_id, user=user)

        if ticket.status == 'closed':
            return Response({'error': 'Cannot reply to a closed ticket'}, status=400)

        message_text = request.data.get('message', '').strip()
        if not message_text:
            return Response({'error': 'Message cannot be empty'}, status=400)

        SupportMessage.objects.create(
            ticket=ticket,
            sender=user,
            is_admin=False,
            message=message_text
        )

        if ticket.status == 'resolved':
            ticket.status = 'in_progress'
            ticket.save()

        return Response({'message': 'Reply sent'})


class AdminTicketListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        tickets = SupportTicket.objects.select_related('user').order_by('-created_at')
        
        data = {
            'tickets': [
                {
                    'ticket_id': ticket.id,
                    'subject': ticket.subject,
                    'category': ticket.category,
                    'status': ticket.status,
                    'user_email': ticket.user.email,
                    'created_at': ticket.created_at.isoformat(),
                }
                for ticket in tickets
            ]
        }
        return Response(data)


class AdminTicketReplyView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, ticket_id):
        ticket = get_object_or_404(SupportTicket, id=ticket_id)

        message_text = request.data.get('message', '').strip()
        if not message_text:
            return Response({'error': 'Message cannot be empty'}, status=400)

        SupportMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            is_admin=True,
            message=message_text
        )

        if ticket.status in ['open', 'closed']:
            ticket.status = 'in_progress'
        ticket.save()

        return Response({'message': 'Admin reply sent'})