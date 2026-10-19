import json
import csv
from datetime import datetime, date
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from accounts.api_auth import issue_api_token, api_authenticated, require_api_roles, require_super_admin
from accounts.models import APIToken
from assets.models import Asset, AssetCategory
from owners.models import Owner, Department
from owners.validators import is_text_only
from verification.models import VerificationLog, ExitRequest

User = get_user_model()


def _text_only_error(field_name, value):
    if not isinstance(value, str):
        return f"{field_name} must be text."
    if not is_text_only(value):
        return f"{field_name} must contain only text (letters, spaces, and punctuation)."
    return None


def _saved_file_url(*, user_id=None, owner_id=None, request=None):
    import mimetypes
    from sqlalchemy import select
    from .sql_store import StoredFile, SessionLocal, ensure_tables
    ensure_tables()
    with SessionLocal() as session:
        query = select(StoredFile).order_by(StoredFile.created_at.desc())
        query = query.where(StoredFile.user_id == user_id, StoredFile.kind == "profile") if user_id is not None else query.where(StoredFile.owner_id == owner_id, StoredFile.kind == "owner-photo")
        saved = session.scalar(query.limit(1))
        if not saved and request is not None:
            # Copy existing media-backed images into the database on first use.
            legacy = User.objects.filter(pk=user_id).first() if user_id is not None else Owner.objects.filter(pk=owner_id).first()
            field = (legacy.profile_picture if user_id is not None else legacy.photo) if legacy else None
            if field:
                try:
                    field.open("rb")
                    content = field.read()
                    field.close()
                    if content:
                        session.add(StoredFile(user_id=user_id, owner_id=owner_id,
                                               kind="profile" if user_id is not None else "owner-photo",
                                               file_name=field.name.rsplit("/", 1)[-1][:255],
                                               mime_type=mimetypes.guess_type(field.name)[0] or "application/octet-stream", content=content))
                        session.commit()
                        saved = session.scalar(query.limit(1))
                except (OSError, ValueError):
                    pass
        return request.build_absolute_uri(f"/api/files/{saved.id}/") if saved and request else (f"/api/files/{saved.id}/" if saved else "")


def _save_uploaded_file(upload, *, user_id=None, owner_id=None, kind):
    from sqlalchemy import delete
    from .sql_store import StoredFile, SessionLocal, ensure_tables
    ensure_tables()
    with SessionLocal() as session:
        if user_id is not None:
            session.execute(delete(StoredFile).where(StoredFile.user_id == user_id, StoredFile.kind == kind))
        if owner_id is not None:
            session.execute(delete(StoredFile).where(StoredFile.owner_id == owner_id, StoredFile.kind == kind))
        session.add(StoredFile(user_id=user_id, owner_id=owner_id, kind=kind, file_name=upload.name[:255], mime_type=upload.content_type or "application/octet-stream", content=upload.read()))
        session.commit()


def _delete_saved_file(*, user_id=None, owner_id=None, kind):
    from sqlalchemy import delete
    from .sql_store import StoredFile, SessionLocal, ensure_tables
    ensure_tables()
    with SessionLocal() as session:
        condition = StoredFile.user_id == user_id if user_id is not None else StoredFile.owner_id == owner_id
        session.execute(delete(StoredFile).where(condition, StoredFile.kind == kind))
        session.commit()

def json_cors_response(data, status=200):
    response = JsonResponse(data, status=status, safe=False)
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

def handle_cors_preflight(request):
    if request.method == "OPTIONS":
        response = HttpResponse(status=200)
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response
    return None

@csrf_exempt
def auth_login_api(request):
    preflight = handle_cors_preflight(request)
    if preflight: return preflight

    if request.method != "POST":
        return json_cors_response({"error": "POST required"}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8"))
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
    except Exception:
        email = request.POST.get("email", "").strip().lower()
        password = request.POST.get("password", "")

    if request.method != "POST":
        return json_cors_response({"message": "POST required."}, status=405)
    user = User.objects.filter(email__iexact=email, is_active=True).first()
    if not user or not user.check_password(password):
        return json_cors_response({"message": "Invalid email or password."}, status=401)
    token = issue_api_token(user)
    user.last_login = timezone.now()
    user.save(update_fields=["last_login"])
    return json_cors_response({"token": token, "user": _serialize_user(user, request)}, status=200)


def _serialize_user(user, request=None):
    role_labels = {"SUPER_ADMIN": "Super Admin", "ADMIN": "Administrator", "SECURITY": "Security Officer", "MANAGER": "Asset Manager"}
    return {
        "id": str(user.pk),
        "officerId": f"SEC-{user.pk:05d}",
        "firstName": user.first_name,
        "lastName": user.last_name,
        "username": user.username,
        "email": user.email,
        "phone": user.phone or "",
        "department": user.department,
        "position": role_labels.get(user.role, "Administrator"),
        "role": user.role,
        "campus": "Main Campus",
        "assignedGate": "Main Gate",
        "status": "ACTIVE" if user.is_active else "SUSPENDED",
        "clearanceLevel": 5 if user.role == "SUPER_ADMIN" else 2 if user.role == "ADMIN" else 1,
        "avatarUrl": _saved_file_url(user_id=user.pk, request=request),
        "joinedAt": user.date_joined.strftime("%Y-%m-%d"),
    }


@csrf_exempt
@api_authenticated
def auth_me_api(request):
    preflight = handle_cors_preflight(request)
    if preflight:
        return preflight
    return json_cors_response(_serialize_user(request.api_user, request))


@csrf_exempt
@api_authenticated
def auth_change_password_api(request):
    preflight = handle_cors_preflight(request)
    if preflight:
        return preflight
    if request.method != "POST":
        return json_cors_response({"message": "POST required."}, status=405)
    try:
        data = json.loads(request.body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return json_cors_response({"message": "Invalid request body."}, status=400)
    user = request.api_user
    if not user.check_password(data.get("currentPassword", "")):
        return json_cors_response({"message": "Current password is incorrect."}, status=400)
    new_password = data.get("newPassword", "")
    try:
        validate_password(new_password, user)
    except ValidationError as error:
        return json_cors_response({"message": " ".join(error.messages)}, status=400)
    user.set_password(new_password)
    user.save(update_fields=["password"])
    APIToken.objects.filter(user=user).delete()
    return json_cors_response({"message": "Password changed. Sign in again."})


@csrf_exempt
@require_super_admin
def user_list_api(request):
    preflight = handle_cors_preflight(request)
    if preflight:
        return preflight
    if request.method == "GET":
        users = User.objects.filter(role="ADMIN").order_by("first_name", "last_name")
        result = []
        for user in users:
            result.append({
                **_serialize_user(user, request),
                "name": user.get_full_name() or user.email,
                "roleLabel": "Admin",
                "lastLogin": user.last_login.strftime("%b %d, %Y %H:%M") if user.last_login else "Never",
            })
        return json_cors_response(result)
    if request.method != "POST":
        return json_cors_response({"message": "GET or POST required."}, status=405)
    try:
        data = json.loads(request.body.decode("utf-8"))
        email = data.get("email", "").strip().lower()
        first_name = data.get("firstName", "").strip()
        last_name = data.get("lastName", "").strip()
        password = data.get("password", "")
        phone = data.get("phone", "").strip()
        if not all([email, first_name, phone, password]):
            return json_cors_response({"message": "Name, email, phone number, and password are required."}, status=400)
        if len(phone) > User._meta.get_field("phone").max_length:
            return json_cors_response({"message": "Phone number must be 15 characters or fewer."}, status=400)
        if User.objects.filter(email__iexact=email).exists():
            return json_cors_response({"message": "An account with this email already exists."}, status=409)
        candidate = User(email=email, username=email, first_name=first_name, last_name=last_name, phone=phone, role="ADMIN")
        validate_password(password, candidate)
        candidate.set_password(password)
        candidate.save()
        _broadcast_notification(
            title="Administrator created",
            message=f"{candidate.get_full_name() or email} ({email}) was added to the system.",
            notification_type="success",
            link="/settings/users",
        )
        return json_cors_response({**_serialize_user(candidate, request), "name": candidate.get_full_name() or email, "roleLabel": "Admin", "lastLogin": "Never"}, status=201)
    except (ValueError, UnicodeDecodeError):
        return json_cors_response({"message": "Invalid request body."}, status=400)
    except ValidationError as error:
        return json_cors_response({"message": " ".join(error.messages)}, status=400)


@csrf_exempt
@require_super_admin
def user_detail_api(request, user_id):
    preflight = handle_cors_preflight(request)
    if preflight:
        return preflight
    try:
        user = User.objects.get(pk=user_id, role="ADMIN")
    except User.DoesNotExist:
        return json_cors_response({"message": "Administrator not found."}, status=404)
    if request.method == "PATCH":
        try:
            data = json.loads(request.body.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return json_cors_response({"message": "Invalid request body."}, status=400)
        if "isActive" in data:
            user.is_active = bool(data["isActive"])
            user.save(update_fields=["is_active"])
        return json_cors_response({**_serialize_user(user, request), "name": user.get_full_name() or user.email, "roleLabel": "Admin"})
    if request.method == "DELETE":
        user.is_active = False
        user.save(update_fields=["is_active"])
        APIToken.objects.filter(user=user).delete()
        return json_cors_response({"message": "Administrator access has been disabled."})
    return json_cors_response({"message": "PATCH or DELETE required."}, status=405)


@csrf_exempt
@api_authenticated
def profile_update_api(request):
    preflight = handle_cors_preflight(request)
    if preflight:
        return preflight
    user = request.api_user
    if request.method not in ("PATCH", "POST"):
        return json_cors_response({"message": "PATCH required."}, status=405)
    # Django fills request.POST / request.FILES for POST. Multipart PATCH
    # bodies must be parsed explicitly before reading uploaded files.
    is_multipart = request.content_type and request.content_type.startswith("multipart/form-data")
    if is_multipart and request.method == "PATCH":
        from django.http.multipartparser import MultiPartParser

        data, uploaded_files = MultiPartParser(
            request.META, request, request.upload_handlers, request.encoding
        ).parse()
        request._files = uploaded_files
    elif request.FILES:
        data, uploaded_files = request.POST, request.FILES
    else:
        data, uploaded_files = json.loads(request.body.decode("utf-8") or "{}"), {}
    for key in ("first_name", "last_name", "phone", "department"):
        if key in data:
            setattr(user, key, data[key].strip())
    if "profile_picture" in request.FILES:
        try:
            _save_uploaded_file(request.FILES["profile_picture"], user_id=user.pk, kind="profile")
        except Exception:
            return json_cors_response({"message": "The profile picture could not be saved to the database."}, status=500)
    if "email" in data and data["email"].strip().lower() != user.email.lower():
        email = data["email"].strip().lower()
        if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            return json_cors_response({"message": "This email is already in use."}, status=409)
        user.email = email
        user.username = email
    user.save()
    return json_cors_response(_serialize_user(user, request))

@csrf_exempt
@require_api_roles("ADMIN", "SUPER_ADMIN")
def asset_list_api(request):
    preflight = handle_cors_preflight(request)
    if preflight: return preflight

    if request.method == "POST":
        try:
            data = request.POST if request.content_type and "multipart/form-data" in request.content_type else json.loads(request.body.decode("utf-8"))
            for field_name, label in (("description", "Description"), ("notes", "Notes")):
                value = data.get(field_name, "")
                error = _text_only_error(label, "" if value is None else value)
                if error:
                    return json_cors_response({"error": error}, status=400)
            category_name = data.get("category", "Other")
            category, _ = AssetCategory.objects.get_or_create(name=category_name)
            
            asset_code = data.get("asset_code") or f"AST-2026-{str(Asset.objects.count() + 101).zfill(5)}"
            registration_value = str(data.get("registrationDateTime") or "").strip()
            registration_datetime = parse_datetime(registration_value) if registration_value else None
            if registration_value and registration_datetime is None:
                return json_cors_response({"error": "Enter a valid registration date and time."}, status=400)
            if registration_datetime and timezone.is_naive(registration_datetime):
                registration_datetime = timezone.make_aware(registration_datetime)
            owner_value = str(data.get("ownerId") or data.get("ownerMatric") or "").strip()
            if not owner_value:
                return json_cors_response({"error": "Select a registered owner before saving this asset."}, status=400)
            owner = Owner.objects.filter(owner_id__iexact=owner_value).select_related("department").first()
            if not owner and owner_value.isdigit():
                owner = Owner.objects.filter(pk=int(owner_value)).select_related("department").first()
            if not owner:
                return json_cors_response({"error": "The selected owner was not found. Refresh the Owners directory and select a registered person."}, status=400)
            asset = Asset.objects.create(
                asset_code=asset_code,
                asset_name=data.get("name") or data.get("asset_name", ""),
                brand=data.get("brand", ""),
                model=data.get("model", ""),
                notes=data.get("notes", ""),
                serial_number=data.get("serial") or data.get("serial_number", ""),
                category=category,
                status=data.get("status", "AUTHORIZED"),
                image=request.FILES.get("image"),
                owner=owner,
                registered_by=request.api_user,
            )
            if registration_datetime:
                asset.created_at = registration_datetime
                asset.save(update_fields=["created_at"])
            _broadcast_notification(
                title="New asset registered",
                message=f"{asset.asset_name} ({asset.asset_code}) was registered to {owner.full_name}.",
                notification_type="info",
                link=f"/assets/{asset.asset_code}",
            )
            return json_cors_response({
                "id": asset.asset_code,
                "name": asset.asset_name,
                "brand": asset.brand or asset.category.name,
                "model": asset.model or asset.asset_name,
                "serial": asset.serial_number,
                "category": asset.category.name,
                "status": asset.status,
                "registrationDate": asset.created_at.strftime("%Y-%m-%d"),
                "registrationDateTime": asset.created_at.isoformat(),
                "ownerId": asset.owner.owner_id if asset.owner else "UNASSIGNED",
                "ownerName": asset.owner.full_name if asset.owner else "Unassigned",
                "ownerMatric": asset.owner.owner_id if asset.owner else "N/A",
                "department": asset.owner.department.name if asset.owner and asset.owner.department else "General Campus",
                "ownerPhone": asset.owner.phone or "" if asset.owner else "",
                "ownerAvatarUrl": _saved_file_url(owner_id=asset.owner_id, request=request) if asset.owner_id else "",
                "ownerPhone": asset.owner.phone or "" if asset.owner else "",
                "photoUrl": request.build_absolute_uri(asset.image.url) if asset.image else "",
                "notes": asset.notes,
                "registeredBy": asset.registered_by.get_full_name() if asset.registered_by else "Unknown",
                "registeredByAvatarUrl": _saved_file_url(user_id=asset.registered_by_id, request=request) if asset.registered_by_id else "",
            }, status=201)
        except Exception as e:
            return json_cors_response({"error": str(e)}, status=400)

    query = request.GET.get("query", "").strip()
    status_filter = request.GET.get("status", "").strip()
    category_filter = request.GET.get("category", "").strip()

    qs = Asset.objects.select_related("category", "owner", "owner__department", "registered_by").all().order_by("-created_at")

    if status_filter and status_filter != "ALL":
        qs = qs.filter(status=status_filter)
    if category_filter and category_filter != "ALL":
        qs = qs.filter(category__name=category_filter)
    if query:
        qs = qs.filter(asset_name__icontains=query) | qs.filter(asset_code__icontains=query) | qs.filter(serial_number__icontains=query)

    result = []
    for a in qs[:100]:
        result.append({
            "id": a.asset_code,
            "name": a.asset_name,
            "brand": a.brand or a.category.name,
            "model": a.model or a.asset_name,
            "serial": a.serial_number,
            "category": a.category.name,
            "color": "Standard",
            "registrationDate": a.created_at.strftime("%Y-%m-%d"),
            "registrationDateTime": a.created_at.isoformat(),
            "status": a.status,
            "ownerId": a.owner.owner_id if a.owner else "UNASSIGNED",
            "ownerName": a.owner.full_name if a.owner else "Unassigned",
            "ownerMatric": a.owner.owner_id if a.owner else "N/A",
            "department": a.owner.department.name if a.owner and a.owner.department else "General Campus",
            "ownerPhone": a.owner.phone or "" if a.owner else "",
            "ownerAvatarUrl": _saved_file_url(owner_id=a.owner_id, request=request) if a.owner_id else "",
            "photoUrl": request.build_absolute_uri(a.image.url) if a.image else "",
            "notes": a.notes or "Official university tracked inventory item.",
            "registeredBy": a.registered_by.get_full_name() if a.registered_by else "Unknown",
            "registeredByAvatarUrl": _saved_file_url(user_id=a.registered_by_id, request=request) if a.registered_by_id else "",
        })
    return json_cors_response(result)

@csrf_exempt
@require_api_roles("ADMIN", "SUPER_ADMIN")
def asset_detail_api(request, code):
    preflight = handle_cors_preflight(request)
    if preflight: return preflight

    try:
        a = Asset.objects.select_related("category", "owner", "owner__department", "registered_by").get(asset_code=code)
    except Asset.DoesNotExist:
        try:
            a = Asset.objects.select_related("category", "owner", "owner__department", "registered_by").get(serial_number=code)
        except Asset.DoesNotExist:
            return json_cors_response({"error": "Asset not found"}, status=404)

    if request.method in ["PUT", "PATCH"]:
        try:
            data = json.loads(request.body.decode("utf-8"))
            if "status" in data:
                a.status = data["status"]
            if "ownerId" in data:
                owner_value = str(data.get("ownerId") or "").strip()
                owner = Owner.objects.filter(owner_id__iexact=owner_value).select_related("department").first()
                if not owner:
                    return json_cors_response({"error": "Select a registered owner from the directory."}, status=400)
                a.owner = owner
            a.save()
        except Exception as e:
            return json_cors_response({"error": str(e)}, status=400)

    return json_cors_response({
        "id": a.asset_code,
        "name": a.asset_name,
        "brand": a.brand or a.category.name,
        "model": a.model or a.asset_name,
        "serial": a.serial_number,
        "category": a.category.name,
        "color": "Standard",
        "registrationDate": a.created_at.strftime("%Y-%m-%d"),
        "registrationDateTime": a.created_at.isoformat(),
        "status": a.status,
        "ownerId": a.owner.owner_id if a.owner else "UNASSIGNED",
        "ownerName": a.owner.full_name if a.owner else "Unassigned",
        "ownerMatric": a.owner.owner_id if a.owner else "N/A",
        "department": a.owner.department.name if a.owner and a.owner.department else "General Campus",
        "ownerPhone": a.owner.phone or "" if a.owner else "",
        "ownerAvatarUrl": _saved_file_url(owner_id=a.owner_id, request=request) if a.owner_id else "",
        "photoUrl": request.build_absolute_uri(a.image.url) if a.image else "",
        "notes": a.notes or "Verified in campus asset repository.",
        "registeredBy": a.registered_by.get_full_name() if a.registered_by else "Unknown",
        "registeredByAvatarUrl": _saved_file_url(user_id=a.registered_by_id, request=request) if a.registered_by_id else "",
    })

def _serialize_owner(owner, request):
    assets = Asset.objects.filter(owner=owner)
    return {
        "id": str(owner.pk),
        "universityId": owner.owner_id,
        "fullName": owner.full_name,
        "email": owner.email or "",
        "phone": owner.phone or "",
        "department": owner.department.name if owner.department else "General Campus",
        "role": "STAFF" if owner.owner_type == "EMPLOYEE" else owner.owner_type,
        "status": "ACTIVE",
        "avatarUrl": _saved_file_url(owner_id=owner.pk, request=request),
        "documentName": owner.document.name.rsplit("/", 1)[-1] if owner.document else "",
        "documentUrl": request.build_absolute_uri(owner.document.url) if owner.document else "",
        "registeredAssetsCount": assets.count(),
        "authorizedCount": assets.filter(status="AUTHORIZED").count(),
        "lostCount": assets.filter(status="LOST").count(),
        "stolenCount": assets.filter(status="STOLEN").count(),
        "joinedDate": owner.created_at.strftime("%Y-%m-%d"),
    }


@csrf_exempt
@api_authenticated
def owner_list_api(request):
    preflight = handle_cors_preflight(request)
    if preflight: return preflight

    if request.method == "POST":
        if request.api_user.role not in ("ADMIN", "SUPER_ADMIN", "MANAGER"):
            return json_cors_response({"message": "You do not have permission to add owners."}, status=403)
        data = request.POST
        owner_id = data.get("universityId", "").strip()
        full_name = data.get("fullName", "").strip()
        department_name = data.get("department", "").strip()
        if not all((owner_id, full_name, department_name)):
            return json_cors_response({"message": "University ID, full name, and department are required."}, status=400)
        for label, value in (("Owner full name", full_name), ("Department", department_name)):
            error = _text_only_error(label, value)
            if error:
                return json_cors_response({"message": error}, status=400)
        if Owner.objects.filter(owner_id__iexact=owner_id).exists():
            return json_cors_response({"message": "An owner with this university ID already exists."}, status=409)
        role = data.get("role", "STUDENT").upper()
        if role not in {"STUDENT", "STAFF", "FACULTY", "VISITOR"}:
            return json_cors_response({"message": "Select a valid owner role."}, status=400)
        department, _ = Department.objects.get_or_create(name=department_name)
        owner = Owner(
            owner_id=owner_id,
            full_name=full_name,
            email=data.get("email", "").strip() or None,
            phone=data.get("phone", "").strip() or None,
            owner_type=role,
            department=department,
            photo=None,
            document=request.FILES.get("document"),
        )
        try:
            owner.save()
        except IntegrityError:
            return json_cors_response({"message": "An owner with this university ID already exists."}, status=409)
        if request.FILES.get("photo"):
            _save_uploaded_file(request.FILES["photo"], owner_id=owner.pk, kind="owner-photo")
        _broadcast_notification(
            title="New owner registered",
            message=f"{owner.full_name} ({owner.owner_id}) was added to the owner directory.",
            notification_type="info",
            link=f"/owners/{owner.pk}",
        )
        return json_cors_response(_serialize_owner(owner, request), status=201)

    if request.method != "GET":
        return json_cors_response({"message": "GET or POST required."}, status=405)
    owners = Owner.objects.select_related("department").all().order_by("full_name")
    return json_cors_response([_serialize_owner(owner, request) for owner in owners])


@csrf_exempt
@api_authenticated
def owner_detail_api(request, owner_id):
    preflight = handle_cors_preflight(request)
    if preflight:
        return preflight
    try:
        owner = Owner.objects.select_related("department").get(pk=owner_id)
    except Owner.DoesNotExist:
        return json_cors_response({"message": "Owner not found."}, status=404)

    if request.method == "PATCH":
        if request.api_user.role not in ("ADMIN", "SUPER_ADMIN", "MANAGER"):
            return json_cors_response({"message": "You do not have permission to update owners."}, status=403)

        if request.content_type and "multipart/form-data" in request.content_type:
            data = request.POST
            for key, label in (("fullName", "Owner full name"), ("department", "Department")):
                if key in data:
                    error = _text_only_error(label, data.get(key, "").strip())
                    if error:
                        return json_cors_response({"message": error}, status=400)
            if "fullName" in data:
                full_name = data.get("fullName", "").strip()
                if full_name:
                    owner.full_name = full_name
            if "email" in data:
                owner.email = data.get("email", "").strip() or None
            if "phone" in data:
                owner.phone = data.get("phone", "").strip() or None
            if "department" in data:
                department_name = data.get("department", "").strip()
                if department_name:
                    department, _ = Department.objects.get_or_create(name=department_name)
                    owner.department = department
            if "role" in data:
                role = data.get("role", "").upper()
                if role not in {"STUDENT", "STAFF", "FACULTY", "VISITOR", "EMPLOYEE"}:
                    return json_cors_response({"message": "Select a valid owner role."}, status=400)
                owner.owner_type = role
            if data.get("removePhoto") == "true":
                _delete_saved_file(owner_id=owner.pk, kind="owner-photo")
                if owner.photo:
                    owner.photo.delete(save=False)
                owner.photo = None
            if data.get("removeDocument") == "true":
                if owner.document:
                    owner.document.delete(save=False)
                owner.document = None
            if "photo" in request.FILES:
                _save_uploaded_file(request.FILES["photo"], owner_id=owner.pk, kind="owner-photo")
            if "document" in request.FILES:
                owner.document = request.FILES["document"]
            owner.save()
            return json_cors_response(_serialize_owner(owner, request))

        try:
            data = json.loads(request.body.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return json_cors_response({"message": "Invalid request body."}, status=400)

        for key, label in (("fullName", "Owner full name"), ("department", "Department")):
            if key in data:
                error = _text_only_error(label, data[key])
                if error:
                    return json_cors_response({"message": error}, status=400)
        if "fullName" in data:
            owner.full_name = str(data["fullName"]).strip() or owner.full_name
        if "email" in data:
            owner.email = data.get("email") or None
        if "phone" in data:
            owner.phone = data.get("phone") or None
        if "department" in data:
            department_name = str(data["department"]).strip()
            if department_name:
                department, _ = Department.objects.get_or_create(name=department_name)
                owner.department = department
        if "role" in data:
            role = str(data["role"]).upper()
            if role not in {"STUDENT", "STAFF", "FACULTY", "VISITOR", "EMPLOYEE"}:
                return json_cors_response({"message": "Select a valid owner role."}, status=400)
            owner.owner_type = role
        if "avatarUrl" in data and data["avatarUrl"] == "":
            _delete_saved_file(owner_id=owner.pk, kind="owner-photo")
            if owner.photo:
                owner.photo.delete(save=False)
            owner.photo = None
        if "documentUrl" in data and data["documentUrl"] == "":
            if owner.document:
                owner.document.delete(save=False)
            owner.document = None
        owner.save()
        return json_cors_response(_serialize_owner(owner, request))

    if request.method != "GET":
        return json_cors_response({"message": "GET required."}, status=405)
    return json_cors_response(_serialize_owner(owner, request))

@csrf_exempt
@api_authenticated
def verify_asset_api(request):
    preflight = handle_cors_preflight(request)
    if preflight: return preflight

    if request.method != "POST":
        return json_cors_response({"error": "POST required"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
        code = data.get("asset_code") or data.get("code", "")
        gate = data.get("gate") or "Main Gate"
    except Exception:
        code = request.POST.get("asset_code", "")
        gate = request.POST.get("gate") or "Main Gate"

    code = code.strip().upper()
    try:
        a = Asset.objects.select_related("category", "owner", "owner__department").get(asset_code=code)
    except Asset.DoesNotExist:
        try:
            a = Asset.objects.select_related("category", "owner", "owner__department").get(serial_number=code)
        except Asset.DoesNotExist:
            return json_cors_response({"message": f"Asset '{code}' not found in campus database."}, status=404)

    # Log verification
    log = VerificationLog.objects.create(
        asset=a,
        officer=request.api_user,
        verification_method="QR_CODE" if code.startswith("AST-") else "ASSET_CODE",
        result=a.status,
        remarks=f"Checkpoint scan at {gate}"
    )

    return json_cors_response({
        "asset": {
            "id": a.asset_code,
            "name": a.asset_name,
            "brand": a.category.name,
            "model": a.asset_name,
            "serial": a.serial_number,
            "category": a.category.name,
            "color": "Standard",
            "status": a.status,
            "ownerName": a.owner.full_name if a.owner else "Unassigned",
            "ownerMatric": a.owner.owner_id if a.owner else "N/A",
            "ownerAvatarUrl": _saved_file_url(owner_id=a.owner_id, request=request) if a.owner_id else "",
            "department": a.owner.department.name if a.owner and a.owner.department else "General Campus",
            "ownerPhone": a.owner.phone or "" if a.owner else "",
            "registeredBy": request.api_user.get_full_name(),
            "registeredByAvatarUrl": _saved_file_url(user_id=request.api_user.pk, request=request),
            "notes": "Verified by Security Terminal."
        },
        "log": {
            "id": f"vlog-{log.id}",
            "assetId": a.asset_code,
            "assetName": a.asset_name,
            "timestamp": log.verified_at.isoformat(),
            "gate": gate,
            "result": a.status,
            "officerName": request.api_user.get_full_name(),
            "officerId": f"SEC-{request.api_user.pk:05d}",
            "method": log.verification_method,
            "remarks": log.remarks or ""
        }
    })

@csrf_exempt
@api_authenticated
def verification_history_api(request):
    preflight = handle_cors_preflight(request)
    if preflight: return preflight

    logs = VerificationLog.objects.select_related("asset", "officer").all().order_by("-verified_at")[:100]
    result = []
    for l in logs:
        result.append({
            "id": f"vlog-{l.id}",
            "assetId": l.asset.asset_code,
            "assetName": l.asset.asset_name,
            "assetSerial": l.asset.serial_number,
            "ownerName": l.asset.owner.full_name if l.asset.owner else "Unassigned",
            "ownerId": l.asset.owner.owner_id if l.asset.owner else "N/A",
            "gate": (l.remarks or "").replace("Checkpoint scan at ", "") or "Unknown gate",
            "officerName": l.officer.get_full_name() if l.officer else "Unknown officer",
            "officerId": f"SEC-{l.officer_id:05d}" if l.officer_id else "N/A",
            "timestamp": l.verified_at.isoformat(),
            "result": l.result,
            "method": l.verification_method,
            "remarks": l.remarks or ""
        })
    return json_cors_response(result)

@csrf_exempt
@require_api_roles("ADMIN", "SUPER_ADMIN", "SECURITY")
def exit_pass_api(request):
    preflight = handle_cors_preflight(request)
    if preflight: return preflight

    if request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8"))
            asset_code = data.get("assetId")
            asset = Asset.objects.get(asset_code=asset_code)
            req = ExitRequest.objects.create(
                asset=asset,
                reason=data.get("reason", "Personal"),
                status="APPROVED",
                approved_at=timezone.now(),
                remarks=f"Gate Pass issued for {data.get('destination', 'Off-campus')}"
            )
            _broadcast_notification(
                title="Exit pass issued",
                message=f"An exit pass was issued for {asset.asset_name} ({asset.asset_code}).",
                notification_type="success",
                link="/verification",
            )
            return json_cors_response({
                "id": f"pass-{req.id}",
                "passCode": f"GP-2026-{str(req.id).zfill(6)}",
                "assetId": asset.asset_code,
                "assetName": asset.asset_name,
                "ownerName": asset.owner.full_name if asset.owner else "Unassigned",
                "universityId": asset.owner.owner_id if asset.owner else "N/A",
                "department": asset.owner.department.name if asset.owner and asset.owner.department else "General Campus",
                "gate": data.get("gate") or "Main Gate",
                "officerName": request.api_user.get_full_name() or request.api_user.email,
                "issuedAt": timezone.now().strftime("%d %b %Y %H:%M"),
                "status": "AUTHORIZED"
            }, status=201)
        except Exception as e:
            return json_cors_response({"error": str(e)}, status=400)

    return json_cors_response({"error": "Method not allowed"}, status=405)

@csrf_exempt
@api_authenticated
def reports_overview_api(request):
    preflight = handle_cors_preflight(request)
    if preflight: return preflight

    from django.db.models import Q
    today = timezone.localdate()
    assets = list(Asset.objects.select_related(
        "category", "owner", "owner__department", "registered_by"
    ).order_by("-created_at"))
    total_assets = len(assets)
    authorized = Asset.objects.filter(status="AUTHORIZED").count()
    lost = Asset.objects.filter(status="LOST").count()
    stolen = Asset.objects.filter(status="STOLEN").count()
    return json_cors_response({
        "totalRegisteredAssets": total_assets,
        "lostCount": lost,
        "stolenCount": stolen,
        "todayVerifications": VerificationLog.objects.filter(verified_at__date=today).count(),
        "successfulVerificationsToday": VerificationLog.objects.filter(
            verified_at__date=today, result__in=("AUTHORIZED", "APPROVED")
        ).count(),
        "authorizedCount": authorized,
        "flaggedCount": lost + stolen + Asset.objects.filter(status="UNDER_REVIEW").count(),
        "interceptions": VerificationLog.objects.filter(verified_at__date=today).filter(Q(result="STOLEN") | Q(result="LOST")).count(),
        "activeSecurityAccounts": User.objects.filter(is_active=True, role="SECURITY").count(),
        "ownerCount": Owner.objects.count(),
        "assets": [{
            "id": asset.asset_code,
            "name": asset.asset_name,
            "brand": asset.brand,
            "model": asset.model,
            "serial": asset.serial_number,
            "category": asset.category.name,
            "status": asset.status,
            "purchaseDate": asset.purchase_date.isoformat() if asset.purchase_date else "",
            "registrationDateTime": asset.created_at.isoformat(),
            "ownerName": asset.owner.full_name if asset.owner else "Unassigned",
            "ownerId": asset.owner.owner_id if asset.owner else "",
            "ownerPhone": asset.owner.phone or "" if asset.owner else "",
            "department": asset.owner.department.name if asset.owner and asset.owner.department else "",
            "registeredBy": asset.registered_by.get_full_name() if asset.registered_by else "",
            "notes": asset.notes,
            "photoUrl": request.build_absolute_uri(asset.image.url) if asset.image else "",
            "qrCodeUrl": request.build_absolute_uri(asset.qr_code.url) if asset.qr_code else "",
        } for asset in assets],
        "recentVerifications": [{
            "id": f"vlog-{log.id}", "assetId": log.asset.asset_code, "assetName": log.asset.asset_name,
            "assetSerial": log.asset.serial_number, "ownerName": log.asset.owner.full_name if log.asset.owner else "Unassigned",
            "ownerId": log.asset.owner.owner_id if log.asset.owner else "N/A",
            "gate": (log.remarks or "").replace("Checkpoint scan at ", "") or "Unknown gate",
            "officerName": log.officer.get_full_name() if log.officer else "Unknown officer",
            "officerId": f"SEC-{log.officer_id:05d}" if log.officer_id else "N/A",
            "timestamp": log.verified_at.isoformat(), "result": log.result,
            "method": log.verification_method, "remarks": log.remarks or ""
        } for log in VerificationLog.objects.select_related("asset", "asset__owner", "officer").order_by("-verified_at")[:5]]
    })


@csrf_exempt
@api_authenticated
def reports_export_api(request, file_format):
    preflight = handle_cors_preflight(request)
    if preflight:
        return preflight
    if request.method != "GET":
        return json_cors_response({"error": "Method not allowed"}, status=405)

    assets = list(Asset.objects.select_related(
        "category", "owner", "owner__department", "registered_by"
    ).order_by("asset_code"))
    logs = list(VerificationLog.objects.select_related(
        "asset", "officer"
    ).order_by("-verified_at"))

    if file_format == "csv":
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="campus-security-report.csv"'
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        writer = csv.writer(response)

        def write_row(values):
            writer.writerow([
                f"'{value}" if isinstance(value, str) and value.startswith(("=", "+", "-", "@", "\t", "\r"))
                else value
                for value in values
            ])

        write_row(["Campus Security System Report"])
        write_row(["Generated at", timezone.localtime().isoformat()])
        write_row([])
        write_row(["Summary"])
        write_row(["Metric", "Value"])
        write_row(["Total assets", len(assets)])
        write_row(["Authorized assets", sum(asset.status == "AUTHORIZED" for asset in assets)])
        write_row(["Lost assets", sum(asset.status == "LOST" for asset in assets)])
        write_row(["Stolen assets", sum(asset.status == "STOLEN" for asset in assets)])
        write_row(["Total verifications", len(logs)])
        write_row([])
        write_row(["Asset inventory"])
        asset_fields = [
            "Asset code", "Name", "Category", "Brand", "Model", "Serial number",
            "Status", "Purchase date", "Registered at", "Owner", "Owner ID",
            "Owner phone", "Department", "Registered by", "Notes", "Photo URL", "QR code URL",
        ]
        write_row(asset_fields)
        for asset in assets:
            write_row([
                asset.asset_code, asset.asset_name, asset.category.name, asset.brand,
                asset.model, asset.serial_number, asset.status,
                asset.purchase_date.isoformat() if asset.purchase_date else "",
                timezone.localtime(asset.created_at).isoformat(),
                asset.owner.full_name if asset.owner else "Unassigned",
                asset.owner.owner_id if asset.owner else "",
                asset.owner.phone or "" if asset.owner else "",
                asset.owner.department.name if asset.owner and asset.owner.department else "",
                asset.registered_by.get_full_name() if asset.registered_by else "",
                asset.notes,
                request.build_absolute_uri(asset.image.url) if asset.image else "",
                request.build_absolute_uri(asset.qr_code.url) if asset.qr_code else "",
            ])
        write_row([])
        write_row(["Verification history"])
        write_row(["Asset code", "Asset name", "Result", "Method", "Officer", "Verified at", "Remarks"])
        for log in logs:
            write_row([
                log.asset.asset_code, log.asset.asset_name, log.result,
                log.verification_method, log.officer.get_full_name() if log.officer else "",
                timezone.localtime(log.verified_at).isoformat(), log.remarks,
            ])
        return response

    if file_format == "pdf":
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A3, landscape
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import mm
        from reportlab.platypus import LongTable, Paragraph, SimpleDocTemplate, Spacer, TableStyle
        from xml.sax.saxutils import escape
        from io import BytesIO

        output = BytesIO()
        document = SimpleDocTemplate(
            output, pagesize=landscape(A3), rightMargin=10 * mm, leftMargin=10 * mm,
            topMargin=12 * mm, bottomMargin=12 * mm,
        )
        styles = getSampleStyleSheet()
        cell_style = ParagraphStyle("ReportCell", parent=styles["BodyText"], fontSize=6, leading=7)

        def cell(value):
            return Paragraph(escape(str(value or "")), cell_style)

        story = [
            Paragraph("Campus Security System Report", styles["Title"]),
            Paragraph(f"Generated {escape(timezone.localtime().strftime('%Y-%m-%d %H:%M'))}", styles["Normal"]),
            Spacer(1, 6 * mm),
            Paragraph("Summary", styles["Heading2"]),
        ]
        summary = [
            ["Total assets", str(len(assets)), "Authorized", str(sum(asset.status == "AUTHORIZED" for asset in assets)),
             "Lost", str(sum(asset.status == "LOST" for asset in assets)),
             "Stolen", str(sum(asset.status == "STOLEN" for asset in assets)),
             "Verifications", str(len(logs))],
        ]
        story.append(LongTable(summary, repeatRows=0, style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eef4fb")),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#b8c9dd")),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("PADDING", (0, 0), (-1, -1), 6),
        ])))
        story.extend([Spacer(1, 6 * mm), Paragraph("Complete asset inventory", styles["Heading2"])])
        inventory_headers = [
            "Asset code", "Name", "Category", "Brand", "Model", "Serial number",
            "Status", "Purchase date", "Registered at", "Owner", "Owner ID",
            "Phone", "Department", "Registered by", "Notes", "Photo URL", "QR code URL",
        ]
        inventory_rows = [[cell(value) for value in inventory_headers]]
        for asset in assets:
            inventory_rows.append([cell(value) for value in [
                asset.asset_code, asset.asset_name, asset.category.name, asset.brand,
                asset.model, asset.serial_number, asset.status,
                asset.purchase_date.isoformat() if asset.purchase_date else "",
                timezone.localtime(asset.created_at).strftime("%Y-%m-%d %H:%M"),
                asset.owner.full_name if asset.owner else "Unassigned",
                asset.owner.owner_id if asset.owner else "",
                asset.owner.phone or "" if asset.owner else "",
                asset.owner.department.name if asset.owner and asset.owner.department else "",
                asset.registered_by.get_full_name() if asset.registered_by else "",
                asset.notes,
                request.build_absolute_uri(asset.image.url) if asset.image else "",
                request.build_absolute_uri(asset.qr_code.url) if asset.qr_code else "",
            ]])
        story.append(LongTable(inventory_rows, repeatRows=1, style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17365f")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd7e5")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f8fc")]),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("FONTSIZE", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 3),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ])))

        story.extend([Spacer(1, 6 * mm), Paragraph("Complete verification history", styles["Heading2"])])
        verification_rows = [[cell(value) for value in [
            "Asset code", "Asset name", "Result", "Method", "Officer", "Verified at", "Remarks",
        ]]]
        for log in logs:
            verification_rows.append([cell(value) for value in [
                log.asset.asset_code, log.asset.asset_name, log.result, log.verification_method,
                log.officer.get_full_name() if log.officer else "",
                timezone.localtime(log.verified_at).strftime("%Y-%m-%d %H:%M"), log.remarks,
            ]])
        story.append(LongTable(verification_rows, repeatRows=1, style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17365f")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd7e5")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f8fc")]),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
        ])))
        document.build(story)
        response = HttpResponse(output.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="campus-security-report.pdf"'
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

    return json_cors_response({"error": "Format must be csv or pdf."}, status=400)


def _sql_store():
    from .sql_store import ensure_tables, SessionLocal
    ensure_tables()
    return SessionLocal


def _broadcast_notification(*, title, message, notification_type="info", link=""):
    from .sql_store import NotificationRecord

    user_ids = list(User.objects.filter(is_active=True).values_list("pk", flat=True))
    if not user_ids:
        return
    Session = _sql_store()
    with Session() as session:
        session.add_all([
            NotificationRecord(
                user_id=user_id,
                title=title,
                message=message,
                type=notification_type,
                read=False,
                link=link,
            )
            for user_id in user_ids
        ])
        session.commit()


def _incident_json(item):
    return {
        "id": str(item.id), "incidentNumber": item.incident_number, "title": item.title,
        "assetId": item.asset_id, "assetName": item.asset_name, "ownerName": item.owner_name,
        "universityId": item.university_id, "reportedAt": item.reported_at.isoformat(),
        "gate": item.gate, "reportingOfficer": item.reporting_officer,
        "severity": item.severity, "status": item.status, "description": item.description,
        "assignedInvestigator": item.assigned_investigator, "resolutionNotes": item.resolution_notes,
    }


@csrf_exempt
@api_authenticated
def incidents_api(request):
    preflight = handle_cors_preflight(request)
    if preflight: return preflight
    from sqlalchemy import select, func
    from .sql_store import IncidentRecord
    Session = _sql_store()
    with Session() as session:
        if request.method == "GET":
            rows = session.scalars(select(IncidentRecord).order_by(IncidentRecord.reported_at.desc())).all()
            return json_cors_response([_incident_json(row) for row in rows])
        if request.method != "POST":
            return json_cors_response({"message": "GET or POST required."}, status=405)
        try:
            data = json.loads(request.body.decode("utf-8"))
            title = str(data.get("title", "")).strip()
            if not title:
                return json_cors_response({"message": "Incident title is required."}, status=400)
            sequence = session.scalar(select(func.count()).select_from(IncidentRecord)) + 1
            now = timezone.now()
            row = IncidentRecord(
                incident_number=f"INC-{now.year}-{sequence:04d}", title=title,
                asset_id=str(data.get("assetId", "")), asset_name=str(data.get("assetName", "")),
                owner_name=str(data.get("ownerName", "")), university_id=str(data.get("universityId", "")),
                gate=str(data.get("gate", "Main Gate")), reporting_officer=str(data.get("reportingOfficer", "")),
                severity=str(data.get("severity", "LOW")).upper(), status="OPEN",
                description=str(data.get("description", "")),
                assigned_investigator=str(data.get("assignedInvestigator", "")),
                resolution_notes=str(data.get("resolutionNotes", "")), created_by_user_id=request.api_user.pk,
            )
            session.add(row); session.commit(); session.refresh(row)
            _broadcast_notification(
                title="New incident reported",
                message=f"{row.title} ({row.incident_number}) was reported.",
                notification_type="warning" if row.severity in ("HIGH", "CRITICAL") else "info",
                link="/incidents",
            )
            return json_cors_response(_incident_json(row), status=201)
        except (ValueError, UnicodeDecodeError):
            return json_cors_response({"message": "Invalid request body."}, status=400)


@csrf_exempt
@api_authenticated
def incident_detail_api(request, incident_id):
    preflight = handle_cors_preflight(request)
    if preflight: return preflight
    from .sql_store import IncidentRecord
    Session = _sql_store()
    with Session() as session:
        row = session.get(IncidentRecord, incident_id)
        if not row: return json_cors_response({"message": "Incident not found."}, status=404)
        if request.method not in ("PATCH", "PUT"):
            return json_cors_response({"message": "PATCH required."}, status=405)
        try: data = json.loads(request.body.decode("utf-8"))
        except (ValueError, UnicodeDecodeError): return json_cors_response({"message": "Invalid request body."}, status=400)
        for key, attr in (("status", "status"), ("severity", "severity"), ("assignedInvestigator", "assigned_investigator"), ("resolutionNotes", "resolution_notes")):
            if key in data: setattr(row, attr, str(data[key]).upper() if key in ("status", "severity") else str(data[key]))
        session.commit(); session.refresh(row)
        return json_cors_response(_incident_json(row))


@csrf_exempt
@api_authenticated
def user_settings_api(request):
    preflight = handle_cors_preflight(request)
    if preflight: return preflight
    from .sql_store import UserSettingsRecord
    Session = _sql_store()
    with Session() as session:
        row = session.get(UserSettingsRecord, request.api_user.pk)
        if request.method == "GET":
            return json_cors_response(row.payload if row else {})
        if request.method not in ("PUT", "PATCH", "POST"):
            return json_cors_response({"message": "GET or PUT required."}, status=405)
        try: data = json.loads(request.body.decode("utf-8"))
        except (ValueError, UnicodeDecodeError): return json_cors_response({"message": "Invalid request body."}, status=400)
        payload = {**(row.payload if row else {}), **data}
        if row: row.payload = payload
        else: session.add(UserSettingsRecord(user_id=request.api_user.pk, payload=payload))
        session.commit()
        return json_cors_response(payload)


def _notification_json(row):
    from django.utils.timesince import timesince
    created = row.created_at
    if timezone.is_naive(created): created = timezone.make_aware(created)
    return {"id": str(row.id), "title": row.title, "message": row.message,
            "timestamp": created.isoformat(), "timeAgo": timesince(created, timezone.now()) + " ago",
            "type": row.type, "read": row.read, "link": row.link or None}


@csrf_exempt
@api_authenticated
def notifications_api(request):
    preflight = handle_cors_preflight(request)
    if preflight: return preflight
    from sqlalchemy import select
    from .sql_store import NotificationRecord
    Session = _sql_store()
    with Session() as session:
        if request.method == "GET":
            rows = session.scalars(select(NotificationRecord).where(NotificationRecord.user_id == request.api_user.pk).order_by(NotificationRecord.created_at.desc()).limit(100)).all()
            return json_cors_response([_notification_json(row) for row in rows])
        if request.method != "POST": return json_cors_response({"message": "GET or POST required."}, status=405)
        try: data = json.loads(request.body.decode("utf-8"))
        except (ValueError, UnicodeDecodeError): return json_cors_response({"message": "Invalid request body."}, status=400)
        row = NotificationRecord(user_id=request.api_user.pk, title=str(data.get("title", "")), message=str(data.get("message", "")), type=str(data.get("type", "info")), link=str(data.get("link", "")))
        session.add(row); session.commit(); session.refresh(row)
        return json_cors_response(_notification_json(row), status=201)


@csrf_exempt
@api_authenticated
def notification_detail_api(request, notification_id):
    preflight = handle_cors_preflight(request)
    if preflight: return preflight
    from .sql_store import NotificationRecord
    Session = _sql_store()
    with Session() as session:
        row = session.get(NotificationRecord, notification_id)
        if not row or row.user_id != request.api_user.pk: return json_cors_response({"message": "Notification not found."}, status=404)
        if request.method != "PATCH": return json_cors_response({"message": "PATCH required."}, status=405)
        try: data = json.loads(request.body.decode("utf-8"))
        except (ValueError, UnicodeDecodeError): return json_cors_response({"message": "Invalid request body."}, status=400)
        row.read = bool(data.get("read", True)); session.commit(); session.refresh(row)
        return json_cors_response(_notification_json(row))


@csrf_exempt
@api_authenticated
def gates_api(request):
    preflight = handle_cors_preflight(request)
    if preflight: return preflight
    from sqlalchemy import select
    from .sql_store import GateRecord
    Session = _sql_store()
    with Session() as session:
        gates = session.scalars(select(GateRecord).where(GateRecord.active.is_(True)).order_by(GateRecord.name)).all()
    result = []
    for gate in gates:
        scans = VerificationLog.objects.filter(remarks__icontains=gate.name).count()
        result.append({"id": str(gate.id), "name": gate.name, "status": gate.status, "todayScans": VerificationLog.objects.filter(remarks__icontains=gate.name, verified_at__date=timezone.localdate()).count(), "peopleEntering": 0, "peopleExiting": 0, "activeAlerts": 0})
    return json_cors_response(result)


@csrf_exempt
@api_authenticated
def lookup_data_api(request):
    preflight = handle_cors_preflight(request)
    if preflight:
        return preflight
    if request.method != "GET":
        return json_cors_response({"message": "GET required."}, status=405)
    from sqlalchemy import select
    from .sql_store import GateRecord
    Session = _sql_store()
    with Session() as session:
        gates = session.scalars(select(GateRecord.name).where(GateRecord.active.is_(True)).order_by(GateRecord.name)).all()
    return json_cors_response({
        "assetCategories": list(AssetCategory.objects.order_by("name").values_list("name", flat=True)),
        "departments": list(Department.objects.order_by("name").values_list("name", flat=True)),
        "gates": list(gates),
    })


@csrf_exempt
@api_authenticated
def stored_file_api(request, file_id):
    preflight = handle_cors_preflight(request)
    if preflight:
        return preflight
    if request.method != "GET":
        return json_cors_response({"message": "GET required."}, status=405)
    from .sql_store import StoredFile
    Session = _sql_store()
    with Session() as session:
        row = session.get(StoredFile, file_id)
        if not row or (row.user_id and row.user_id != request.api_user.pk):
            return json_cors_response({"message": "File not found."}, status=404)
        response = HttpResponse(row.content, content_type=row.mime_type)
        response["Content-Disposition"] = f'inline; filename="{row.file_name.replace(chr(34), "")}"'
        response["Cache-Control"] = "private, max-age=300"
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        return response
