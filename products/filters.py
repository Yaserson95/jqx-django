from rest_framework.filters import SearchFilter

class ProductViewSet(viewsets.ModelViewSet):
    filter_backends = [SearchFilter]
    search_fields = ['name', 'category']