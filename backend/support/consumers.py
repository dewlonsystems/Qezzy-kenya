# support/consumers.py
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist
from .models import SupportTicket, SupportMessage

class SupportChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or getattr(user, 'is_closed', False):
            await self.close()
            return

        await self.accept()

        # Optional: join a user-specific group for future use (e.g., global notifications)
        self.user_group = f"user_{user.id}_support"
        await self.channel_layer.group_add(self.user_group, self.channel_name)

    async def disconnect(self, code):
        user = self.scope.get("user")
        if user:
            await self.channel_layer.group_discard(self.user_group, self.channel_name)

    async def receive_json(self, content):
        user = self.scope["user"]
        action = content.get("action")

        if action == "send_message":
            ticket_id = content.get("ticket_id")
            message_text = content.get("message", "").strip()

            if not ticket_id or not message_text:
                await self.send_json({"error": "Missing ticket_id or message"})
                return

            try:
                ticket = await self.get_ticket_for_user(ticket_id, user.id)
                message = await self.create_support_message(ticket.id, user.id, message_text, is_admin=False)
                # Broadcast to all clients in this ticket's group (if you later add multi-user chat)
                # For now, just echo back to sender
                await self.send_json({
                    "id": message.id,
                    "sender": user.email,
                    "is_admin": False,
                    "message": message.message,
                    "created_at": message.created_at.isoformat(),
                })
            except ObjectDoesNotExist:
                await self.send_json({"error": "Ticket not found or access denied"})

    @database_sync_to_async
    def get_ticket_for_user(self, ticket_id, user_id):
        return SupportTicket.objects.get(id=ticket_id, user_id=user_id)

    @database_sync_to_async
    def create_support_message(self, ticket_id, user_id, message, is_admin):
        return SupportMessage.objects.create(
            ticket_id=ticket_id,
            sender_id=user_id,
            is_admin=is_admin,
            message=message
        )