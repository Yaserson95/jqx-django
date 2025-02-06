from django.db.models import QuerySet, Value, F, OuterRef, Exists, Case, When
from django.http.response import Http404
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.request import Request

from ..helpers import model_field_exists, expr

CHILDREN_TYPE_PATTERNS = {
    'queryset': {
        'type': QuerySet,
        'message': "The 'queryset' must be a valid Django QuerySet."
    },
    'value': {
        'type': str,
        'message': "The 'value' must be a string."
    },
    'label': {
        'type': str,
        'message': "The 'label' must be a string."
    },
    'parent': {
        'type': str,
        'message': "The 'parent' must be a string.",
        'default': 'parent'
    }
}

class TreeItemsData:
    data: list
    def __init__(self, data:list):
        self.data = data

class MasterTreeViewSet(ModelViewSet):
    children_nodes: list

    parent_lookup: str = 'parent'
    parent_field: str = 'parent'
    pqrent_node: object

    label_field: str
    value_field: str = F('id')

    class Meta:
        abstract = True

    def filter_queryset(self, qs: QuerySet):
        if self.action == 'list':
            qs = self.list_queryset(qs, self.get_parent())

        return super().filter_queryset(qs)
    
    def list_queryset(self, qs:QuerySet, parent=None):
        qs = qs.filter(**{self.parent_field: parent})     
        qs = self.update_queryset(qs, 
            value_field=getattr(self, 'value_field'), 
            label_field=getattr(self, 'label_field'),
            has_items=self.has_items_queryset()
        )
        if not hasattr(self, 'children_nodes') or parent is None:
            return qs
        
        qs = qs.order_by()
        for i in range(0, len(self.children_nodes)):
            qs = qs.union(self.get_childeren_queryset(i, parent).order_by())
        return qs
    
    def has_items_queryset(self):
        cases = [
            When(Exists(self.get_queryset().filter(**{self.parent_field:OuterRef('pk')})), then=1)
        ]

        if(hasattr(self, 'children_nodes')):
            for item in self.children_nodes:
                parent_field = item.get('parent')
                cld_qs = Exists(item.get('queryset').filter(**{parent_field:OuterRef('pk')}))
                cases.append(When(cld_qs, then=1))
        return Case(*cases, default=0)
    
    def get_childeren_queryset(self, index: int, parent = None)->QuerySet:
        node = self.children_nodes[index]
        qs = node.get('queryset')
        value_field = node.get('value', 'id')
        label_field = node.get('label')
        parent_field = node.get('parent')

        if qs is None:
            raise Exception('children queryset is not defined')
        if value_field is None:
            raise Exception('children queryset value field not defined')
        if label_field is None:
            raise Exception('children queryset lebel field not defined')
        
        return self.update_queryset(qs, 
                value_field=value_field, 
                label_field=label_field, 
                parent_field=parent_field, 
                index=index + 1
        ).filter(parent=parent.pk)
        
    def update_queryset(self, qs:QuerySet, value_field:str, label_field:str, parent_field: str = 'parent', has_items=Value(False), index:int=0):
        if value_field is None or label_field is None:
            raise Exception('Parametres "value_field" or "label_field" is not defined')
        
        annotations = {
            'label': expr(label_field),
            'value': expr(value_field),
            'parent': expr(parent_field),
            'item_type': Value(index),
            'has_items':has_items
        }

        # Добавляем аннотации только для тех полей, которых нет в модели
        annotations_to_add = {k: v for k, v in annotations.items() if not model_field_exists(qs.model, k)}
        return qs.annotate(**annotations_to_add).values(*annotations.keys())
    
    def get_serializer(self, *args, **kwargs):
        if self.action == 'list':
            return TreeItemsData(*args)
        return super().get_serializer(*args, **kwargs)
    def get_serializer_class(self):
        item_type = int(self.request.GET.get('item_type', 0))
        if hasattr(self, 'children_nodes') and item_type > 0:
            try:
                return self.children_nodes[item_type - 1]['serializer']
            except:
                raise Http404
            
        return super().get_serializer_class()
    
    def list(self, request:Request, *args, **kwargs)->Response:
        responce = super().list(request, *args, **kwargs)
        responce.data['item_id'] = self.request.GET.get('item_id', None)
        return responce
    
    def options(self, request, *args, **kwargs)->Response:
        responce = super().options(request, *args, **kwargs)
        responce.data['item_types'] = self.get_item_types()
        return responce
    
    def get_item_types(self):
        types = [self.get_model_info(self.get_queryset().model, 0)]
        if not hasattr(self, 'children_nodes'):
            return types
        
        for i, e in enumerate(self.children_nodes):
            types.append(self.get_model_info(e['queryset'].model, i+1))

        return types
    
    def get_model_info(self, model, index=0):
        return {
            'className': model.__name__,
            'type': index,
            'name': model._meta.verbose_name,
            'plural_name': model._meta.verbose_name_plural
        }
    
    def get_parent(self):
        if hasattr(self, 'pqrent_node'):
            return self.pqrent_node
        
        parent_id = self.request.GET.get(self.parent_lookup, None)
        if parent_id is None:
            return None
        try:
            self.pqrent_node = self.queryset.get(pk=parent_id)
            return self.pqrent_node
        except self.queryset.model.DoesNotExists:
            raise Http404
        
    def validate_children_nodes(self):
        for node, i in enumerate(self.children_nodes):
            for pattern in CHILDREN_TYPE_PATTERNS[node]:
                if pattern not in node:
                    if 'default' in pattern:
                        self.children_nodes[i][pattern] = CHILDREN_TYPE_PATTERNS[node]