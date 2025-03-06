from django.urls import path, include
from .api import registry
from .views import get_models


urlpatterns = [
    path('js/models.js', get_models, name= 'models_info_js'),
    path('', include(registry.urls), name= 'models_base'),
]
