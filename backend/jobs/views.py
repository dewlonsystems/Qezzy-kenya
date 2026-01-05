# jobs/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import SurveyJob, SurveyResponse, SurveyQuestion


class JobListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if not user.is_active:
            return Response({
                'error': 'Account not active',
                'redirect_to': '/activation'
            }, status=403)

        # Fetch ALL jobs for the user, regardless of status
        jobs = SurveyJob.objects.filter(user=user).order_by('-created_at')
        data = []
        for job in jobs:
            data.append({
                'id': job.id,
                'title': job.title,
                'question_count': job.question_count,
                'reward_kes': float(job.reward_kes),
                'created_at': job.created_at.isoformat(),
                'status': job.status,  # ← Now included!
                'category': {'name': job.category.name},
            })
        return Response(data)


class JobDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        user = request.user
        if not user.is_active:
            return Response({'error': 'Account not active'}, status=403)

        job = get_object_or_404(SurveyJob, id=job_id, user=user, status='open')
        questions = SurveyQuestion.objects.filter(id__in=job.selected_question_ids)
        question_list = [{'id': q.id, 'text': q.text} for q in questions]

        return Response({
            'id': job.id,
            'title': job.title,
            'reward_kes': float(job.reward_kes),
            'question_count': job.question_count,
            'questions': question_list,
            'created_at': job.created_at.isoformat(),
        })

    def post(self, request, job_id):
        user = request.user
        if not user.is_active:
            return Response({'error': 'Account not active'}, status=403)

        job = get_object_or_404(SurveyJob, id=job_id, user=user, status='open')
        answers = request.data.get('answers')

        if not isinstance(answers, dict):
            return Response({'error': 'Answers must be a JSON object.'}, status=status.HTTP_400_BAD_REQUEST)

        answered_ids = {str(k) for k in answers.keys()}
        expected_ids = {str(q_id) for q_id in job.selected_question_ids}
        if answered_ids != expected_ids:
            return Response({
                'error': 'Submitted answers do not match the job questions.'
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            job.status = 'submitted'
            job.save(update_fields=['status'])
            SurveyResponse.objects.create(job=job, answers=answers)

        return Response({'message': 'Survey submitted successfully.'}, status=status.HTTP_200_OK)