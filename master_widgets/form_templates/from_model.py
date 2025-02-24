from django.db import models as dm
from .validators import get_validators

#'text', 'option', 'blank', 'button', 'color', 'number', 'boolean', 'password', 'label', 'time', 'date', 'datetime', 'custom'. 
BASE_FIELD_TYPES = {
    'label': dm.AutoField,
    'text': (dm.CharField, dm.UUIDField),
    'textarea': dm.TextField,
    'number': (dm.IntegerField, dm.FloatField,),
    'date': dm.DateField,
    'datetime': dm.DateTimeField,
    'time': dm.TimeField,
    'boolean': dm.BooleanField
}

def to_template_item(field: dm.Field):
    field_type = get_field_type(field)
    item = {
        'type': field_type,
        'bind': field.name,
        'label': field.verbose_name,
        'required': not field.null or not field.blank,
        'validators': get_validators(field.validators)
    }

    if field.is_relation and isinstance(field, dm.ForeignKey):
        item.update(to_foreign_field(field, item['required']))

    if field.choices:
        item.update(to_choices_field(field, item['required']))

    if isinstance(field, dm.ManyToManyField):
        item['hidden'] = True

    match field_type:
        case 'text':
            item.update(to_text_field(field))
        case 'label':
            item['required'] = False

    if isinstance(field, dm.TextField):
        item['component'] = 'jqxTextArea'
    
    return item

def to_text_field(field: dm.CharField):        
    item = {
        'length': getattr(field, 'max_length', 255)
    }
    return item



def to_choices_field(field:dm.Field, is_required: bool = False):
    options = [{'value':opt[0], 'label':opt[1]} for opt in field.choices]
    return to_options(options, is_required)

def to_foreign_field(field:dm.Field, is_required: bool = False):
    relation_queryset = field.related_model.objects.all()
    options = [{'value': item.pk, 'label': str(item)} for item in relation_queryset]
    return to_options(options, is_required)

def to_options(options: list, is_required: bool = False):
    if not is_required:
        options.insert(0, {'value': None, 'label': '----------------'})
    return {
        'type': 'option',
        'component': 'jqxDropDownList',
        'options': options,
    }

def get_field_type(field:dm.Field):
    for type_name in BASE_FIELD_TYPES:
        if isinstance(field, BASE_FIELD_TYPES[type_name]):
            return type_name
    return 'custom'

def from_model(model:dm.Model, extra_fields:dict = {}) -> list:
    template = []

    for field in model._meta.get_fields():
        if isinstance(field, dm.ManyToOneRel):
            continue

        temp = to_template_item(field)
        if field.name in extra_fields:
            temp.update(extra_fields[field.name])
        template.append(temp)
    return template