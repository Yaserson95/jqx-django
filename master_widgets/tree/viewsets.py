from django.db.models import QuerySet, Value, F, OuterRef, Exists, Case, When, Expression
from django.http.response import Http404
from django.core.exceptions import ValidationError as DValidationError
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import action

from ..exceptions import ValidateOptionsException
from rest_framework.exceptions import ValidationError

from ..helpers import model_field_exists, expr, validate_options
from ..form_templates import from_model

CHILDREN_TYPE_PATTERNS = {
    'queryset': {'type': QuerySet,},
    'value': {'type': (str, Expression,), 'default': 'pk'},
    'label': {'type': (str, Expression,), },
    'parent': {'type': str, 'default': 'parent'},
    'name': {'type': str, 'required': False},
    'verbose_name': {'type': str, 'required': False},
    'extra': {'type':dict, 'required': False},
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

    extra_item: dict|None = None

    class Meta:
        abstract = True


    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if hasattr(self, 'children_nodes'):
            self.validate_children_nodes()

    def filter_queryset(self, qs: QuerySet):
        item_type = int(self.request.GET.get('item_type', 0))

        try:
            if self.action == 'list':
                qs = self.list_queryset(qs, self.get_parent())
            elif item_type > 0 and hasattr(self, 'children_nodes'):
                qs = self.children_nodes[item_type - 1]['queryset']
        except IndexError:
            raise Http404('Item type not found')

        return super().filter_queryset(qs)
    
    def list_queryset(self, qs:QuerySet, parent=None):
        excludes = self.get_excludes()
        qs = qs.filter(**{self.parent_field: parent})     
        qs = self.update_queryset(qs, 
            value_field=getattr(self, 'value_field'), 
            label_field=getattr(self, 'label_field'),
            has_items=self.has_items_queryset()
        )

        if 0 in excludes:
            qs = qs.exclude(pk__in=excludes[0])

        if not hasattr(self, 'children_nodes') or parent is None:
            return qs
        
        qs = qs.order_by()
        for i in range(0, len(self.children_nodes)):
            clild_qs = self.get_childeren_queryset(i, parent).order_by()
            if i + 1 in excludes:
                clild_qs = clild_qs.exclude(pk__in=excludes[i + 1])
            qs = qs.union(clild_qs)

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
        
        return self.update_queryset(
            qs = node['queryset'], 
            value_field = node['value'], 
            label_field = node['label'],
            parent_field = node['parent'], 
            index = index + 1
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
    
    @action(['GET', 'OPTION'], False, 'form/(?P<type>[0-9]+)', 'tree_form_info')
    def form(self, request:Request, *args, **kwargs)->Response:
        form_type = int(kwargs.get('type', 0))
        try:
            if form_type == 0:
                template = from_model(self.get_queryset().model)
            else:
                template = from_model(self.children_nodes[form_type - 1]['queryset'].model)
        except IndexError:
            raise Http404
        return Response({'template':template})
    
    @action(['GET', 'OPTION'], False, 'config', 'tree_fors')
    def config(self, request:Request, *args, **kwargs)->Response:
        forms = self.get_item_types()
        return Response({
            'itemTypes':forms,
            'itemsMenu': True,
        })
    
    def get_item_types(self):
        types = [self.get_model_info(self.get_queryset().model, 0, self.extra_item)]
        if not hasattr(self, 'children_nodes'):
            return types
        
        for i, e in enumerate(self.children_nodes):
            node = self.get_model_info(e['queryset'].model, i+1, e.get('extra', None))

            for key in ['name', 'plural_name']:
                if key in e: node[key] = e[key]
                
            types.append(node)

        return types
    
    def get_model_info(self, model, index:int=0, extra:dict|None = None):
        info = {
            'className': model.__name__,
            'type': index,
            'name': model._meta.verbose_name,
            'plural_name': model._meta.verbose_name_plural,
            'rules': self.get_object_rules(index),
            'parent': self.get_parent_field(index),
            'id': model._meta.pk.name
        }

        if extra is not None:
            extra.update(info)
            return extra
        return info
    
    def get_object_rules(self, item_type=0):
        if item_type == 0:
            return [True, True, True]
        return [False, True, True]
    
    def get_parent_field(self, index:int):
        if index == 0:
            return self.parent_field
        return self.children_nodes[index - 1]['parent']
    
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
        try:
            for i, e in enumerate(self.children_nodes):
                validate_options(e, CHILDREN_TYPE_PATTERNS)
        except ValidateOptionsException as e:
            raise ValidateOptionsException('In %d children node: %s' % (i, e.args[0]))
        
    def perform_update(self, serializer):
        try:
            return super().perform_update(serializer)
        except DValidationError as e:
            raise ValidationError({e.params['name']: [e.message,]})
        
    def get_excludes(self)->dict:
        r = self.request.GET.get('exclude', None)
        excludes = {}

        if r is None:
            return {}

        for item in r.split(';'):
            e = item.split(',')
            key = int(e[0])
            if key not in excludes:
                excludes[key] = []
            excludes[key].append(int(e[1]))
        return excludes