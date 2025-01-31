from rest_framework import serializers
def get_filter_type(field):
    if isinstance(field, serializers.BooleanField):
        return 'checkbox'
    elif isinstance(field, serializers.DecimalField):
        return 'number'
    elif isinstance(field, serializers.ChoiceField):
        return 'list'
    return 'text'

def flatten_serializer_fields(serializer, prefix=''):
    fields = {}
    for field_name, field in serializer.get_fields().items():
        if isinstance(field, serializers.BaseSerializer):
            nested_fields = flatten_serializer_fields(field, f"{prefix}{field_name}__")
            fields.update(nested_fields)
        else:
            fields[f"{prefix}{field_name}"] = field
    return fields

def flatten_data_object(data: dict, parent_key: str = '', separator: str = '__') -> dict:
    items = {}
    for key, value in data.items():
        new_key = f"{parent_key}{separator}{key}" if parent_key else key
        
        if isinstance(value, dict):
            items.update(flatten_data_object(value, new_key, separator))
        elif isinstance(value, list):
            for i, item in enumerate(value):
                items.update(flatten_data_object(
                    item, 
                    f"{new_key}{separator}{i}", 
                    separator
                ))
        else:
            items[new_key] = value
            
    return items