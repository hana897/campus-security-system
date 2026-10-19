import hashlib
import secrets
from datetime import timedelta
from functools import wraps

from django.http import JsonResponse
from django.utils import timezone

from .models import APIToken


def issue_api_token(user):
    raw_token = secrets.token_urlsafe(40)
    APIToken.objects.create(
        user=user,
        token_hash=hashlib.sha256(raw_token.encode("utf-8")).hexdigest(),
        expires_at=timezone.now() + timedelta(hours=12),
    )
    return raw_token


def _error(message, status):
    response = JsonResponse({"message": message}, status=status)
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


def api_authenticated(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if request.method == "OPTIONS":
            return view(request, *args, **kwargs)
        authorization = request.headers.get("Authorization", "")
        scheme, _, raw_token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not raw_token:
            return _error("Sign in is required.", 401)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        try:
            token = APIToken.objects.select_related("user").get(token_hash=token_hash)
        except APIToken.DoesNotExist:
            return _error("Your session is invalid. Sign in again.", 401)
        if token.expires_at <= timezone.now() or not token.user.is_active:
            token.delete()
            return _error("Your session has expired. Sign in again.", 401)
        request.api_user = token.user
        request.api_token = token
        return view(request, *args, **kwargs)

    return wrapped


def require_api_roles(*roles):
    def decorator(view):
        @api_authenticated
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            if request.method == "OPTIONS":
                return view(request, *args, **kwargs)
            if request.api_user.role not in roles:
                return _error("You do not have permission to perform this action.", 403)
            return view(request, *args, **kwargs)

        return wrapped

    return decorator


def require_super_admin(view):
    @api_authenticated
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if request.method == "OPTIONS":
            return view(request, *args, **kwargs)
        if request.api_user.role != "SUPER_ADMIN" or not request.api_user.is_superuser:
            return _error("Only the super admin can manage administrator accounts.", 403)
        return view(request, *args, **kwargs)

    return wrapped
