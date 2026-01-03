from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        return Response({
            'error': True,
            'message': str(exc.detail) if hasattr(exc, 'detail') else 'An error occurred',
            'status_code': response.status_code
        }, status=response.status_code)

    return response
