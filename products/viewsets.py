from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from master_widgets.grid import MasterGridViewSet

from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(MasterGridViewSet):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['name', 'category__name']
    ordering_fields = ['name', 'price', 'category__name', 'created_at']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Поиск
    search_fields = ['name', 'category']
    
    # Сортировка
    ordering_fields = '__all__'
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Фильтрация по имени
        queryset = super().get_queryset()
        name = self.request.query_params.get('name')
        if name:
            queryset = queryset.filter(name__icontains=name)
        return queryset
