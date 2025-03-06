from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.decorators import action
from .serializers import ChoiseItemSerializer

class MasterModelViewSet(ModelViewSet):
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]

    def get_serializer_class(self):
        match self.action:
            case 'choices_list':
                return ChoiseItemSerializer
        return super().get_serializer_class()

    @action(url_path='choices', url_name='choices_list', methods=['GET'], detail=False)
    def choices_list(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)