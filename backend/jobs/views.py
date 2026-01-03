from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Job
from users.models import User

class JobListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Enforce: only active users can access jobs
        if not user.is_active:
            return Response({
                'error': 'Account not active',
                'redirect_to': '/activation'
            }, status=403)

        # Get jobs assigned to this user
        jobs = Job.objects.filter(assigned_to=user).order_by('-created_at')
        data = []
        for job in jobs:
            data.append({
                'id': job.id,
                'title': job.title,
                'description': job.description,
                'status': job.status,
                'created_at': job.created_at.isoformat(),
                'updated_at': job.updated_at.isoformat()
            })
        return Response(data)

class JobDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        user = request.user

        if not user.is_active:
            return Response({'error': 'Account not active'}, status=403)

        job = get_object_or_404(Job, id=job_id, assigned_to=user)
        return Response({
            'id': job.id,
            'title': job.title,
            'description': job.description,
            'status': job.status,
            'created_at': job.created_at.isoformat(),
            'updated_at': job.updated_at.isoformat()
        })