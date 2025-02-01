from rest_framework import serializers

TYPE_MAPPINGS = {
    'CharField': 'string',
    'DecimalField': 'number',
    'BooleanField': 'boolean',
    'DateTimeField': 'date',
    'IntegerField': 'number',
    'TextField': 'string'
}

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

def jqx_grid_config(serializer)->dict:
    flat_fields = flatten_serializer_fields(serializer)
    config = {
        'columns': [],
        'sorting': {'default': '-created_at'},
        'pagination': {'defaultPageSize': 20}
    }

    for field_name, field in flat_fields.items():
        column_config = {
            'dataField': field_name,
            'label': field.label or field_name.replace('__', ' ').capitalize(),
            'dataType': TYPE_MAPPINGS.get(field.__class__.__name__, 'string'),
            'visible': True,
            'editable': not field.read_only,
            'filter': {'enabled': True, 'type': get_filter_type(field)}
        }

        if hasattr(serializer.Meta, 'grid_config'):
            column_config.update(
                serializer.Meta.grid_config.get(field_name, {})
            )

        config['columns'].append(column_config)
    
    return config