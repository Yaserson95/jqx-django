from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import ProductViewSet
from .views import grid_view
router = DefaultRouter()
router.register(r'', ProductViewSet)

urlpatterns = [
    path('grid/', include(router.urls), name='products_grid_data'),
    path('', grid_view, name='products'),
]