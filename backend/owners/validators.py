import unicodedata

from django.core.exceptions import ValidationError


def is_text_only(value):
    if value is None:
        return True

    has_letter = False
    for character in value:
        if character.isspace():
            continue
        category = unicodedata.category(character)
        if category.startswith(("L", "M")):
            has_letter = True
        elif not category.startswith("P") or character == "_":
            return False

    return not value.strip() or has_letter


def validate_text_content(value):
    if not is_text_only(value):
        raise ValidationError("Use letters, spaces, and punctuation only.")


validate_text_only = validate_text_content