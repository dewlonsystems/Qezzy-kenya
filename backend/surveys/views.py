import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import SurveyCategory, SurveyQuestion, UserSurveySubmission, SurveyAnswer
from subscriptions.utils import can_access_tier

logger = logging.getLogger('surveys')


def _validate_survey_answers(category, answers_dict):
    """
    Validate user answers against category questions.
    Returns a list of error strings. Empty list = valid.
    """
    errors = []
    questions = list(category.questions.all())
    question_map = {q.id: q for q in questions}
    submitted_ids = []

    # Parse & validate IDs
    for k in answers_dict.keys():
        try:
            submitted_ids.append(int(k))
        except ValueError:
            errors.append(f"Invalid question ID: {k}")
            continue

    # Check required fields & type validation
    for q in questions:
        ans = answers_dict.get(str(q.id))

        # Handle missing/empty required fields
        if q.is_required and (ans is None or str(ans).strip() == ''):
            errors.append(f"Required question '{q.text[:30]}...' is missing or empty.")
            continue

        if ans is None or str(ans).strip() == '':
            continue  # Skip validation for non-required empty answers

        # Type-specific validation
        if q.question_type == 'multiple_choice':
            if ans not in q.options:
                errors.append(f"Question '{q.text[:30]}...': '{ans}' is not a valid option. Choose from {q.options}")
        elif q.question_type == 'text':
            if not isinstance(ans, str) or len(ans.strip()) < 1:
                errors.append(f"Question '{q.text[:30]}...': requires valid text input.")
        elif q.question_type == 'rating_1_to_5':
            try:
                rating = int(ans)
                if not (1 <= rating <= 5):
                    errors.append(f"Question '{q.text[:30]}...': rating must be between 1 and 5.")
            except (ValueError, TypeError):
                errors.append(f"Question '{q.text[:30]}...': requires a numeric rating (1-5).")

    return errors


class SurveyCategoryListView(APIView):
    """
    GET /api/surveys/categories/
    List all active survey categories accessible to the user's subscription tier.
    Excludes completed categories and those currently pending admin review.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        active_categories = SurveyCategory.objects.filter(status='active')
        accessible = []

        for cat in active_categories:
            # Tier check
            if not can_access_tier(user, cat.tier_level):
                continue

            # Check submission state
            submission = UserSurveySubmission.objects.filter(user=user, category=cat).first()
            if submission and submission.status in ('approved', 'pending_review'):
                continue  # Hide completed or pending-review categories

            accessible.append({
                'id': cat.id,
                'name': cat.name,
                'description': cat.description,
                'tier_level': cat.tier_level,
                'amount_kes': str(cat.amount_kes),
                'question_count': cat.questions.count(),
                'status': submission.status if submission else 'not_started',
                'rejection_reason': submission.rejection_reason if submission and submission.status == 'rejected' else None,
            })

        return Response({'categories': accessible}, status=status.HTTP_200_OK)


class SurveyCategoryDetailView(APIView):
    """
    GET /api/surveys/categories/<id>/
    Fetch category details and questions for submission.
    Only accessible if category is active, matches user tier, and user has an 'active' or 'rejected' submission.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, category_id):
        user = request.user
        category = get_object_or_404(SurveyCategory, id=category_id, status='active')

        if not can_access_tier(user, category.tier_level):
            return Response({'error': 'Subscription tier does not grant access to this category'}, status=status.HTTP_403_FORBIDDEN)

        submission, created = UserSurveySubmission.objects.get_or_create(
            user=user, category=category, defaults={'status': 'active'}
        )

        if submission.status == 'approved':
            return Response({'error': 'This category has already been completed and cannot be revisited.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if submission.status == 'pending_review':
            return Response({'error': 'This category is currently pending admin review.'}, status=status.HTTP_400_BAD_REQUEST)

        # Return questions
        questions = []
        for q in category.questions.all():
            q_data = {
                'id': q.id,
                'text': q.text,
                'type': q.question_type,
                'required': q.is_required,
                'order': q.order,
            }
            if q.question_type == 'multiple_choice':
                q_data['options'] = q.options
            questions.append(q_data)

        return Response({
            'category': {
                'id': category.id,
                'name': category.name,
                'description': category.description,
                'amount_kes': str(category.amount_kes),
                'submission_id': submission.id,
                'current_status': submission.status,
            },
            'questions': sorted(questions, key=lambda x: x['order']),
        }, status=status.HTTP_200_OK)


class SurveySubmissionListView(APIView):
    """
    GET /api/surveys/submissions/
    Return the current user's survey submissions for tab filtering and history.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        submissions = UserSurveySubmission.objects.filter(user=user).select_related('category')

        submission_data = []
        for submission in submissions:
            submission_data.append({
                'id': submission.id,
                'category_id': submission.category.id,
                'category_name': submission.category.name,
                'status': submission.status,
                'rejection_reason': submission.rejection_reason or None,
                'submitted_at': submission.submitted_at.isoformat() if submission.submitted_at else None,
                'reviewed_at': submission.reviewed_at.isoformat() if submission.reviewed_at else None,
                'amount_kes': str(submission.category.amount_kes),
                'tier_level': submission.category.tier_level,
            })

        return Response({'submissions': submission_data}, status=status.HTTP_200_OK)


class SurveySubmissionView(APIView):
    """
    POST /api/surveys/submit/
    Submit answers for a survey category.
    Validates answers, saves them, and transitions submission to 'pending_review'.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        category_id = request.data.get('category_id')
        answers = request.data.get('answers', {})

        if not category_id:
            return Response({'error': 'category_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        category = get_object_or_404(SurveyCategory, id=category_id, status='active')

        if not can_access_tier(user, category.tier_level):
            return Response({'error': 'Subscription tier does not grant access'}, status=status.HTTP_403_FORBIDDEN)

        try:
            submission = UserSurveySubmission.objects.get(user=user, category=category)
        except UserSurveySubmission.DoesNotExist:
            return Response({'error': 'No active submission found for this category. Refresh and try again.'}, status=status.HTTP_400_BAD_REQUEST)

        if submission.status != 'active':
            return Response({'error': f'Cannot submit. Current status: {submission.get_status_display()}'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate answers
        validation_errors = _validate_survey_answers(category, answers)
        if validation_errors:
            return Response({'error': 'Validation failed', 'details': validation_errors}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Clear previous answers (for resubmissions after rejection)
            submission.answers.all().delete()

            # Create new answers
            for q_id, ans in answers.items():
                if ans is None or str(ans).strip() == '':
                    continue
                question = get_object_or_404(SurveyQuestion, id=q_id, category=category)
                
                answer_obj = SurveyAnswer(
                    submission=submission,
                    question=question,
                )
                
                if question.question_type == 'multiple_choice':
                    answer_obj.answer_option = str(ans)
                elif question.question_type == 'rating_1_to_5':
                    answer_obj.answer_rating = int(ans)
                else:
                    answer_obj.answer_text = str(ans)
                answer_obj.save()

            # Transition status
            submission.mark_pending_review()

        logger.info(f"User {user.email} submitted survey category {category.name} (ID: {category.id})")
        return Response({
            'message': 'Survey submitted successfully. Awaiting admin review.',
            'submission_id': submission.id,
            'status': submission.status
        }, status=status.HTTP_200_OK)


class AdminSurveyReviewView(APIView):
    """
    POST /api/surveys/admin/review/
    Staff-only endpoint to approve or reject pending submissions.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_staff:
            raise PermissionDenied('Staff access required.')

        submission_id = request.data.get('submission_id')
        action = request.data.get('action')  # 'approve' or 'reject'
        reason = request.data.get('reason', '').strip()

        if not submission_id or action not in ('approve', 'reject'):
            return Response({'error': 'submission_id and action (approve/reject) are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            submission = UserSurveySubmission.objects.select_related('user', 'category').get(id=submission_id)
        except UserSurveySubmission.DoesNotExist:
            return Response({'error': 'Submission not found'}, status=status.HTTP_404_NOT_FOUND)

        if submission.status != 'pending_review':
            return Response({'error': f'Submission status is {submission.get_status_display()}, not pending_review'}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'reject' and not reason:
            return Response({'error': 'A rejection reason is required'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            if action == 'approve':
                submission.mark_approved(reviewed_by_user=request.user)
                # Wallet crediting is handled automatically by signals
                logger.info(f"Staff {request.user.email} approved submission {submission_id}")
                return Response({
                    'message': 'Submission approved. Wallet credited automatically.',
                    'status': submission.status,
                    'reviewed_at': submission.reviewed_at.isoformat()
                }, status=status.HTTP_200_OK)
            else:
                submission.mark_rejected(reviewed_by_user=request.user, reason=reason)
                logger.info(f"Staff {request.user.email} rejected submission {submission_id}")
                return Response({
                    'message': 'Submission rejected. User can resubmit after reviewing feedback.',
                    'status': submission.status,
                    'rejection_reason': submission.rejection_reason
                }, status=status.HTTP_200_OK)