from django.core.exceptions import FieldDoesNotExist
from django.db.models import Model, F

def model_field_exists(cls, field):
    try:
        cls._meta.get_field(field)
        return True
    except FieldDoesNotExist:
        return False


def expr(field):
    if type(field) ==str:
        return F(field)
    return field

def get_relation_field(model:Model, related_model):
    model._meta.related_objects
