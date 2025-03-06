from django.core.exceptions import FieldDoesNotExist
from django.db import models
from django.forms import ValidationError
from rest_framework.serializers import BaseSerializer
from .exceptions import ValidateOptionsException

FIELD_FILTERS = [
    ((models.IntegerField, models.DecimalField, models.DateTimeField, models.DateField), ["gt", "gte", "lt", "lte"],),
    ((models.CharField, models.TextField, models.SlugField, models.UUIDField), ["icontains", "istartswith", "iendswith", "regex", "iregex"],),
]

def model_field_exists(cls, field):
    try:
        cls._meta.get_field(field)
        return True
    except FieldDoesNotExist:
        return False


def expr(field):
    if type(field) ==str:
        return models.F(field)
    return field

def validate_options_type(option, name:str, required_type):
    if type(required_type) == tuple:
        mes = ', '.join(tp.__name__ for tp in required_type)
    else:
        mes = required_type.__name__

    if not isinstance(option, required_type):
        raise ValidateOptionsException('Option %s must be %s type(s)' % (name, mes))

def validate_options(options: dict, validators:dict)->dict:
    for key in validators:
        if key not in options:
            if 'default' in validators[key]:
                options[key] = validators[key]['default']
            elif validators[key].get('required', True):
                raise ValidateOptionsException('Option %s is required' % key)
            else: continue

        validate_options_type(options[key], key, validators[key]['type'])
    return options

def in_children(instance, value, field:str = 'parent')->bool:
    if instance.pk == value:
        return True
    
    children = type(instance).objects.filter(**{field: instance})
    for cld in children:
        if in_children(cld, value, field):
            return True
        
    return False

def get_field_filters(field: models.Field)->list:
    field_filters = ['exact',]
    for field_opt in FIELD_FILTERS:
        if(isinstance(field, field_opt[0])):
            return field_filters + field_opt[1]
    
    return field_filters