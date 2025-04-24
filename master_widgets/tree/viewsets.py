from django.db.models import QuerySet, Value, F, OuterRef, Exists, Case, When
from django.db.models.expressions import Combinable
from django.db.models.functions import Concat
from django.http.response import Http404
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.serializers import SerializerMetaclass

import re

from ..helpers import model_field_exists, validate_options
from .serializers import TreeSerializer

CHILDREN_TYPE_PATTERNS = {
    'queryset': {'type': QuerySet,},
    'value': {'type': str, 'default': 'pk'},
    'label': {'type': (str, F), },
    'parent': {'type': str, 'default': 'parent'},
    'serializer': {'type': SerializerMetaclass,},
    'extra': {'type':dict, 'required': False},
}

ITEM_REGEX = r'\{\{\s*(?P<val>\w+)\s*\}\}'

class TreeItemsData:
    data: list
    def __init__(self, data:list):
        self.data = data

class MasterTreeViewSet(ReadOnlyModelViewSet):
    main_type: int = 0
    default_parent = None
    parent_lookup = 'parent'
    search_fields = ['label']
    template: list

    _parent = None
    _queryset = None

    @property
    def queryset(self)->QuerySet:
        if self._queryset is not None:
            return self._queryset
        
        if self.is_common:
            self._queryset = self.make_queryset()
        else:
            self._queryset = self.template[self.item_type]['queryset']
        return self._queryset
    
    @property
    def item_type(self)->int:
        if self.parent is None:
            return self.main_type
        return int(self.request.GET.get('type', self.main_type))
    
    @property
    def is_common(self)->bool:
        if self.action == 'retrieve' or self.parent is None:
            return False
        
        item_type = self.request.GET.get('type', None)
        return item_type is None
    
    @property
    def is_search(self)->bool:
        return bool(self.request.GET.get('search', None))
    
    @property
    def serializer_class(self):
        if self.is_common and self.action != 'retrieve':
            return TreeSerializer
        else: return self.template[self.item_type]['serializer']

    @property
    def parent(self):
        if self._parent is None:
            parent_id = self.request.GET.get(self.parent_lookup, self.default_parent)
            if parent_id is None: return None
            try:
                qs:QuerySet = self.template[self.main_type]['queryset']
                self._parent = qs.get(pk=parent_id)        
            except qs.model.DoesNotExist:
                raise Http404
                
        return self._parent
    
    def __init__(self, **kwargs):
        for i in range(0, len(self.template)):
            self.template[i] = validate_options(self.template[i], CHILDREN_TYPE_PATTERNS)
            self.template[i]['serializer'] = TreeSerializer.update_serializer(self.template[i]['serializer'])
        super().__init__(**kwargs)
           
    def filter_queryset(self, queryset):
        
        if self.action == 'retrieve':
            return queryset
        
        if not self.is_common:
            item = self.get_item_opts(self.item_type)
            qs = self.update_item_queryset(queryset, item, False)
            return super().filter_queryset(qs)
        return queryset
    
    def get_item_opts(self, item_type: int)->list:
        item = self.template[item_type]
        value_expr = item.get('value', F('pk'))

        return {
            'label_expr': MasterTreeViewSet.get_item_expression(item['label']),
            'value_expr': F(value_expr),
            'parent_expr': F(item.get('parent', 'parent')),
            'type': item_type
        }

    def make_queryset(self)->QuerySet:
        qs: QuerySet|None = None
        for i in range(0, len(self.template)):
            options = self.get_item_opts(i)
            sub_qs = self.apply_backend_filters(
                self.update_item_queryset(self.template[i]['queryset'], options),
                ['OrderingFilter']
            )

            if qs is None: qs = sub_qs
            else: qs = qs.union(sub_qs)

        qs = self.apply_backend_filter('OrderingFilter', qs)
        return qs
    
    def update_item_queryset(self, qs:QuerySet, options:dict, subquery:bool=True)->QuerySet:
        item:dict = self.template[options['type']]

        #Make has items annotation
        if options['type'] == self.main_type: has_items = self.has_items_queryset()
        else: has_items = Value(False)

        #Apply annotations
        annotations = {
            'label': options['label_expr'],
            'value': options['value_expr'],
            'parent': options['parent_expr'],
            'has_items': has_items,
            'type': Value(options['type']),
        }
        annotations_to_add = {k: v for k, v in annotations.items() if not model_field_exists(qs.model, k)}
        qs = qs.annotate(**annotations_to_add)

        #Apply parent if not search
        if not self.is_search and self.action != 'retrieve':
            parent_key = item.get('parent', 'parent')
            qs = qs.filter(**{parent_key: self.parent})

        if subquery:
            qs = qs.order_by().values(*annotations.keys())        
        return qs

    def get_serializer(self, *args, **kwargs):
        if self.is_common and self.action != 'retrieve':
            return TreeItemsData(*args)
        ser = super().get_serializer(*args, **kwargs)
        return ser

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
        if isinstance(item['label'], F): 
            label = '{{%s}}' % item['label'].name 
        else: label = item['label']

        info = {
            'class_name': model.__name__,
            'type': item_type,
            'name': model._meta.verbose_name,
            'plural_name': model._meta.verbose_name_plural,
            'parent': item.get('parent', 'parent'),
            'id': model._meta.pk.name,
            'label': label
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