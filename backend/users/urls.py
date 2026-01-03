from django.urls import path
from . import views

urlpatterns = [
    path('me/', views.UserDetailView.as_view(), name='user-detail'),
    path('profile/', views.ProfileUpdateView.as_view(), name='profile-update'),
    path('close/', views.CloseAccountView.as_view(), name='close-account'),
]