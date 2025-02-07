from django.db import models as dm

#'text', 'option', 'blank', 'button', 'color', 'number', 'boolean', 'password', 'label', 'time', 'date', 'datetime', 'custom'. 
BASE_FIELD_TYPES = {
    'label': dm.AutoField,
    'text': (dm.CharField, dm.UUIDField,),
    'number': (dm.IntegerField, dm.FloatField,),
    'date': dm.DateField,
    'datetime': dm.DateTimeField,
    'time': dm.TimeField,
    'boolean': dm.BooleanField
}

def to_template_item(field: dm.Field):
    item = {
        'type': get_field_type(field),
        'bind': field.name,
        'label': field.verbose_name,
        'required': field.null
    }

    if field.is_relation and isinstance(field, dm.ForeignKey):
        item.update(to_foreign_field(field))

    if field.choices:
        item.update(to_choices_field(field))

    return item

def to_choices_field(field:dm.Field):
    return {
        'type': 'option',
        'component': 'jqxDropDownList',
        'options': [{'value':opt[0], 'label':opt[1]} for opt in field.choices],
    }

def to_foreign_field(field:dm.Field):
    relation_queryset = field.related_model.objects.all()
    return {
        'type': 'option',
        'component': 'jqxDropDownList',
        'options': [{'value': item.pk, 'label': str(item)} for item in relation_queryset],
    }

def get_field_type(field:dm.Field):
    for type_name in BASE_FIELD_TYPES:
        if isinstance(field, BASE_FIELD_TYPES[type_name]):
            return type_name
    return 'custom'

def from_model(model) -> list:
    fields = model._meta.fields
    template = []

    for field in fields:
        template.append(to_template_item(field))

    return template