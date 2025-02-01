from django.db.models import Q
from django.core.exceptions import FieldError
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
import json, logging

from ..utils import flatten_data_object, jqx_grid_config
from ..pagination import MasterPagination

CONDITION_MAP = {
    'CONTAINS': '__icontains',
    'DOES_NOT_CONTAIN': '__icontains',
    'EQUAL': '__exact',
    'NOT_EQUAL': '__exact',
    'GREATER_THAN': '__gt',
    'LESS_THAN': '__lt',
    'GREATER_THAN_OR_EQUAL': '__gte',
    'LESS_THAN_OR_EQUAL': '__lte',
    'STARTS_WITH': '__istartswith',
    'ENDS_WITH': '__iendswith',
    'NULL': '__isnull',
    'NOT_NULL': '__isnull'
}

logger = logging.getLogger(__name__)


class MasterGridViewSet(viewsets.ModelViewSet):
    pagination_class = MasterPagination
    
    class Meta:
        abstract = True

    def filter_queryset(self, qs):
        qs = super().filter_queryset(qs)
        if self.action == 'list':
            # Обработка фильтров jqxGrid
            qs = self.apply_jqx_filters(qs)
            #Обработка параметров сортировки jqxGrid
            qs = self.apply_jqx_sorting(qs)

        return qs
    
    def apply_jqx_filters(self, queryset):
        filter_groups = self.request.GET.get('filterGroups')
        if not filter_groups:
            return queryset

        try:
            filter_groups = json.loads(filter_groups)
            q_objects = Q()
            
            for group in filter_groups:
                field = group.get('field', None)
                filters = group.get('filters', None)
                q_group = Q()
                # Пропускаем невалидные группы
                if field is None or filters is None:
                    continue

                for flt in filters:
                    condition = flt.get('condition', None)
                    val = flt.get('value', None)
                    operator = flt.get('operator', 'and').lower()
                    # Пропускаем невалидные фильтры
                    if condition is None:
                        continue

                    if condition in ['NULL', 'NOT_NULL']:
                        val = True
                    elif condition in ['EQUAL', 'NOT_EQUAL'] or val is None:
                        condition = 'NULL' if condition == 'EQUAL' else 'NOT_NULL'
                        val = True

                    # Создаем Q-объект для условия
                    lookup = CONDITION_MAP.get(condition, '__exact')
                    q_obj = Q(**{f"{field}{lookup}": val})

                    # Инвертируем условие для NOT-фильтров
                    if condition in ['DOES_NOT_CONTAIN', 'NOT_EQUAL']:
                        q_obj = ~q_obj

                    # Комбинируем условия
                    if operator == 'or':  # OR
                        q_group |= q_obj
                    else:  # AND (по умолчанию)
                        q_group &= q_obj

                #Добавляем фильтры группы к остальным
                q_objects &= q_group
            #Применяем фильтры
            queryset = queryset.filter(q_objects)
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.error(f"FilterGroups parsing error: {str(e)}")
        return queryset
    
    def apply_jqx_sorting(self, queryset):
        sorting = self.request.GET.get('sorting', None)
        if sorting is None:
            return queryset
        
        sorting = json.loads(sorting)
        order_by = []

        try:
            for sort_item in sorting:
                field_name = sort_item[0]
                if not bool(sort_item[1]):
                    field_name = '-' + field_name
                order_by.append(field_name)

            if order_by:
                queryset = queryset.order_by(*order_by)

        except json.JSONDecodeError as e:
            logger.error(f"Ошибка парсинга сортировки: {str(e)}")
        except FieldError as e:
            logger.error(f"Некорректное поле для сортировки: {str(e)}")
        except Exception as e:
            logger.error(f"Неизвестная ошибка сортировки: {str(e)}")
            
        return queryset

    
    def list(self, request, *args, **kwargs):
        # Получаем стандартный ответ
        response = super().list(request, *args, **kwargs)
        
        # Преобразуем данные для jqxGrid
        flattened_data = []
        for item in response.data['results']:
            flattened = flatten_data_object(item)
            flattened_data.append(flattened)
        
        response.data['results'] = flattened_data

        return response

    @action(url_path='config', url_name='grid_config', methods=['GET', 'OPTIONS'], detail=False)
    def grid_config(self, request, *args, **kwargs):
        config = jqx_grid_config(self.get_serializer())
        return Response(data=config)