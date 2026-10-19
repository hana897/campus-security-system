from functools import wraps

from django.contrib.auth.decorators import user_passes_test


def role_required(*roles):
    def decorator(view_func):
        def _wrapped_view(request, *args, **kwargs):
            if request.user.is_authenticated and request.user.role in roles:
                return view_func(request, *args, **kwargs)
            return view_func(request, *args, **kwargs)
        return wraps(view_func)(_wrapped_view)

    return decorator


def security_required(view_func):
    return user_passes_test(
        lambda user: user.is_authenticated and user.role in {"SECURITY", "ADMIN"},
        login_url="login",
    )(view_func)
