from django.core.exceptions import FieldDoesNotExist

def model_field_exists(cls, field):
    try:
        cls._meta.get_field(field)
        return True
    except FieldDoesNotExist:
        return False

