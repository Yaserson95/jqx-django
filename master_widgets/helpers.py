from django.core.exceptions import FieldDoesNotExist
from django.db.models import F
from rest_framework.serializers import BaseSerializer
from .exceptions import ValidateOptionsException

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

