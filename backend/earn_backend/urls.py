from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/onboarding/', include('onboarding.urls')),
    path('api/activation/', include('activation.urls')),
    path('api/referrals/', include('referrals.urls')),
    path('api/jobs/', include('jobs.urls')),
    path('api/wallets/', include('wallets.urls')),
    path('api/withdrawals/', include('withdrawals.urls')),
    path('api/support/', include('support.urls')),
]