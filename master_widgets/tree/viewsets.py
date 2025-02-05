from django.db.models import QuerySet, Value, F 
from django.http.response import Http404
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import action

from ..helpers import model_field_exists

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
        parent = self.get_parent()

        qs = qs.filter(**{self.parent_field: parent})

        if self.action != 'list':
            return qs
        
        qs = self.update_queryset(qs, 
            getattr(self, 'value_field'), 
            getattr(self, 'label_field')
        )
        if not hasattr(self, 'children_nodes') or parent is None:
            return qs
        
        qs = qs.order_by()
        for i in range(0, len(self.children_nodes)):
            qs = qs.union(self.get_childeren_queryset(i, parent).order_by())
        
        return super().filter_queryset(qs)
    
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
        
        return self.update_queryset(qs, value_field, label_field, parent_field, index + 1)\
            .filter(parent=parent.pk)
        
    def update_queryset(self, qs:QuerySet, value_field:str, label_field:str, parent_field: str = F('parent'), index:int=0):
        if value_field is None or label_field is None:
            raise Exception('Parametres "value_field" or "label_field" is not defined')   

        annotations = {
            'label': label_field,
            'value': value_field,
            'parent': parent_field,
            'item_type': Value(index),
        }

        # Добавляем аннотации только для тех полей, которых нет в модели
        annotations_to_add = {k: v for k, v in annotations.items() if not model_field_exists(qs.model, k)}

        return qs.annotate(**annotations_to_add).values(*annotations.keys())
    
    def get_serializer(self, *args, **kwargs):
        if self.action == 'list':
            return TreeItemsData(*args)
        return super().get_serializer(*args, **kwargs)
    
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
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