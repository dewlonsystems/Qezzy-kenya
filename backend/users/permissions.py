from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """
    Permission to allow only authenticated staff/admin users.
    Replaces basic Django IsAdminUser with explicit auth check.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_staff
        )


class HasTierAccess(BasePermission):
    """
    DRF Permission class that checks if the user's current subscription tier
    meets or exceeds the `required_tier_level` defined on the view.

    Usage in your views:
        class PremiumTaskView(APIView):
            permission_classes = [IsAuthenticated, HasTierAccess]
            required_tier_level = 3  # 3 = Premium, 4 = Elite

    Tier Levels: 0=Free, 1=Basic, 2=Standard, 3=Premium, 4=Elite
    If `required_tier_level` is not set on the view, defaults to 0 (Free).
    Grace period subscriptions are automatically considered active.
    """
    message = "Insufficient subscription tier to access this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        required_tier = getattr(view, 'required_tier_level', 0)

        # Lazy import to avoid circular dependency with subscriptions app
        from subscriptions.utils import can_access_tier
        return can_access_tier(request.user, required_tier)


class HasPaidSubscription(BasePermission):
    """
    DRF Permission class that checks if the user has an active paid subscription
    (tier level > 0). Grace period counts as active.
    Ideal for endpoints that should be blocked for Free-tier users.
    """
    message = "This feature requires an active paid subscription."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        from subscriptions.utils import get_active_subscription
        sub = get_active_subscription(request.user)
        return sub is not None and sub.plan.tier_level > 0