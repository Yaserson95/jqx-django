from django.shortcuts import render, get_object_or_404
from django.http.response import JsonResponse
from .utils import get_filter_type, flatten_serializer_fields

from .serializers import ProductSerializer

TYPE_MAPPINGS = {
    'CharField': 'string',
    'DecimalField': 'number',
    'BooleanField': 'boolean',
    'DateTimeField': 'date',
    'IntegerField': 'number',
    'TextField': 'string'
}

def grid_config(request):
    serializer = ProductSerializer()
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

    return JsonResponse(config)
def grid_view(request):
    return render(request, 'products/grid.html')