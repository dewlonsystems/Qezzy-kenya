from django.http import JsonResponse

class ClosedAccountMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):        
        if hasattr(request, 'user') and request.user.is_authenticated:
            if getattr(request.user, 'is_closed', False):                
                if not request.path.startswith('/api/users/close/'):
                    return JsonResponse({'error': 'Account closed. Contact admin to restore.'}, status=403)
        response = self.get_response(request)
        return response