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
        self.ticket_groups = set()  # Track groups this connection is in

    async def disconnect(self, code):
        # Leave all ticket groups
        for group in self.ticket_groups:
            await self.channel_layer.group_discard(group, self.channel_name)

    async def receive_json(self, content):
        user = self.scope["user"]
        action = content.get("action")

        if action == "join_ticket":
            ticket_id = content.get("ticket_id")
            try:
                ticket = await self.get_ticket_for_user(ticket_id, user.id)
                group_name = f"ticket_{ticket_id}"
                await self.channel_layer.group_add(group_name, self.channel_name)
                self.ticket_groups.add(group_name)
                await self.send_json({"status": "joined", "ticket_id": ticket_id})
            except ObjectDoesNotExist:
                await self.send_json({"error": "Ticket not found"})

        elif action == "send_message":
            ticket_id = content.get("ticket_id")
            message_text = content.get("message", "").strip()

            if not ticket_id or not message_text:
                await self.send_json({"error": "Missing ticket_id or message"})
                return

            try:
                ticket = await self.get_ticket_for_user(ticket_id, user.id)
                message = await self.create_support_message(ticket.id, user.id, message_text, is_admin=False)
                
                # Broadcast to ticket group
                await self.channel_layer.group_send(
                    f"ticket_{ticket_id}",
                    {
                        "type": "chat_message",
                        "data": {
                            "id": message.id,
                            "sender": "You",
                            "is_admin": False,
                            "message": message.message,
                            "created_at": message.created_at.isoformat(),
                        }
                    }
                )
            except ObjectDoesNotExist:
                await self.send_json({"error": "Ticket not found or access denied"})

    async def chat_message(self, event):
        await self.send_json(event["data"])

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