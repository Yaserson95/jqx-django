from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.decorators import action
from .serializers import ChoiseItemSerializer
from .pagination import MasterPagination

class MasterModelViewSet(ModelViewSet):
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    pagination_class = MasterPagination

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        values = self.request.GET.get('values', '')
        
        if values != '':
            queryset = queryset.filter(pk__in=values.split(','))
        return queryset
    
    def get_serializer_class(self):
        print(self.action)
        match self.action:
            case 'choices_list':
                return ChoiseItemSerializer
            case 'choices_retrieve':
                return ChoiseItemSerializer
        return super().get_serializer_class()

    @action(url_path='choices', url_name='choices_list', methods=['GET'], detail=False)
    def choices_list(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    @action(url_path='choices/(?P<pk>[^/.]+)', url_name='choices_detail', methods=['GET'], detail=False)
    def choices_retrieve(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)