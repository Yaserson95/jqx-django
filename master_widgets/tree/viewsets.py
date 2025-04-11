from django.db.models import QuerySet, Value, F, OuterRef, Exists, Case, When
from django.db.models.expressions import Combinable
from django.db.models.functions import Concat
from django.http.response import Http404
from rest_framework.viewsets import ReadOnlyModelViewSet
import re

from ..helpers import model_field_exists
from .serializers import TreeSerializer

CHILDREN_TYPE_PATTERNS = {
    'queryset': {'type': QuerySet,},
    'value': {'type': (str, Combinable,), 'default': 'pk'},
    'label': {'type': (str, Combinable,), },
    'parent': {'type': str, 'default': 'parent'},
    'name': {'type': str, 'required': False},
    'verbose_name': {'type': str, 'required': False},
    'extra': {'type':dict, 'required': False},
}


ITEM_REGEX = r'\{\{\s*(?P<val>\w+)\s*\}\}'

class TreeItemsData:
    data: list
    def __init__(self, data:list):
        self.data = data

class MasterTreeViewSet(ReadOnlyModelViewSet):
    template: list
    main_type: int = 0
    default_parent = None
    parent_lookup = 'parent'
    serializer_class = TreeSerializer
    search_fields = ['label']
    queryset = None
    _parent_obj = None
    

    def get_queryset(self):        
        if self.queryset: return self.queryset
        querysets = []
        for item in self.template:
            value_expr = item.get('value', None)
            if value_expr is None:
                value_expr = F('pk')
            querysets.append({
                'qs': item['queryset'],
                'label_expr': MasterTreeViewSet.get_item_expression(item['label']),
                'value_expr': MasterTreeViewSet.get_item_expression(value_expr),
                'parent_expr': F(item.get('parent', 'parent'))
            })
        return querysets

    def filter_queryset(self, querysets: list[QuerySet]):
        qs:QuerySet|None = None
        parent = self.get_parent()
        self.is_serach = bool(self.request.GET.get('search', None))

        if self.action != 'list':
            item_type = int(self.request.GET.get('type', self.main_type))
            self.queryset = querysets[item_type]['qs']
            return self.queryset

        if parent is None and not self.is_serach:
            qs = self.get_item_queryset(querysets[self.main_type], self.main_type, parent)
        else:
            for i, item in enumerate(querysets):
                item_qs = self.get_item_queryset(item, i, parent)
                if qs is not None:
                    qs = qs.union(item_qs)
                else: qs = item_qs

        self.queryset = self.apply_backend_filter('OrderingFilter', qs)
        self.filter_backends = []
        return self.queryset
    
    def get_serializer(self, *args, **kwargs):
        if self.action == 'list':
            return TreeItemsData(*args)
        return super().get_serializer(*args, **kwargs)
    
    def get_serializer_class(self):
        item_type = int(self.request.GET.get('type', self.main_type))
        try:
            return self.template[item_type]['serializer']
        except:
            raise Http404
    
    def get_item_queryset(self, qs_item:dict, obj_type:int, parent)->QuerySet:
        if obj_type == self.main_type:
            has_items = self.has_items_queryset()
        else:
            has_items = Value(False)

        annotations = {
            'label': qs_item['label_expr'],
            'value': qs_item['value_expr'],
            'parent': qs_item['parent_expr'],
            'has_items': has_items,
            'type': Value(obj_type),
        }
        annotations_to_add = {k: v for k, v in annotations.items() if not model_field_exists(qs_item['qs'].model, k)}
        qs:QuerySet = qs_item['qs']\
            .annotate(**annotations_to_add)
        
        if not self.is_serach:
            qs = qs.filter(**{self.template[obj_type].get('parent', 'parent'): parent})
        
        qs = self.apply_backend_filters(qs, ['OrderingFilter'])
        return qs.values(*annotations.keys()).order_by()

    def apply_backend_filter(self, name: str, qs: QuerySet)->QuerySet:
        for flt in self.filter_backends:
            if flt.__name__ == name:
                qs = flt().filter_queryset(self.request, qs, self)
                break
        return qs
    
    def apply_backend_filters(self, qs:QuerySet, ignored:list=[])->QuerySet:
        for flt in self.filter_backends:
            if flt.__name__ in ignored:
                continue
            qs = flt().filter_queryset(self.request, qs, self)
        return qs
    
    def get_parent(self):
        parent_id = self.request.GET.get(self.parent_lookup, self.default_parent)
        qs:QuerySet = self.template[self.main_type]['queryset']

        if parent_id is None:  return None
        if self._parent_obj is None:
            try:
                self._parent_obj = qs.get(pk=parent_id)        
            except qs.model.DoesNotExists:
                raise Http404
        return self._parent_obj
    
    def has_items_queryset(self):
        cases = []
        for item in self.template:
            parent_field = item.get('parent', 'parent')
            cld_expr = Exists(item.get('queryset').filter(**{parent_field:OuterRef('pk')}))
            cases.append(When(cld_expr, then=True))
        return Case(*cases, default=False)
    
    def options(self, request, *args, **kwargs):
        responce = super().options(request, *args, **kwargs)
        responce.data['items'] = [self.get_model_info(item, i) for i, item in enumerate(self.template)]
        return responce
    
    def get_model_info(self, item:list, item_type:int):
        model = item['queryset'].model

        info = {
            'class_name': model.__name__,
            'type': item_type,
            'name': model._meta.verbose_name,
            'plural_name': model._meta.verbose_name_plural,
            'parent': item.get('parent', 'parent'),
            'id': model._meta.pk.name
        }

        if item['extra'] is not None:
            item['extra'].update(info)
            return item['extra']
        return info
    
    def list(self, request, *args, **kwargs):
        responce = super().list(request, *args, **kwargs)
        responce.data['node'] = self.request.GET.get('node', None)
        return responce

    @classmethod
    def get_item_template(cls, labet_template:str)->list:
        return re.split(ITEM_REGEX, labet_template)
    
    @classmethod
    def template2expression(cls, template:list)->str:
        args = []
        for i, s in enumerate(template):
            if i%2 !=0: args.append(F(s))
            else: args.append(Value(s))
        
        if len(args) == 1: return args[0]
        return Concat(*args)
    
    @classmethod
    def get_item_expression(cls, template:str|Combinable)->Combinable:
        if(isinstance(template, Combinable)):
            return template
        
        return cls.template2expression(cls.get_item_template(template))
    
    class Meta:
        abstract = True